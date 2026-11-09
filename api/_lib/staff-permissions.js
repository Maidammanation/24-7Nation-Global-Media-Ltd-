const DEPARTMENTS = {
  music_records: "24/7 Nation Music Records",
  global_media: "24/7 Nation Global Media",
  family: "24/7 Nation Family",
  mobile_app: "24/7 Nation Mobile App",
  website: "24/7 Nation Website",
  community_portal: "Community Portal for Members"
};

const ROLE_PERMISSIONS = {
  super_admin: {
    "*": ["workspace.view", "records.view", "records.manage", "reports.view", "content.view", "content.create", "content.edit", "content.publish", "content.review", "media.view", "media.upload", "artists.view", "artists.manage", "releases.view", "releases.manage", "productions.view", "productions.manage", "members.view", "community.view", "community.manage", "events.view", "events.manage", "profile.view", "connect.use"]
  },
  department_admin: {
    "*": ["workspace.view", "records.view", "records.manage", "reports.view", "content.view", "content.review", "media.view", "artists.view", "releases.view", "productions.view", "members.view", "community.view", "events.view", "profile.view", "connect.use"]
  },
  editor: {
    global_media: ["workspace.view", "content.view", "content.create", "content.edit", "content.publish", "media.view", "media.upload"],
    website: ["workspace.view", "content.view", "content.create", "content.edit", "content.publish"]
  },
  journalist: {
    global_media: ["workspace.view", "content.view", "content.create", "content.edit_own", "media.view", "media.upload"]
  },
  artist_manager: {
    music_records: ["workspace.view", "artists.view", "artists.manage", "releases.view", "releases.manage", "media.view", "media.upload"]
  },
  production_manager: {
    global_media: ["workspace.view", "productions.view", "productions.manage", "media.view", "media.upload"]
  },
  community_manager: {
    family: ["workspace.view", "members.view", "community.view", "community.manage", "events.view", "events.manage"],
    community_portal: ["workspace.view", "members.view", "community.view", "community.manage", "events.view", "events.manage"]
  },
  member: {
    "*": ["workspace.view", "profile.view", "connect.use"]
  }
};

function getPermissionsFor(role, departmentCode) {
  const rules = ROLE_PERMISSIONS[role];
  if (!rules) return [];
  return rules[departmentCode] || rules["*"] || [];
}

function resolveStaffWorkspaces(assignments) {
  const workspaces = new Map();

  for (const assignment of Array.isArray(assignments) ? assignments : []) {
    if (!assignment || assignment.status !== "active") continue;
    const departments = Array.isArray(assignment.departmentCodes)
      ? assignment.departmentCodes
      : [];

    for (const departmentCode of departments) {
      const name = DEPARTMENTS[departmentCode];
      if (!name) continue;
      const permissions = getPermissionsFor(assignment.role, departmentCode);
      if (!permissions.includes("workspace.view")) continue;

      if (!workspaces.has(departmentCode)) {
        workspaces.set(departmentCode, {
          departmentCode,
          name,
          roles: [],
          permissions: new Set()
        });
      }

      const workspace = workspaces.get(departmentCode);
      if (!workspace.roles.includes(assignment.role)) {
        workspace.roles.push(assignment.role);
      }
      for (const permission of permissions) workspace.permissions.add(permission);
    }
  }

  return Array.from(workspaces.values())
    .map((workspace) => ({
      departmentCode: workspace.departmentCode,
      name: workspace.name,
      roles: workspace.roles,
      permissions: Array.from(workspace.permissions).sort()
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function hasStaffPermission(assignments, departmentCode, permission) {
  return resolveStaffWorkspaces(assignments).some((workspace) =>
    workspace.departmentCode === departmentCode &&
    workspace.permissions.includes(permission)
  );
}

module.exports = {
  DEPARTMENTS,
  ROLE_PERMISSIONS,
  getPermissionsFor,
  hasStaffPermission,
  resolveStaffWorkspaces
};
