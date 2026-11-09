import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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

const auth = getAuth(initializeApp(firebaseConfig));
const loginView = document.getElementById("loginView");
const workspaceView = document.getElementById("workspaceView");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const permissionLabels = {
  "workspace.view": "Open department workspace",
  "records.view": "View department records",
  "records.manage": "Manage department records",
  "reports.view": "View department reports",
  "content.view": "View newsroom content",
  "content.create": "Create content",
  "content.edit": "Edit content",
  "content.edit_own": "Edit own stories",
  "content.publish": "Publish content",
  "content.review": "Review submitted content",
  "media.view": "View media library",
  "media.upload": "Upload media",
  "artists.view": "View artist profiles",
  "artists.manage": "Manage artist profiles",
  "releases.view": "View music releases",
  "releases.manage": "Manage music releases",
  "productions.view": "View productions",
  "productions.manage": "Manage productions",
  "members.view": "View member records",
  "community.view": "View community activity",
  "community.manage": "Manage community activity",
  "events.view": "View events",
  "events.manage": "Manage events",
  "profile.view": "View own profile",
  "connect.use": "Use 24/7 Nation Connect"
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showLogin(message = "") {
  loginView.hidden = false;
  workspaceView.hidden = true;
  loginMessage.textContent = message;
}

let newsroomPermissions = [];
let newsroomStories = [];

async function newsroomRequest(user, method = "GET", payload = null, query = "") {
  const token = await user.getIdToken();
  const response = await fetch("/api/staff/newsroom" + query, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { "Content-Type": "application/json" } : {})
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The newsroom request could not be completed.");
  return data;
}

function newsroomCan(permission) {
  return newsroomPermissions.includes(permission);
}

function statusLabel(status) {
  return String(status || "draft").replace(/_/g, " ").toUpperCase();
}

function renderStories() {
  const list = document.getElementById("storiesList");
  document.getElementById("storyCount").textContent = `${newsroomStories.length} STORIES`;
  if (!newsroomStories.length) {
    list.innerHTML = '<p class="scope-empty">No newsroom stories yet. Create your first draft above.</p>';
    return;
  }
  list.innerHTML = newsroomStories.map(story => {
    const own = story.authorUid === auth.currentUser?.uid;
    const canEdit = own && newsroomCan("content.edit_own") ||
      newsroomCan("content.edit");
    const buttons = [];
    if (canEdit && ["draft", "revision_requested"].includes(story.status)) {
      buttons.push(`<button class="small-action" data-action="edit" data-id="${escapeHtml(story.id)}">Edit</button>`);
    }
    if (own && newsroomCan("content.create") && ["draft", "revision_requested"].includes(story.status)) {
      buttons.push(`<button class="small-action" data-action="submit" data-id="${escapeHtml(story.id)}">Submit for review</button>`);
    }
    if (newsroomCan("content.review") && story.status === "submitted") {
      buttons.push(`<button class="small-action" data-action="revision" data-id="${escapeHtml(story.id)}">Request revision</button>`);
      buttons.push(`<button class="small-action" data-action="approve" data-id="${escapeHtml(story.id)}">Approve</button>`);
    }
    if (newsroomCan("content.publish") && story.status === "approved") {
      buttons.push(`<button class="small-action publish-action" data-action="publish" data-id="${escapeHtml(story.id)}">Publish</button>`);
    }
    return `
      <article class="story-card">
        <div class="story-top"><span class="status-tag status-${escapeHtml(story.status)}">${escapeHtml(statusLabel(story.status))}</span><span class="story-category">${escapeHtml(story.category)}</span></div>
        <h4>${escapeHtml(story.title)}</h4>
        <p class="story-meta">By ${escapeHtml(story.authorName)} · Updated ${escapeHtml(story.updatedAt ? new Date(story.updatedAt).toLocaleString() : "recently")}</p>
        <p class="story-summary">${escapeHtml(story.summary || story.body.slice(0, 220))}</p>
        ${story.reviewNote ? `<p class="review-note"><b>Editor's note:</b> ${escapeHtml(story.reviewNote)}</p>` : ""}
        ${buttons.length ? `<div class="story-actions">${buttons.join("")}</div>` : ""}
      </article>`;
  }).join("");
}

async function refreshNewsroom() {
  const message = document.getElementById("newsroomMessage");
  message.textContent = "Loading editorial queue…";
  try {
    const data = await newsroomRequest(auth.currentUser);
    newsroomStories = data.stories || [];
    renderStories();
    message.textContent = "Newsroom updated.";
  } catch (error) {
    message.textContent = error.message;
  }
}

function resetStoryForm() {
  document.getElementById("storyForm").reset();
  document.getElementById("storyId").value = "";
  document.getElementById("saveStoryButton").textContent = "SAVE DRAFT";
  document.getElementById("cancelEditButton").hidden = true;
}

async function loadStaffWorkspace(user) {
  loginMessage.textContent = "Verifying your department permissions…";
  const token = await user.getIdToken(true);
  const response = await fetch("/api/staff/workspace", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Your staff access could not be verified.");

  document.getElementById("welcomeTitle").textContent =
    `Welcome, ${data.staff.displayName || "Team member"}`;
  document.getElementById("staffEmail").textContent = data.staff.email || "";

  const mediaWorkspace = (data.workspaces || []).find(item => item.departmentCode === "global_media");
  newsroomPermissions = mediaWorkspace?.permissions || [];
  const newsroomPanel = document.getElementById("newsroomPanel");
  newsroomPanel.hidden = !newsroomCan("content.view");
  document.getElementById("otherToolsNotice").hidden = !newsroomPanel.hidden;
  document.getElementById("accessList").innerHTML = data.workspaces.map(workspace => {
    const roles = workspace.roles.map(role =>
      role.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase())
    );
    const permissions = workspace.permissions.map(permission =>
      permissionLabels[permission] || permission
    );
    return `
      <article class="access-card">
        <div class="role-line">
          <b>${escapeHtml(workspace.name)}</b>
          <span class="active-tag">AUTHORISED</span>
        </div>
        <p class="eyebrow">YOUR ROLE</p>
        <p class="workspace-roles">${escapeHtml(roles.join(" · "))}</p>
        <p class="eyebrow">PERMITTED ACTIONS</p>
        <ul>${permissions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>`;
  }).join("");

  loginView.hidden = true;
  workspaceView.hidden = false;
  if (!newsroomPanel.hidden) await refreshNewsroom();
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginButton.disabled = true;
  loginButton.textContent = "VERIFYING…";
  loginMessage.textContent = "";
  try {
    await signInWithEmailAndPassword(
      auth, emailInput.value.trim(), passwordInput.value
    );
  } catch (error) {
    const messages = {
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/network-request-failed": "Network problem. Check your connection and try again."
    };
    loginMessage.textContent = messages[error.code] || error.message ||
      "Sign-in failed. Check your details and try again.";
    if (auth.currentUser) await signOut(auth);
  } finally {
    passwordInput.value = "";
    loginButton.disabled = false;
    loginButton.textContent = "SECURE STAFF SIGN IN";
  }
});

document.getElementById("forgotPasswordButton").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) {
    loginMessage.textContent = "Enter your staff email address first, then tap Forgot your password.";
    emailInput.focus();
    return;
  }
  const button = document.getElementById("forgotPasswordButton");
  button.disabled = true;
  loginMessage.textContent = "Requesting a secure password reset…";
  try {
    await sendPasswordResetEmail(auth, email);
    loginMessage.textContent = "If this email belongs to a registered account, Firebase has sent a password-reset email. Check your inbox and spam folder.";
  } catch (error) {
    if (error.code === "auth/invalid-email") {
      loginMessage.textContent = "Enter a valid email address.";
    } else if (error.code === "auth/too-many-requests") {
      loginMessage.textContent = "Too many requests. Please wait before trying again.";
    } else if (error.code === "auth/network-request-failed") {
      loginMessage.textContent = "Network problem. Check your connection and try again.";
    } else {
      loginMessage.textContent = "We could not process the reset request. Try again later or contact the organisation administrator.";
    }
  } finally {
    button.disabled = false;
  }
});

document.getElementById("storyForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.getElementById("saveStoryButton");
  const id = document.getElementById("storyId").value;
  const payload = {
    title: document.getElementById("storyTitle").value,
    summary: document.getElementById("storySummary").value,
    category: document.getElementById("storyCategory").value,
    body: document.getElementById("storyBody").value
  };
  button.disabled = true;
  button.textContent = "SAVING…";
  try {
    if (id) {
      await newsroomRequest(auth.currentUser, "PATCH", { ...payload, id, action: "edit" });
      document.getElementById("newsroomMessage").textContent = "Draft updated.";
    } else {
      await newsroomRequest(auth.currentUser, "POST", payload);
      document.getElementById("newsroomMessage").textContent = "Draft saved.";
    }
    resetStoryForm();
    await refreshNewsroom();
  } catch (error) {
    document.getElementById("newsroomMessage").textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = id ? "UPDATE DRAFT" : "SAVE DRAFT";
  }
});

document.getElementById("cancelEditButton").addEventListener("click", resetStoryForm);
document.getElementById("refreshNewsroom").addEventListener("click", refreshNewsroom);

document.getElementById("storiesList").addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const story = newsroomStories.find(item => item.id === button.dataset.id);
  if (!story) return;
  const action = button.dataset.action;
  const message = document.getElementById("newsroomMessage");
  try {
    if (action === "edit") {
      document.getElementById("storyId").value = story.id;
      document.getElementById("storyTitle").value = story.title;
      document.getElementById("storySummary").value = story.summary || "";
      document.getElementById("storyCategory").value = story.category || "News";
      document.getElementById("storyBody").value = story.body || "";
      document.getElementById("saveStoryButton").textContent = "UPDATE DRAFT";
      document.getElementById("cancelEditButton").hidden = false;
      document.getElementById("storyTitle").focus();
      return;
    }
    button.disabled = true;
    if (action === "submit") {
      await newsroomRequest(auth.currentUser, "PATCH", { id: story.id, action: "submit" });
    } else if (action === "approve") {
      await newsroomRequest(auth.currentUser, "PATCH", { id: story.id, action: "approve" });
    } else if (action === "publish") {
      if (!confirm("Publish this approved story? It will be marked as published.")) return;
      await newsroomRequest(auth.currentUser, "PATCH", { id: story.id, action: "publish" });
    } else if (action === "revision") {
      const note = prompt("Write clear revision instructions for the journalist:");
      if (!note || !note.trim()) return;
      await newsroomRequest(auth.currentUser, "PATCH", { id: story.id, action: "request_revision", note: note.trim() });
    }
    message.textContent = "Editorial action completed.";
    await refreshNewsroom();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.getElementById("signOutButton").addEventListener("click", async () => {
  await signOut(auth);
  showLogin("You have signed out.");
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    showLogin();
    return;
  }
  try {
    await loadStaffWorkspace(user);
  } catch (error) {
    await signOut(auth);
    showLogin(error.message || "This account has no active staff access.");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
