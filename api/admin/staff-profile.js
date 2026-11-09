const { getFirebaseServices, getRequestId, handleApiError, requireOwner, sendJson } = require("../_lib/firebase-admin");

function invalid(message) { const error = new Error(message); error.code = "INVALID_INPUT"; error.publicMessage = message; return error; }

module.exports = async function handler(req, res) {
  try {
    const actor = await requireOwner(req);
    if (req.method !== "PATCH") { res.setHeader("Allow", "PATCH"); return sendJson(res, 405, { error: "Method not allowed." }); }
    const uid = String(req.body?.uid || "").trim();
    const displayName = String(req.body?.displayName || "").trim();
    const reason = String(req.body?.reason || "").trim();
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(uid)) throw invalid("A valid staff account identifier is required.");
    if (uid === actor.uid || uid === process.env.OWNER_UID) { const e = new Error("The owner profile cannot be edited here."); e.code = "FORBIDDEN"; throw e; }
    if (displayName.length < 2 || displayName.length > 100) throw invalid("Enter a name between 2 and 100 characters.");
    if (reason.length < 5 || reason.length > 500) throw invalid("Provide a reason between 5 and 500 characters.");
    const { auth, db, FieldValue } = getFirebaseServices();
    const user = await auth.getUser(uid);
    const previousName = user.displayName || "";
    await auth.updateUser(uid, { displayName });
    try {
      await db.collection("auditEvents").add({
        actorUid: actor.uid, actorRoleAtTime: "owner", action: "staff_profile.updated",
        resourceType: "staffAccount", resourceId: uid, outcome: "success",
        occurredAt: FieldValue.serverTimestamp(), reason, requestId: getRequestId(req),
        metadata: { targetUid: uid, previousDisplayName: previousName, displayName }
      });
    } catch {
      try { await auth.updateUser(uid, { displayName: previousName }); }
      catch { const e = new Error("The profile changed but its audit record failed, and automatic restoration failed. Check the staff profile and audit history."); e.code = "ACCOUNT_STATE_UNCERTAIN"; throw e; }
      const e = new Error("The audit record could not be saved. The previous profile name was restored."); e.code = "AUDIT_WRITE_FAILED"; throw e;
    }
    return sendJson(res, 200, { staff: { uid, displayName }, message: "Staff profile updated." });
  } catch (error) { return handleApiError(res, error); }
};
