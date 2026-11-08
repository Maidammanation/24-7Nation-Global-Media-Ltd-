import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIkjcAFakFkLtSQR9Cw4Qro0QrKqAwLZ8",
  authDomain: "nation-global-media.firebaseapp.com",
  projectId: "nation-global-media",
  storageBucket: "nation-global-media.firebasestorage.app",
  messagingSenderId: "795470625250",
  appId: "1:795470625250:web:2008c1998ad9a6d5f4a1bb"
};

const OWNER_UID = "6HtU9DzFW3epuzWobvRg54VrRYt2";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let currentUser = null;
let staffDirectory = [];

const loginScreen = document.getElementById("loginScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const ownerEmail = document.getElementById("ownerEmail");
const signOutButton = document.getElementById("signOutButton");
const panel = document.getElementById("viewPanel");

function showLogin(message = "") {
  loginScreen.hidden = false;
  appShell.hidden = true;
  loginMessage.textContent = message;
}
function showDashboard(user) {
  loginScreen.hidden = true;
  appShell.hidden = false;
  ownerEmail.textContent = user.email || "Verified owner";
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
async function apiRequest(path, options = {}) {
  if (!currentUser) throw new Error("Your owner session has expired. Sign in again.");
  const token = await currentUser.getIdToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "VERIFYING...";
  try {
    const credential = await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    if (credential.user.uid !== OWNER_UID) {
      await signOut(auth);
      showLogin("This account is not authorised for the CEO Control Centre.");
    }
  } catch (error) {
    const messages = {
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/network-request-failed": "Network problem. Check your connection and try again."
    };
    showLogin(messages[error.code] || "Sign-in failed. Please check your details and try again.");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "SECURE SIGN IN";
    passwordInput.value = "";
  }
});

signOutButton.addEventListener("click", async () => {
  await signOut(auth);
  showLogin("You have signed out.");
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    showLogin();
    return;
  }
  if (user.uid !== OWNER_UID) {
    currentUser = null;
    await signOut(auth);
    showLogin("This account is not authorised for the CEO Control Centre.");
    return;
  }
  currentUser = user;
  showDashboard(user);
});

const menuButton = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");
if (menuButton && sidebar) {
  menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));
}

const pageTitle = document.getElementById("pageTitle");
const crumbName = document.getElementById("crumbName");
const navItems = document.querySelectorAll(".nav-item");
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const departments = [
  ["music_records", "24/7 Nation Music Records"],
  ["global_media", "24/7 Nation Global Media"],
  ["family", "24/7 Nation Family"],
  ["mobile_app", "24/7 Nation Mobile App"],
  ["website", "24/7 Nation Website"],
  ["community_portal", "Community Portal for Members"]
];
const roles = [
  ["super_admin", "Super-admin"],
  ["department_admin", "Department administrator"],
  ["editor", "Editor"],
  ["journalist", "Journalist"],
  ["artist_manager", "Artist manager"],
  ["production_manager", "Production manager"],
  ["community_manager", "Community manager"],
  ["member", "Member"]
];
const views = {
  overview: {title:"CEO Control Centre",crumb:"OVERVIEW"},
  newsroom: {title:"Newsroom",crumb:"NEWSROOM",description:"Create, review and publish approved news stories, features, announcements and corrections.",items:["Story drafts and editorial review","Publication calendar and categories","Corrections, source notes and approval history"]},
  artists: {title:"Artists & Music",crumb:"ARTISTS & MUSIC",description:"Maintain verified artist profiles, releases, promotional materials and music rights information.",items:["Artist profiles and team assignments","Release metadata and streaming links","Contracts, permissions and release approvals"]},
  productions: {title:"Maidammanation Productions",crumb:"PRODUCTIONS",description:"Coordinate the production arm within 24/7 Nation Global Media.",items:["Projects, shoots and production schedules","Interviews, podcasts, documentaries and live coverage","Crew assignments, assets and production approvals"]},
  team: {title:"Team & Roles",crumb:"TEAM & ROLES"},
  members: {title:"Community Members",crumb:"MEMBERS",description:"Manage membership applications, approved profiles, announcements and community programmes.",items:["Member applications and verification","Member directory and communication preferences","Community programmes and safeguarding workflows"]},
  library: {title:"Media Library",crumb:"MEDIA LIBRARY",description:"Keep approved photos, video, audio, artwork and documents organised with clear rights information.",items:["Searchable media folders and metadata","Usage permissions, credits and expiry dates","Secure upload and access controls"]},
  ai: {title:"24/7 Nation AI Studio",crumb:"AI STUDIO",description:"Use AI to assist staff with research, drafting, planning and approved content organisation.",items:["Newsroom and creative drafting assistant","Source checking prompts and human approval queue","Media tagging and administrative summaries"]},
  connect: {title:"24/7 Nation Connect",crumb:"NATION CONNECT",description:"A planned secure communication service for members, artists and authorised teams.",items:["Private and group messaging","Voice notes and notification delivery","Voice/video calls after real-time infrastructure is secured"]},
  reports: {title:"Reports & Analytics",crumb:"REPORTS",description:"Review operational performance using verified data and clearly defined reporting periods.",items:["Website and content performance","Membership and programme reports","Export controls and audit history"]},
  settings: {title:"Organisation Settings",crumb:"SETTINGS",description:"Configure organisation details, platform preferences, security and connected services.",items:["Brand, contact and public website settings","Authentication and security policies","Integrations, data retention and privacy controls"]}
};

