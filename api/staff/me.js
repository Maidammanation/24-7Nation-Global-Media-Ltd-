const {
  getFirebaseServices,
  handleApiError,
  sendJson
} = require("../_lib/firebase-admin");

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  if (!host) return false;
  try {
    return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { error: "Method not allowed." });
    }
    if (!sameOrigin(req)) {
      const error = new Error("Request origin is not allowed.");
      error.code = "FORBIDDEN";
      throw error;
    }

    const match = String(req.headers.authorization || "").match(/^Bearer\\s+(.+)$/i);
    if (!match) {
      const error = new Error("Authentication is required.");
      error.code = "UNAUTHENTICATED";
      throw error;
    }

    const { auth, db } = getFirebaseServices();
    let decoded;
    try {
      decoded = await auth.verifyIdToken(match[1], true);
    } catch {
      const error = new Error("Authentication is invalid or expired.");
      error.code = "UNAUTHENTICATED";
      throw error;
    }

    if (decoded.uid === process.env.OWNER_UID) {
      const error = new Error("Use the CEO Control Centre for owner access.");
      error.code = "FORBIDDEN";
      throw error;
    }

    const user = await auth.getUser(decoded.uid);
    if (user.disabled) {
      const error = new Error("This account is disabled.");
      error.code = "FORBIDDEN";
      throw error;
    }

    const snapshot = await db.collection("roleAssignments")
      .where("uid", "==", decoded.uid)
      .get();

    const assignments = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.id,
        role: item.role,
        departmentCodes: Array.isArray(item.departmentCodes) ? item.departmentCodes : [],
        status: item.status,
        assignedAt: item.assignedAt || null
      }));

    if (!assignments.length) {
      const error = new Error("No active staff access is assigned to this account. Contact the organisation owner.");
      error.code = "NOT_FOUND";
      throw error;
    }

    return sendJson(res, 200, {
      staff: {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        emailVerified: Boolean(user.emailVerified)
      },
      assignments
    });
  } catch (error) {
    return handleApiError(res, error);
  }
};
