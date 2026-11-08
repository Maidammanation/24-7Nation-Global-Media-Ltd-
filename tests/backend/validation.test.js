const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateAssignmentInput,
  validateNewStaffInput,
  validateRevokeInput
} = require("../../api/_lib/validation");

test("accepts a valid department-scoped editor assignment", () => {
  const result = validateAssignmentInput({
    uid: "firebaseUser_123",
    role: "editor",
    departmentCodes: ["global_media"],
    reason: "Appointed by the owner"
  });

  assert.equal(result.uid, "firebaseUser_123");
  assert.equal(result.role, "editor");
  assert.deepEqual(result.departmentCodes, ["global_media"]);
});

test("requires a department scope for department administrators", () => {
  assert.throws(
    () => validateAssignmentInput({
      uid: "firebaseUser_123",
      role: "department_admin",
      departmentCodes: [],
      reason: "Appointed by the owner"
    }),
    { code: "INVALID_INPUT" }
  );
});

test("rejects owner role assignment through the staff API", () => {
  assert.throws(
    () => validateAssignmentInput({
      uid: "anotherUser",
      role: "owner",
      departmentCodes: [],
      reason: "Attempted owner promotion"
    }),
    { code: "INVALID_INPUT" }
  );
});

test("rejects unknown or duplicated department scopes", () => {
  assert.throws(
    () => validateAssignmentInput({
      uid: "firebaseUser_123",
      role: "editor",
      departmentCodes: ["global_media", "unknown"],
      reason: "Appointed by the owner"
    }),
    { code: "INVALID_INPUT" }
  );

  assert.throws(
    () => validateAssignmentInput({
      uid: "firebaseUser_123",
      role: "editor",
      departmentCodes: ["global_media", "global_media"],
      reason: "Appointed by the owner"
    }),
    { code: "INVALID_INPUT" }
  );
});

test("validates revocation reason and assignment ID", () => {
  assert.deepEqual(
    validateRevokeInput({
      assignmentId: "assignment_123",
      reason: "Staff member left the organisation"
    }),
    {
      assignmentId: "assignment_123",
      reason: "Staff member left the organisation"
    }
  );

  assert.throws(
    () => validateRevokeInput({
      assignmentId: "assignment_123",
      reason: "No"
    }),
    { code: "INVALID_INPUT" }
  );
});

test("accepts a valid new staff account request", () => {
  const result = validateNewStaffInput({
    displayName: "Amina Musa",
    email: "Amina@example.com",
    role: "editor",
    departmentCodes: ["global_media"],
    reason: "Appointed by the owner"
  });
  assert.equal(result.displayName, "Amina Musa");
  assert.equal(result.email, "amina@example.com");
  assert.equal(result.role, "editor");
  assert.deepEqual(result.departmentCodes, ["global_media"]);
});

test("rejects invalid new staff details and requires department scope for department admins", () => {
  assert.throws(() => validateNewStaffInput({
    displayName: "A",
    email: "not-an-email",
    role: "editor",
    departmentCodes: ["global_media"],
    reason: "Appointed by the owner"
  }), { code: "INVALID_INPUT" });

  assert.throws(() => validateNewStaffInput({
    displayName: "Amina Musa",
    email: "amina@example.com",
    role: "department_admin",
    departmentCodes: [],
    reason: "Appointed by the owner"
  }), { code: "INVALID_INPUT" });
});
