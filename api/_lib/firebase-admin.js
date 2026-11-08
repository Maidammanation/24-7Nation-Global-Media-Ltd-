const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const PROJECT_ID = "nation-global-media";

function getFirebaseServices() {
  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) {
    const error = new Error("Server credentials are not configured.");
    error.code = "SERVER_CONFIGURATION_MISSING";
    throw error;
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    const error = new Error("Server credentials are invalid.");
    error.code = "SERVER_CONFIGURATION_INVALID";
    throw error;
  }

  if (
    credentials.project_id !== PROJECT_ID ||
    !credentials.client_email ||
    !credentials.private_key
  ) {
    const error = new Error("Server credentials do not match the configured Firebase project.");
    error.code = "SERVER_CONFIGURATION_INVALID";
    throw error;
  }

  const appName = "247nation-secure-api";
  const app =
    getApps().find((existing) => existing.name === appName) ||
    initializeApp(
      {
        credential: cert(credentials),
        projectId: PROJECT_ID
      },
      appName
    );

  return {
    auth: getAuth(app),
    db: getFirestore(app),
    FieldValue
  };
}

function setPrivateResponseHeaders(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function sendJson(res, status, payload) {
  setPrivateResponseHeaders(res);
  return res.status(status).json(payload);
}

function isSameOriginRequest(req) {
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

async function requireOwner(req) {
  if (!isSameOriginRequest(req)) {
    const error = new Error("Request origin is not allowed.");
    error.code = "FORBIDDEN_ORIGIN";
    throw error;
  }

  const ownerUid = process.env.OWNER_UID;
  if (!ownerUid) {
    const error = new Error("Owner identity is not configured.");
    error.code = "SERVER_CONFIGURATION_MISSING";
    throw error;
  }

  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error("Authentication is required.");
    error.code = "UNAUTHENTICATED";
    throw error;
  }

  const { auth } = getFirebaseServices();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(match[1], true);
  } catch {
    const error = new Error("Authentication is invalid or expired.");
    error.code = "UNAUTHENTICATED";
    throw error;
  }

  if (decoded.uid !== ownerUid) {
    const error = new Error("This operation is restricted to the organisation owner.");
    error.code = "FORBIDDEN";
    throw error;
  }

  return decoded;
}

function getRequestId(req) {
  const supplied = String(req.headers["x-request-id"] || "");
  if (/^[A-Za-z0-9._:-]{1,128}$/.test(supplied)) return supplied;
  return require("node:crypto").randomUUID();
}

function handleApiError(res, error) {
  if (error.code === "UNAUTHENTICATED") {
    return sendJson(res, 401, { error: "Authentication required." });
  }
  if (error.code === "FORBIDDEN" || error.code === "FORBIDDEN_ORIGIN") {
    return sendJson(res, 403, { error: "Access denied." });
  }
  if (error.code === "SERVER_CONFIGURATION_MISSING" || error.code === "SERVER_CONFIGURATION_INVALID") {
    return sendJson(res, 503, { error: "Secure backend is not configured yet." });
  }
  if (error.code === "NOT_FOUND") {
    return sendJson(res, 404, { error: error.publicMessage || "The requested record was not found." });
  }
  if (error.code === "CONFLICT") {
    return sendJson(res, 409, { error: error.publicMessage || "The record has already changed." });
  }
  if (error.code === "INVALID_INPUT") {
    return sendJson(res, 400, { error: error.publicMessage || "The request is invalid." });
  }

  return sendJson(res, 500, { error: "The request could not be completed." });
}

module.exports = {
  getFirebaseServices,
  getRequestId,
  handleApiError,
  requireOwner,
  sendJson
};
