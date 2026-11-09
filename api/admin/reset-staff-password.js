const crypto = require("node:crypto");
const { getFirebaseServices, getRequestId, handleApiError, requireOwner, sendJson } = require("../_lib/firebase-admin");
module.exports = async function handler(req, res) {
  try {
    const actor = await requireOwner(req);
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed." }); }
    const { uid, reason } = req.body || {};
    if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{20,128}$/.test(uid)) { const error = new Error("A valid staff account identifier is required."); error.code = "INVALID_INPUT"; throw error; }
    if (uid === actor.uid || uid === process.env.OWNER_UID) { const error = new Error("Owner account cannot be reset here."); error.code = "FORBIDDEN"; throw error; }
    if (typeof reason !== "string" || reason.trim().length < 5 || reason.trim().length > 500) { const error = new Error("Provide a reason between 5 and 500 characters."); error.code = "INVALID_INPUT"; throw error; }
    const { auth, db, FieldValue } = getFirebaseServices();
    const assigned = await db.collection("roleAssignments").where("uid", "==", uid).get();
    if (!assigned.docs.some(doc => doc.data().status === "active")) { const error = new Error("This account has no active staff assignment."); error.code = "CONFLICT"; throw error; }
    const user = await auth.getUser(uid);
    if (user.disabled) { const error = new Error("Reactivate this suspended account before resetting its password."); error.code = "CONFLICT"; throw error; }
    const temporaryPassword = crypto.randomBytes(18).toString("base64url");
    const securityRef = db.collection("staffSecurity").doc(uid);
    const previous = await securityRef.get();
    await securityRef.set({ mustChangePassword: true, resetAt: FieldValue.serverTimestamp(), resetByUid: actor.uid, resetReason: reason.trim() }, { merge: true });
    try { await auth.updateUser(uid, { password: temporaryPassword }); }
    catch (error) { if (previous.exists) await securityRef.set(previous.data()); else await securityRef.delete(); throw error; }
    try {
      await db.collection("auditEvents").add({ actorUid: actor.uid, actorRoleAtTime: "owner", action: "staff_account.password_reset", resourceType: "staffAccount", resourceId: uid, outcome: "success", occurredAt: FieldValue.serverTimestamp(), reason: reason.trim(), requestId: getRequestId(req), metadata: { targetUid: uid, email: user.email || "" } });
    } catch {
      return sendJson(res, 503, { error: "Password was reset and a new password is required at next sign-in, but audit recording failed. Do not repeat the reset; contact support." });
    }
    return sendJson(res, 200, { message: "Password reset. Staff must choose a new password at next sign-in.", temporaryPassword });
  } catch (error) { return handleApiError(res, error); }
};