function renderTeamShell() {
  panel.innerHTML = `
    <div class="section-title"><div><span class="eyebrow">OWNER-ONLY WORKSPACE</span><h3>Team & Roles</h3></div><span class="live-tag">SECURE API</span></div>
    <div class="team-intro"><b>Create staff accounts directly from your owner dashboard.</b><p>Enter the staff member’s name, email and role. The secure backend creates the Firebase account, assigns department access and records the action. The staff member sets their own password using a private invitation link.</p></div>
    <div class="team-grid">
      <section class="panel-card team-form-card">
        <div class="panel-heading"><div><span class="eyebrow">NEW STAFF MEMBER</span><h3>Create staff account</h3></div><span class="gold-mark">＋</span></div>
        <form id="roleForm" class="role-form">
          <label for="staffName">Full name</label>
          <input id="staffName" name="displayName" required minlength="2" maxlength="100" autocomplete="name" placeholder="Staff member's full name">
          <label for="staffEmail">Email address</label>
          <input id="staffEmail" name="email" type="email" required maxlength="254" autocomplete="email" placeholder="staff@example.com">
          <p class="form-help">We'll create the Firebase login and generate a secure password-setup link. You do not need to create a password or visit Firebase Console.</p>
          <label for="staffRole">Role</label>
          <select id="staffRole" name="role" required>${roles.map(([value,label])=>`<option value="${value}">${label}</option>`).join("")}</select>
          <label>Department access</label>
          <div class="department-options">${departments.map(([value,label])=>`<label class="check-option"><input type="checkbox" name="departmentCodes" value="${value}"><span>${label}</span></label>`).join("")}</div>
          <label for="assignmentReason">Reason / approval reference</label>
          <textarea id="assignmentReason" name="reason" required minlength="5" maxlength="500" rows="3" placeholder="Explain why this access is required (5–500 characters)"></textarea>
          <button class="gold-action" type="submit" id="assignRoleButton">CREATE STAFF ACCOUNT</button>
          <p class="form-status" id="roleFormStatus" role="status" aria-live="polite"></p>
        </form>
      </section>
      <section class="panel-card">
        <div class="panel-heading"><div><span class="eyebrow">CURRENT ACCESS RECORDS</span><h3>Role assignments</h3></div><button class="small-action" id="refreshAssignments" type="button">Refresh</button></div>
        <div id="assignmentsStatus" class="empty-state">Loading secure records…</div>
        <div id="assignmentsList" class="assignment-list"></div>
      </section>
    </div>
    <section class="panel-card staff-directory-card">
      <div class="panel-heading"><div><span class="eyebrow">FIREBASE AUTHENTICATION</span><h3>Staff account directory</h3></div><button class="small-action" id="refreshStaffDirectory" type="button">Refresh accounts</button></div>
      <p class="directory-help">Search staff accounts, check their current access and suspend or reactivate sign-in. Suspension does not delete the account or its role history.</p>
      <label class="directory-search-label" for="staffDirectorySearch">Search by name or email</label>
      <input class="directory-search" id="staffDirectorySearch" type="search" placeholder="Search staff name or email">
      <div id="staffDirectoryStatus" class="empty-state">Loading staff accounts…</div>
      <div id="staffDirectoryList" class="staff-directory-list"></div>
    </section>
    <section class="panel-card audit-card">
      <div class="panel-heading"><div><span class="eyebrow">ACCOUNTABILITY</span><h3>Recent access activity</h3></div><button class="small-action" id="refreshAudit" type="button">Refresh logs</button></div>
      <div id="auditStatus" class="empty-state">Loading audit history…</div>
      <div id="auditList" class="audit-list"></div>
    </section>
    <p class="team-security-note">Security boundary: these endpoints are owner-only. Staff role records are not yet permission to use other management APIs. Firestore rules remain owner-only until full role-based policies are implemented and tested.</p>
  `;
  document.getElementById("roleForm").addEventListener("submit", submitRoleAssignment);
  document.getElementById("refreshAssignments").addEventListener("click", loadAssignments);
  document.getElementById("refreshAudit").addEventListener("click", loadAuditEvents);
  loadAssignments();
  loadAuditEvents();
}

