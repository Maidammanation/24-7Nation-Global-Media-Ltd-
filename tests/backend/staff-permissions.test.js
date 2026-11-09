const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getPermissionsFor,
  hasStaffPermission,
  resolveStaffWorkspaces
} = require("../../api/_lib/staff-permissions");

test("editor receives publishing access only inside assigned supported departments", () => {
  const assignments = [{
    role: "editor",
    departmentCodes: ["global_media", "family"],
    status: "active"
  }];
  const workspaces = resolveStaffWorkspaces(assignments);
  assert.deepEqual(workspaces.map((item) => item.departmentCode), ["global_media"]);
  assert.equal(hasStaffPermission(assignments, "global_media", "content.publish"), true);
  assert.equal(hasStaffPermission(assignments, "family", "content.publish"), false);
});

test("journalist can edit own stories but cannot publish", () => {
  const assignments = [{
    role: "journalist",
    departmentCodes: ["global_media"],
    status: "active"
  }];
  assert.equal(hasStaffPermission(assignments, "global_media", "content.create"), true);
  assert.equal(hasStaffPermission(assignments, "global_media", "content.edit_own"), true);
  assert.equal(hasStaffPermission(assignments, "global_media", "content.publish"), false);
});

test("artist manager access is restricted to Music Records", () => {
  const assignments = [{
    role: "artist_manager",
    departmentCodes: ["music_records", "global_media"],
    status: "active"
  }];
  assert.equal(hasStaffPermission(assignments, "music_records", "artists.manage"), true);
  assert.equal(hasStaffPermission(assignments, "global_media", "artists.manage"), false);
});

test("inactive assignments grant no workspace or permissions", () => {
  const assignments = [{
    role: "super_admin",
    departmentCodes: ["music_records"],
    status: "revoked"
  }];
  assert.deepEqual(resolveStaffWorkspaces(assignments), []);
  assert.equal(hasStaffPermission(assignments, "music_records", "records.manage"), false);
});

test("department administrators are scoped and cannot receive owner-only staff controls", () => {
  const permissions = getPermissionsFor("department_admin", "global_media");
  assert.ok(permissions.includes("records.manage"));
  assert.ok(permissions.includes("content.review"));
  assert.ok(!permissions.includes("staff.manage"));
  assert.ok(!permissions.includes("owner.manage"));
});

test("member receives only basic workspace, profile and Connect access", () => {
  const permissions = getPermissionsFor("member", "community_portal");
  assert.deepEqual(permissions, ["workspace.view", "profile.view", "connect.use"]);
});

test("production and community managers receive their own functional areas only", () => {
  const production = [{
    role: "production_manager",
    departmentCodes: ["global_media"],
    status: "active"
  }];
  const community = [{
    role: "community_manager",
    departmentCodes: ["community_portal"],
    status: "active"
  }];
  assert.equal(hasStaffPermission(production, "global_media", "productions.manage"), true);
  assert.equal(hasStaffPermission(production, "global_media", "community.manage"), false);
  assert.equal(hasStaffPermission(community, "community_portal", "community.manage"), true);
  assert.equal(hasStaffPermission(community, "community_portal", "productions.manage"), false);
});
