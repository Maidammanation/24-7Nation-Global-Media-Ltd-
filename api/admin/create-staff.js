const {
  getFirebaseServices,
  getRequestId,
  handleApiError,
  requireOwner,
  sendJson
} = require("../_lib/firebase-admin");
const { validateNewStaffInput } = require("../_lib/validation");

module.exports = async function handler(req, res) {
  let createdUid = null;
  let auth = null;

  try {
    const actor = await requireOwner(req);
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const input = validateNewStaffInput(req.body);
    const services = getFirebaseServices();
    auth = services.auth;
    const { db, FieldValue } = services;
    const assignments = db.collection("roleAssignments");
    const auditEvents = db.collection("auditEvents");
    const requestId = getRequestId(req);

    // Create the Firebase account without setting or exposing a password.
    const user = await auth.createUser({
      email: input.email,
      displayName: input.displayName,
      emailVerified: false,
      disabled: false
    });
    createdUid = user.uid;

    const assignmentRef = assignments.doc();
    const auditRef = auditEvents.doc();

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(
        assignments.where("uid", "==", user.uid).limit(100)
      );
      const duplicate = existing.docs.some((doc) => {
        const data = doc.data();
        return data.status === "active" &&
          data.role === input.role &&
          JSON.stringify([...(data.departmentCodes || [])].sort()) ===
            JSON.stringify([...input.departmentCodes].sort());
      });
      if (duplicate) {
        const error = new Error("An active assignment with the same role and scope already exists.");
        error.code = "CONFLICT";
        error.publicMessage = error.message;
        throw error;
      }

      transaction.create(assignmentRef, {
        uid: user.uid,
        displayName: input.displayName,
        email: input.email,
        role: input.role,
        departmentCodes: input.departmentCodes,
        permissions: [],
        status: "active",
        assignedByUid: actor.uid,
        assignedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        reason: input.reason,
        accountCreatedAt: FieldValue.serverTimestamp()
      });

      transaction.create(auditRef, {
        actorUid: actor.uid,
        actorRoleAtTime: "owner",
        action: "staff_account.created",
        resourceType: "staffAccount",
        resourceId: user.uid,
        outcome: "success",
        occurredAt: FieldValue.serverTimestamp(),
        reason: input.reason,
        requestId,
        metadata: {
          targetUid: user.uid,
          email: input.email,
          displayName: input.displayName,
          role: input.role,
          departmentCodes: input.departmentCodes
        }
      });
    });

    // The owner shares this one-time Firebase password-reset link with the new staff member.
    const invitationLink = await auth.generatePasswordResetLink(input.email);
    createdUid = null; // Account and role are committed; do not roll back after link generation.

    return sendJson(res, 201, {
      message: "Staff account and role created.",
      staff: {
        uid: user.uid,
        displayName: input.displayName,
        email: input.email,
        role: input.role,
        departmentCodes: input.departmentCodes,
        status: "active"
      },
      invitationLink,
      invitationNote: "Share this password-setup link privately with the staff member. Do not post it publicly."
    });
  } catch (error) {
    if (createdUid && auth) {
      try { await auth.deleteUser(createdUid); } catch {}
    }
    if (error.code === "auth/email-already-exists") {
      error.code = "CONFLICT";
      error.publicMessage = "An account with this email already exists. Use the existing-account assignment option instead.";
    } else if (error.code === "auth/invalid-email") {
      error.code = "INVALID_INPUT";
      error.publicMessage = "Firebase rejected this email address. Check it and try again.";
    } else if (error.code === "auth/insufficient-permission") {
      error.code = "SERVER_CONFIGURATION_MISSING";
    }
    return handleApiError(res, error);
  }
};
