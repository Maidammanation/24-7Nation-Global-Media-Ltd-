const {
  getFirebaseServices,
  getRequestId,
  handleApiError,
  requireOwner,
  sendJson
} = require("../_lib/firebase-admin");
const {
  validateAssignmentInput,
  validateRevokeInput
} = require("../_lib/validation");

module.exports = async function handler(req, res) {
  try {
    const actor = await requireOwner(req);
    const { db, auth, FieldValue } = getFirebaseServices();
    const assignments = db.collection("roleAssignments");
    const auditEvents = db.collection("auditEvents");
    const requestId = getRequestId(req);

    if (req.method === "GET") {
      const snapshot = await assignments.orderBy("assignedAt", "desc").limit(100).get();
      const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return sendJson(res, 200, { assignments: records });
    }

    if (req.method === "POST") {
      const input = validateAssignmentInput(req.body);

      try {
        await auth.getUser(input.uid);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          const invalid = new Error("The target Firebase account does not exist.");
          invalid.code = "INVALID_INPUT";
          invalid.publicMessage = invalid.message;
          throw invalid;
        }
        throw error;
      }

      const assignmentRef = assignments.doc();
      const auditRef = auditEvents.doc();

      await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(
          assignments.where("uid", "==", input.uid).limit(100)
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
          uid: input.uid,
          role: input.role,
          departmentCodes: input.departmentCodes,
          permissions: [],
          status: "active",
          assignedByUid: actor.uid,
          assignedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          reason: input.reason
        });

        transaction.create(auditRef, {
          actorUid: actor.uid,
          actorRoleAtTime: "owner",
          action: "role_assignment.created",
          resourceType: "roleAssignment",
          resourceId: assignmentRef.id,
          outcome: "success",
          occurredAt: FieldValue.serverTimestamp(),
          reason: input.reason,
          requestId,
          metadata: {
            targetUid: input.uid,
            role: input.role,
            departmentCodes: input.departmentCodes
          }
        });
      });

      return sendJson(res, 201, {
        assignment: {
          id: assignmentRef.id,
          uid: input.uid,
          role: input.role,
          departmentCodes: input.departmentCodes,
          status: "active"
        }
      });
    }

    if (req.method === "PATCH") {
      const input = validateRevokeInput(req.body);
      const assignmentRef = assignments.doc(input.assignmentId);
      const auditRef = auditEvents.doc();

      const revoked = await db.runTransaction(async (transaction) => {
        const assignmentSnapshot = await transaction.get(assignmentRef);
        if (!assignmentSnapshot.exists) {
          const error = new Error("Assignment not found.");
          error.code = "NOT_FOUND";
          throw error;
        }

        const current = assignmentSnapshot.data();
        if (current.role === "owner") {
          const error = new Error("The owner assignment cannot be changed here.");
          error.code = "FORBIDDEN";
          throw error;
        }
        if (current.status !== "active") {
          const error = new Error("This assignment is no longer active.");
          error.code = "CONFLICT";
          error.publicMessage = error.message;
          throw error;
        }

        transaction.update(assignmentRef, {
          status: "revoked",
          updatedAt: FieldValue.serverTimestamp(),
          reason: input.reason
        });

        transaction.create(auditRef, {
          actorUid: actor.uid,
          actorRoleAtTime: "owner",
          action: "role_assignment.revoked",
          resourceType: "roleAssignment",
          resourceId: assignmentRef.id,
          outcome: "success",
          occurredAt: FieldValue.serverTimestamp(),
          reason: input.reason,
          requestId,
          metadata: {
            targetUid: current.uid,
            role: current.role,
            departmentCodes: current.departmentCodes || []
          }
        });

        return {
          id: assignmentRef.id,
          uid: current.uid,
          role: current.role,
          status: "revoked"
        };
      });

      return sendJson(res, 200, { assignment: revoked });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return handleApiError(res, error);
  }
};