async function submitRoleAssignment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = document.getElementById("assignRoleButton");
  const status = document.getElementById("roleFormStatus");
  const departmentCodes = [...form.querySelectorAll('input[name="departmentCodes"]:checked')].map(input => input.value);
  const payload = {
    displayName: form.displayName.value.trim(),
    email: form.email.value.trim(),
    role: form.role.value,
    departmentCodes,
    reason: form.reason.value.trim()
  };
  if (payload.role === "department_admin" && !departmentCodes.length) {
    status.textContent = "Select at least one department for a department administrator.";
    return;
  }
  button.disabled = true;
  button.textContent = "CREATING SECURE ACCOUNT…";
  status.textContent = "";
  try {
    const result = await apiRequest("/api/admin/create-staff", {method:"POST", body:JSON.stringify(payload)});
    status.textContent = `Account created for ${result.staff.displayName}. Copy the invitation link below and send it privately.`;
    document.querySelectorAll(".invite-result").forEach(node => node.remove());
    const invite = document.createElement("div");
    invite.className = "invite-result";
    invite.innerHTML = '<b>STAFF PASSWORD-SETUP LINK</b><input readonly aria-label="Staff invitation link"><button type="button" class="small-action">Copy invitation link</button><small>This link allows the staff member to set their own password. Share it privately.</small>';
    invite.querySelector("input").value = result.invitationLink;
    invite.querySelector("button").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(result.invitationLink); invite.querySelector("button").textContent = "Copied"; }
      catch { invite.querySelector("input").focus(); invite.querySelector("input").select(); status.textContent = "Copy was blocked by the browser. Select and copy the link manually."; }
    });
    status.after(invite);
    form.reset();
    await Promise.all([loadAssignments(), loadAuditEvents()]);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "CREATE STAFF ACCOUNT";
  }
}

