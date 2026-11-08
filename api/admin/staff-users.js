const {
  getFirebaseServices,
  getRequestId,
  handleApiError,
  requireOwner,
  sendJson
} = require("../_lib/firebase-admin");

function invalid(message) {
  const error = new Error(message);
  error.code = "INVALID_INPUT";
  error.publicMessage = message;
  return error;
}

module.exports = async function handler(req, res) {
  try {
    const actor = await requireOwner(req);
    const { auth, db, FieldValue } = getFirebaseServices();
    const assignmentsRef = db.collection("roleAssignments");
    const auditRef = db.collection("auditEvents");

    if (req.method === "GET") {
      const snapshot = await assignmentsRef.orderBy("assignedAt", "desc").limit(500).get();
      const grouped = new Map();
      for (const doc of snapshot.docs) {
        const assignment = { id: doc.id, ...doc.data() };
        if (!assignment.uid || assignment.uid === actor.uid) continue;
        if (!grouped.has(assignment.uid)) grouped.set(assignment.uid, []);
        grouped.get(assignment.uid).push({
          id: assignment.id,
          role: assignment.role || "",
          departmentCodes: Array.isArray(assignment.departmentCodes) ? assignment.departmentCodes : [],
          status: assignment.status || "unknown",
          assignedAt: assignment.assignedAt && typeof assignment.assignedAt.toDate === "function"
            ? assignment.assignedAt.toDate().toISOString() : null
        });
      }

      const users = await Promise.all([...grouped.entries()].map(async ([uid, userAssignments]) => {
        try {
          const user = await auth.getUser(uid);
          return {
            uid: user.uid,
            displayName: user.displayName || user.email || "Unnamed staff member",
            email: user.email || "",
            disabled: Boolean(user.disabled),
            emailVerified: Boolean(user.emailVerified),
            createdAt: user.metadata && user.metadata.creationTime || null,
            lastSignInAt: user.metadata && user.metadata.lastSignInTime || null,
            assignments: userAssignments
          };
        } catch (error) {
          if (error.code === "auth/user-not-found") return null;
          throw error;
        }
      }));

      return sendJson(res, 200, {
        staff: users.filter(Boolean),
        returned: users.filter(Boolean).length,
        truncated: snapshot.size === 500
      });
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const uid = String(body.uid || "").trim();
      const reason = String(body.reason || "").trim();
      if (!/^[A-Za-z0-9_-]{20,128}$/.test(uid)) throw invalid("A valid staff account identifier is required.");
      if (uid === actor.uid || uid === process.env.OWNER_UID) {
        const error = new Error("The organisation owner account cannot be changed here.");
        error.code = "FORBIDDEN";
        throw error;
      }
      if (typeof body.disabled !== "boolean") throw invalid("Choose whether the staff account should be suspended or reactivated.");
      if (reason.length < 5 || reason.length > 500) throw invalid("Provide a reason between 5 and 500 characters.");

      const user = await auth.getUser(uid);
      if (body.disabled === false) {
        const active = await assignmentsRef.where("uid", "==", uid).get();
        const hasActiveAssignment = active.docs.some(doc => doc.data().status === "active");
        if (!hasActiveAssignment) {
          const error = new Error("This account has no active role assignment. Restore an authorised role before reactivating it.");
          error.code = "CONFLICT";
          error.publicMessage = error.message;
          throw error;
        }
      }
      if (Boolean(user.disabled) === body.disabled) {
        const error = new Error(body.disabled ? "This account is already suspended." : "This account is already active.");
        error.code = "CONFLICT";
        error.publicMessage = error.message;
        throw error;
      }

      await auth.updateUser(uid, { disabled: body.disabled });
      await auditRef.add({
        actorUid: actor.uid,
        actorRoleAtTime: "owner",
        action: body.disabled ? "staff_account.suspended" : "staff_account.reactivated",
        resourceType: "staffAccount",
        resourceId: uid,
        outcome: "success",
        occurredAt: FieldValue.serverTimestamp(),
        reason,
        requestId: getRequestId(req),
        metadata: {
          targetUid: uid,
          email: user.email || "",
          displayName: user.displayName || "",
          disabled: body.disabled
        }
      });

      return sendJson(res, 200, {
        staff: { uid, disabled: body.disabled },
        message: body.disabled ? "Staff account suspended." : "Staff account reactivated."
      });
    }

    res.setHeader("Allow", "GET, PATCH");
    return sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return handleApiError(res, error);
  }
};
