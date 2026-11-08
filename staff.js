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
const roleLabels = {
  super_admin: "Super-admin",
  department_admin: "Department administrator",
  editor: "Editor",
  journalist: "Journalist",
  artist_manager: "Artist manager",
  production_manager: "Production manager",
  community_manager: "Community manager",
  member: "Member"
};
const departmentLabels = {
  music_records: "24/7 Nation Music Records",
  global_media: "24/7 Nation Global Media",
  family: "24/7 Nation Family",
  mobile_app: "24/7 Nation Mobile App",
  website: "24/7 Nation Website",
  community_portal: "Community Portal for Members"
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

async function loadStaffWorkspace(user) {
  loginMessage.textContent = "Verifying your assigned access…";
  const token = await user.getIdToken(true);
  const response = await fetch("/api/staff/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Your staff access could not be verified.");

  document.getElementById("welcomeTitle").textContent =
    `Welcome, ${data.staff.displayName || "Team member"}`;
  document.getElementById("staffEmail").textContent = data.staff.email || "";
  document.getElementById("accessList").innerHTML = data.assignments.map(item => {
    const departments = (item.departmentCodes || []).map(code =>
      departmentLabels[code] || code
    );
    return `
      <article class="access-card">
        <div class="role-line"><b>${escapeHtml(roleLabels[item.role] || item.role)}</b><span class="active-tag">ACTIVE</span></div>
        <p class="eyebrow">ASSIGNED DEPARTMENTS</p>
        ${departments.length
          ? `<ul>${departments.map(name => `<li>${escapeHtml(name)}</li>`).join("")}</ul>`
          : '<p class="scope-empty">No department scope is listed for this assignment.</p>'}
      </article>`;
  }).join("");
  loginView.hidden = true;
  workspaceView.hidden = false;
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