function labelForRole(role) {
  return roles.find(item => item[0] === role)?.[1] || role;
}
function labelForDepartments(codes) {
  return (codes || []).map(code => departments.find(item=>item[0]===code)?.[1] || code).join(", ") || "No department scope";
}
function displayDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value && typeof value === "object" && value._seconds ? value._seconds * 1000 : value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}
async function loadAssignments() {
  const status = document.getElementById("assignmentsStatus");
  const list = document.getElementById("assignmentsList");
  if (!status || !list) return;
  status.textContent = "Loading secure records…";
  list.innerHTML = "";
  try {
    const data = await apiRequest("/api/admin/role-assignments");
    const rows = data.assignments || [];
    status.textContent = rows.length ? `${rows.length} assignment record(s) returned.` : "No role assignments have been created yet.";
    list.innerHTML = rows.map(item => `
      <article class="assignment-row">
        <div class="assignment-main"><b>${escapeHtml(item.displayName || labelForRole(item.role))}</b><span class="assignment-uid">${escapeHtml(item.email || ("UID: " + item.uid))}</span><small>${escapeHtml(labelForRole(item.role))} · ${escapeHtml(labelForDepartments(item.departmentCodes))}</small><small>Created: ${escapeHtml(displayDate(item.assignedAt?._seconds ? item.assignedAt._seconds*1000 : item.assignedAt))}</small></div>
        <div class="assignment-actions"><span class="record-status ${item.status==="active"?"active":"revoked"}">${escapeHtml(item.status || "unknown")}</span>${item.status==="active" ? `<button type="button" class="revoke-button" data-revoke="${escapeHtml(item.id)}">Revoke</button>` : ""}</div>
      </article>`).join("");
    list.querySelectorAll("[data-revoke]").forEach(button => button.addEventListener("click", revokeAssignment));
  } catch (error) {
    status.textContent = error.message;
  }
}
async function revokeAssignment(event) {
  const assignmentId = event.currentTarget.dataset.revoke;
  const reason = window.prompt("Enter the reason for revoking this access (at least 5 characters):");
  if (reason === null) return;
  if (reason.trim().length < 5) {
    window.alert("Please provide a reason of at least 5 characters. No changes were made.");
    return;
  }
  event.currentTarget.disabled = true;
  try {
    await apiRequest("/api/admin/role-assignments", {
      method:"PATCH",
      body:JSON.stringify({assignmentId, reason:reason.trim()})
    });
    await Promise.all([loadAssignments(), loadAuditEvents()]);
  } catch (error) {
    window.alert(error.message);
    event.currentTarget.disabled = false;
  }
}
async function loadStaffDirectory() {
  const status = document.getElementById("staffDirectoryStatus");
  const list = document.getElementById("staffDirectoryList");
  if (!status || !list) return;
  status.textContent = "Loading Firebase account records…";
  list.innerHTML = "";
  try {
    const data = await apiRequest("/api/admin/staff-users");
    staffDirectory = data.staff || [];
    status.textContent = staffDirectory.length
      ? `${staffDirectory.length} staff account(s) found${data.truncated ? " — showing the latest 500 assignment-linked accounts" : ""}.`
      : "No staff accounts with role history were found.";
    renderStaffDirectory();
  } catch (error) {
    status.textContent = error.message;
  }
}

function renderStaffDirectory() {
  const list = document.getElementById("staffDirectoryList");
  const search = document.getElementById("staffDirectorySearch");
  if (!list) return;
  const term = (search?.value || "").trim().toLowerCase();
  const matches = staffDirectory.filter(user =>
    (user.displayName || "").toLowerCase().includes(term) ||
    (user.email || "").toLowerCase().includes(term)
  );
  if (!matches.length) {
    list.innerHTML = '<p class="empty-state">No matching staff accounts.</p>';
    return;
  }
  list.innerHTML = matches.map(user => {
    const activeRoles = user.assignments.filter(item => item.status === "active");
    const roleText = activeRoles.length
      ? activeRoles.map(item => `${labelForRole(item.role)} · ${labelForDepartments(item.departmentCodes)}`).join("<br>")
      : "No active role assignment";
    return `
      <article class="staff-directory-row">
        <div class="staff-directory-main">
          <b>${escapeHtml(user.displayName)}</b>
          <span>${escapeHtml(user.email || "No email on record")}</span>
          <small>${roleText.split("<br>").map(escapeHtml).join("<br>")}</small>
          <small>Last sign-in: ${escapeHtml(user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Not recorded")}</small>
        </div>
        <div class="staff-directory-actions">
          <span class="record-status ${user.disabled ? "revoked" : "active"}">${user.disabled ? "SUSPENDED" : "ACTIVE"}</span>
          <button type="button" class="${user.disabled ? "reactivate-button" : "revoke-button"}" data-staff-uid="${escapeHtml(user.uid)}" data-disabled="${user.disabled ? "true" : "false"}">${user.disabled ? "Reactivate" : "Suspend"}</button>
        </div>
      </article>`;
  }).join("");
  list.querySelectorAll("[data-staff-uid]").forEach(button =>
    button.addEventListener("click", updateStaffAccountStatus)
  );
}

