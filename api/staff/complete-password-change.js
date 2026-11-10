const { getFirebaseServices, handleApiError, sendJson } = require("../_lib/firebase-admin");

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  if (!host) return false;
  try { return new URL(origin).host.toLowerCase() === String(host).toLowerCase(); }
  catch { return false; }
}
module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed." }); }
    if (!sameOrigin(req)) { const error = new Error("Request origin is not allowed."); error.code = "FORBIDDEN"; throw error; }
    const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
    if (!match) { const error = new Error("Authentication is required."); error.code = "UNAUTHENTICATED"; throw error; }
    const { auth, db, FieldValue } = getFirebaseServices();
    const decoded = await auth.verifyIdToken(match[1], true);
    if (decoded.uid === process.env.OWNER_UID) { const error = new Error("Staff only."); error.code = "FORBIDDEN"; throw error; }
    const assignments = await db.collection("roleAssignments").where("uid", "==", decoded.uid).get();
    if (!assignments.docs.some(doc => doc.data().status === "active")) { const error = new Error("No active staff assignment."); error.code = "FORBIDDEN"; throw error; }
    const user = await auth.getUser(decoded.uid);
    if (user.disabled) { const error = new Error("This staff account is disabled."); error.code = "FORBIDDEN"; throw error; }
    const ref = db.collection("staffSecurity").doc(decoded.uid);
    const state = await ref.get();
    if (state.exists && state.data().mustChangePassword === true) {
      await ref.set({ mustChangePassword: false, passwordChangedAt: FieldValue.serverTimestamp() }, { merge: true });
      await db.collection("auditEvents").add({ actorUid: decoded.uid, actorRoleAtTime: "staff", action: "staff_account.password_changed", resourceType: "staffAccount", resourceId: decoded.uid, outcome: "success", occurredAt: FieldValue.serverTimestamp(), reason: "Staff completed mandatory password change." });
    }
    return sendJson(res, 200, { message: "Password change confirmed." });
  } catch (error) { return handleApiError(res, error); }
};