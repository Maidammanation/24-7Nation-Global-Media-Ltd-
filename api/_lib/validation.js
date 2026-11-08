const ALLOWED_ROLES = new Set([
  "super_admin",
  "department_admin",
  "editor",
  "journalist",
  "artist_manager",
  "production_manager",
  "community_manager",
  "member"
]);

const ALLOWED_DEPARTMENTS = new Set([
  "music_records",
  "global_media",
  "family",
  "mobile_app",
  "website",
  "community_portal"
]);

function invalid(message) {
  const error = new Error(message);
  error.code = "INVALID_INPUT";
  error.publicMessage = message;
  return error;
}

function validateAssignmentInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw invalid("A JSON request body is required.");
  }

  const uid = typeof body.uid === "string" ? body.uid.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const departmentCodes = body.departmentCodes;

  if (!/^[A-Za-z0-9:_-]{1,128}$/.test(uid)) {
    throw invalid("Enter a valid Firebase user ID.");
  }
  if (!ALLOWED_ROLES.has(role)) {
    throw invalid("The selected role is not permitted.");
  }
  if (
    !Array.isArray(departmentCodes) ||
    departmentCodes.length > 6 ||
    departmentCodes.some((code) => typeof code !== "string" || !ALLOWED_DEPARTMENTS.has(code)) ||
    new Set(departmentCodes).size !== departmentCodes.length
  ) {
    throw invalid("Choose valid, non-duplicated department scopes.");
  }
  if (role === "department_admin" && departmentCodes.length === 0) {
    throw invalid("A department administrator must have at least one department scope.");
  }
  if (reason.length < 5 || reason.length > 500) {
    throw invalid("Provide a reason between 5 and 500 characters.");
  }

  return { uid, role, departmentCodes, reason };
}

function validateNewStaffInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw invalid("A JSON request body is required.");
  }
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const departmentCodes = body.departmentCodes;

  if (displayName.length < 2 || displayName.length > 100) {
    throw invalid("Enter a name between 2 and 100 characters.");
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw invalid("Enter a valid email address.");
  }
  if (!ALLOWED_ROLES.has(role)) {
    throw invalid("The selected role is not permitted.");
  }
  if (
    !Array.isArray(departmentCodes) ||
    departmentCodes.length > 6 ||
    departmentCodes.some((code) => typeof code !== "string" || !ALLOWED_DEPARTMENTS.has(code)) ||
    new Set(departmentCodes).size !== departmentCodes.length
  ) {
    throw invalid("Choose valid, non-duplicated department scopes.");
  }
  if (role === "department_admin" && departmentCodes.length === 0) {
    throw invalid("A department administrator must have at least one department scope.");
  }
  if (reason.length < 5 || reason.length > 500) {
    throw invalid("Provide a reason between 5 and 500 characters.");
  }
  return { displayName, email, role, departmentCodes, reason };
}

function validateRevokeInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw invalid("A JSON request body is required.");
  }

  const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!/^[A-Za-z0-9_-]{1,150}$/.test(assignmentId)) {
    throw invalid("A valid role assignment ID is required.");
  }
  if (reason.length < 5 || reason.length > 500) {
    throw invalid("Provide a reason between 5 and 500 characters.");
  }

  return { assignmentId, reason };
}

module.exports = {
  ALLOWED_DEPARTMENTS,
  ALLOWED_ROLES,
  validateAssignmentInput,
  validateNewStaffInput,
  validateRevokeInput
};