async function updateStaffAccountStatus(event) {
  const button = event.currentTarget;
  const uid = button.dataset.staffUid;
  const currentlyDisabled = button.dataset.disabled === "true";
  const nextDisabled = !currentlyDisabled;
  const reason = window.prompt(
    `Enter the reason for ${nextDisabled ? "suspending" : "reactivating"} this staff account (at least 5 characters):`
  );
  if (reason === null) return;
  if (reason.trim().length < 5 || reason.trim().length > 500) {
    window.alert("Please enter a reason between 5 and 500 characters. No changes were made.");
    return;
  }
  if (!window.confirm(`Confirm ${nextDisabled ? "suspension" : "reactivation"} of this staff account?`)) return;
  button.disabled = true;
  try {
    await apiRequest("/api/admin/staff-users", {
      method: "PATCH",
      body: JSON.stringify({ uid, disabled: nextDisabled, reason: reason.trim() })
    });
    await Promise.all([loadStaffDirectory(), loadAssignments(), loadAuditEvents()]);
  } catch (error) {
    window.alert(error.message);
    button.disabled = false;
  }
}

async function loadAuditEvents() {
  const status = document.getElementById("auditStatus");
  const list = document.getElementById("auditList");
  if (!status || !list) return;
  status.textContent = "Loading audit history…";
  list.innerHTML = "";
  try {
    const data = await apiRequest("/api/admin/audit-events");
    const events = data.events || [];
    status.textContent = events.length ? `Showing ${events.length} most recent event(s).` : "No audit events recorded yet.";
    list.innerHTML = events.map(item => `
      <article class="audit-row"><div><b>${escapeHtml((item.action || "activity").replaceAll(".", " · "))}</b><small>${escapeHtml(item.resourceType || "record")} · ${escapeHtml(item.resourceId || "—")}</small><small>Actor UID: ${escapeHtml(item.actorUid || "—")}</small></div><div class="audit-meta"><span class="record-status ${item.outcome==="success"?"active":"revoked"}">${escapeHtml(item.outcome || "unknown")}</span><small>${escapeHtml(displayDate(item.occurredAt))}</small></div></article>`).join("");
  } catch (error) {
    status.textContent = error.message;
  }
}

function showView(key) {
  const view = views[key] || views.overview;
  navItems.forEach(button => button.classList.toggle("active", button.dataset.view === key));
  pageTitle.textContent = view.title;
  crumbName.textContent = view.crumb;
  if (key === "overview") {
    window.location.reload();
    return;
  }
  if (key === "team") {
    renderTeamShell();
  } else {
    panel.innerHTML = '<div class="section-title"><div><span class="eyebrow">MANAGEMENT MODULE</span><h3>' + escapeHtml(view.title) + '</h3></div><span class="muted small">Backend connection required</span></div><div class="view-placeholder"><span class="eyebrow">PLANNED WORKSPACE</span><h3>' + escapeHtml(view.title) + '</h3><p>' + escapeHtml(view.description) + '</p><ul>' + view.items.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul><span class="coming">NOT CONNECTED — SETUP PREVIEW</span></div>';
  }
  if (sidebar) sidebar.classList.remove("open");
}
navItems.forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
