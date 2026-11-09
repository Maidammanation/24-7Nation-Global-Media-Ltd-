const { getFirebaseServices, getRequestId, handleApiError, requireOwner, sendJson } = require("../_lib/firebase-admin");

function invalid(message) { const error = new Error(message); error.code = "INVALID_INPUT"; error.publicMessage = message; return error; }

module.exports = async function handler(req, res) {
  try {
    const actor = await requireOwner(req);
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed." }); }
    const uid = String(req.body?.uid || "").trim();
    const reason = String(req.body?.reason || "").trim();
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(uid)) throw invalid("A valid staff account identifier is required.");
    if (uid === actor.uid || uid === process.env.OWNER_UID) { const e = new Error("The organisation owner cannot be removed."); e.code = "FORBIDDEN"; throw e; }
    if (reason.length < 5 || reason.length > 500) throw invalid("Provide a reason between 5 and 500 characters.");
    const { auth, db, FieldValue } = getFirebaseServices();
    const user = await auth.getUser(uid);
    if (user.disabled) { const e = new Error("This staff account is already suspended or archived."); e.code = "CONFLICT"; e.publicMessage = e.message; throw e; }
    const assignments = db.collection("roleAssignments");
    const audit = db.collection("auditEvents").doc();
    await auth.updateUser(uid, { disabled: true });
    try {
      await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(assignments.where("uid", "==", uid));
        const active = snapshot.docs.filter(doc => doc.data().status === "active");
        for (const doc of active) transaction.update(doc.ref, {
          status: "revoked", updatedAt: FieldValue.serverTimestamp(),
          reason: "Staff account archived: " + reason
        });
        transaction.create(audit, {
          actorUid: actor.uid, actorRoleAtTime: "owner", action: "staff_account.archived",
          resourceType: "staffAccount", resourceId: uid, outcome: "success",
          occurredAt: FieldValue.serverTimestamp(), reason, requestId: getRequestId(req),
          metadata: { targetUid: uid, email: user.email || "", displayName: user.displayName || "", revokedAssignments: active.length, accountDisabled: true, retainedForAudit: true }
        });
      });
    } catch (error) {
      try { await auth.updateUser(uid, { disabled: false }); }
      catch { const e = new Error("The archive operation failed and the account could not be re-enabled automatically. Check account status and audit history."); e.code = "ACCOUNT_STATE_UNCERTAIN"; throw e; }
      throw error;
    }
    return sendJson(res, 200, { staff: { uid, disabled: true, archived: true }, message: "Staff account archived, sign-in disabled and active assignments revoked. Historical records were retained." });
  } catch (error) { return handleApiError(res, error); }
};
