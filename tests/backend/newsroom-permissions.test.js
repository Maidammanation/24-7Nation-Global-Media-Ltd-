const test = require("node:test");
const assert = require("node:assert/strict");
const { hasStaffPermission } = require("../../api/_lib/staff-permissions");

test("newsroom permission policy separates author, reviewer and publisher", () => {
  const journalist = [{ role: "journalist", departmentCodes: ["global_media"], status: "active" }];
  const editor = [{ role: "editor", departmentCodes: ["global_media"], status: "active" }];
  const departmentAdmin = [{ role: "department_admin", departmentCodes: ["global_media"], status: "active" }];

  assert.equal(hasStaffPermission(journalist, "global_media", "content.create"), true);
  assert.equal(hasStaffPermission(journalist, "global_media", "content.edit_own"), true);
  assert.equal(hasStaffPermission(journalist, "global_media", "content.review"), false);
  assert.equal(hasStaffPermission(journalist, "global_media", "content.publish"), false);

  assert.equal(hasStaffPermission(editor, "global_media", "content.review"), false);
  assert.equal(hasStaffPermission(editor, "global_media", "content.publish"), true);

  assert.equal(hasStaffPermission(departmentAdmin, "global_media", "content.review"), true);
  assert.equal(hasStaffPermission(departmentAdmin, "global_media", "content.publish"), false);
});

test("newsroom access never crosses the assigned department", () => {
  const journalist = [{ role: "journalist", departmentCodes: ["global_media"], status: "active" }];
  assert.equal(hasStaffPermission(journalist, "global_media", "content.create"), true);
  assert.equal(hasStaffPermission(journalist, "website", "content.create"), false);
});
