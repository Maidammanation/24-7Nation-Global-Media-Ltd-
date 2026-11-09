const { getFirebaseServices, handleApiError, sendJson } = require("../_lib/firebase-admin");
module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed." }); }
    const match = String(req.headers.authorization || "").match(/^Bearer\\s+(.+)$/i);
    if (!match) { const error = new Error("Authentication is required."); error.code = "UNAUTHENTICATED"; throw error; }
    const { auth, db, FieldValue } = getFirebaseServices();
    const decoded = await auth.verifyIdToken(match[1], true);
    if (decoded.uid === process.env.OWNER_UID) { const error = new Error("Staff only."); error.code = "FORBIDDEN"; throw error; }
    const ref = db.collection("staffSecurity").doc(decoded.uid);
    const state = await ref.get();
    if (state.exists && state.data().mustChangePassword === true) {
      await ref.set({ mustChangePassword: false, passwordChangedAt: FieldValue.serverTimestamp() }, { merge: true });
      await db.collection("auditEvents").add({ actorUid: decoded.uid, actorRoleAtTime: "staff", action: "staff_account.password_changed", resourceType: "staffAccount", resourceId: decoded.uid, outcome: "success", occurredAt: FieldValue.serverTimestamp(), reason: "Staff completed mandatory password change." });
    }
    return sendJson(res, 200, { message: "Password change confirmed." });
  } catch (error) { return handleApiError(res, error); }
};