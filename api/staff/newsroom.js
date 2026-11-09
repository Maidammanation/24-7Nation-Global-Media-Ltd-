const {
  getFirebaseServices,
  getRequestId,
  handleApiError,
  sendJson
} = require("../_lib/firebase-admin");
const { hasStaffPermission } = require("../_lib/staff-permissions");
const { FieldValue } = require("firebase-admin/firestore");

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  error.publicMessage = message;
  throw error;
}

function cleanText(value, max, label, required = true) {
  const text = typeof value === "string" ? value.trim() : "";
  if ((required && !text) || text.length > max) {
    fail("INVALID_INPUT", required
      ? label + " is required and must be no longer than " + max + " characters."
      : label + " must be no longer than " + max + " characters.");
  }
  return text;
}

function dateValue(value) {
  return value && typeof value.toDate === "function"
    ? value.toDate().toISOString()
    : null;
}

function serialize(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    summary: data.summary || "",
    body: data.body,
    category: data.category || "News",
    status: data.status,
    authorUid: data.authorUid,
    authorName: data.authorName || "",
    createdAt: dateValue(data.createdAt),
    updatedAt: dateValue(data.updatedAt),
    submittedAt: dateValue(data.submittedAt),
    reviewedAt: dateValue(data.reviewedAt),
    publishedAt: dateValue(data.publishedAt),
    reviewerName: data.reviewerName || "",
    publisherName: data.publisherName || "",
    revisionCount: Array.isArray(data.revisions) ? data.revisions.length : 0
  };
}

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

async function authenticate(req) {
  if (!sameOrigin(req)) fail("FORBIDDEN_ORIGIN", "Request origin is not allowed.");
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) fail("UNAUTHENTICATED", "Authentication is required.");

  const { auth, db } = getFirebaseServices();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(match[1], true);
  } catch {
    fail("UNAUTHENTICATED", "Authentication is invalid or expired.");
  }

  if (decoded.uid === process.env.OWNER_UID) {
    fail("FORBIDDEN", "Use the CEO Control Centre for owner access.");
  }
  const user = await auth.getUser(decoded.uid);
  if (user.disabled) fail("FORBIDDEN", "This account is disabled.");

  const snapshot = await db.collection("roleAssignments")
    .where("uid", "==", decoded.uid).get();
  const assignments = snapshot.docs.map(doc => doc.data())
    .filter(item => item.status === "active");
  if (!assignments.length) fail("FORBIDDEN", "No active staff assignment was found.");

  return { auth, db, decoded, user, assignments };
}

function canSeeAll(assignments) {
  return hasStaffPermission(assignments, "global_media", "content.review") ||
    hasStaffPermission(assignments, "global_media", "content.edit");
}

function canReadStory(assignments, story, uid) {
  return canSeeAll(assignments) || story.authorUid === uid;
}

module.exports = async function handler(req, res) {
  try {
    if (!["GET", "POST", "PATCH"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST, PATCH");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const context = await authenticate(req);
    const { db, decoded, user, assignments } = context;
    const stories = db.collection("newsroomStories");
    const audit = db.collection("auditEvents");
    const requestId = getRequestId(req);

    if (req.method === "GET") {
      if (!hasStaffPermission(assignments, "global_media", "content.view")) {
        fail("FORBIDDEN", "You do not have newsroom viewing access.");
      }
      const id = typeof req.query?.id === "string" ? req.query.id : "";
      if (id) {
        if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) fail("INVALID_INPUT", "Invalid story ID.");
        const snap = await stories.doc(id).get();
        if (!snap.exists) fail("NOT_FOUND", "Story not found.");
        const story = snap.data();
        if (!canReadStory(assignments, story, decoded.uid)) {
          fail("FORBIDDEN", "You cannot view this story.");
        }
        return sendJson(res, 200, { story: serialize(snap) });
      }

      const snapshot = await stories.orderBy("updatedAt", "desc").limit(100).get();
      const items = snapshot.docs
        .filter(doc => canReadStory(assignments, doc.data(), decoded.uid))
        .map(serialize);
      return sendJson(res, 200, { stories: items });
    }

    if (req.method === "POST") {
      if (!hasStaffPermission(assignments, "global_media", "content.create")) {
        fail("FORBIDDEN", "You do not have permission to create newsroom stories.");
      }
      const title = cleanText(req.body?.title, 180, "A story title");
      const body = cleanText(req.body?.body, 30000, "Story body");
      const summary = cleanText(req.body?.summary, 500, "Story summary", false);
      const category = cleanText(req.body?.category || "News", 60, "Category");
      const storyRef = stories.doc();
      const auditRef = audit.doc();

      await db.runTransaction(async transaction => {
        transaction.create(storyRef, {
          departmentCode: "global_media",
          title, body, summary, category,
          status: "draft",
          authorUid: decoded.uid,
          authorName: user.displayName || user.email || "Staff member",
          authorEmail: user.email || "",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          submittedAt: null,
          reviewedAt: null,
          publishedAt: null,
          reviewerUid: null,
          reviewerName: "",
          publisherUid: null,
          publisherName: "",
          revisions: []
        });
        transaction.create(auditRef, {
          actorUid: decoded.uid,
          actorRoleAtTime: assignments.map(item => item.role).join(","),
          action: "newsroom.story_created",
          resourceType: "newsroomStory",
          resourceId: storyRef.id,
          outcome: "success",
          occurredAt: require("firebase-admin/firestore").FieldValue.serverTimestamp(),
          requestId,
          metadata: { departmentCode: "global_media", status: "draft" }
        });
      });

      return sendJson(res, 201, {
        story: { id: storyRef.id, title, summary, body, category, status: "draft" }
      });
    }

    const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) fail("INVALID_INPUT", "A valid story ID is required.");
    const action = typeof req.body?.action === "string" ? req.body.action : "";
    const storyRef = stories.doc(id);
    const auditRef = audit.doc();
    const now = FieldValue.serverTimestamp();

    const result = await db.runTransaction(async transaction => {
      const snap = await transaction.get(storyRef);
      if (!snap.exists) fail("NOT_FOUND", "Story not found.");
      const current = snap.data();
      if (current.departmentCode !== "global_media") fail("NOT_FOUND", "Story not found.");
      if (!canReadStory(assignments, current, decoded.uid)) {
        fail("FORBIDDEN", "You cannot access this story.");
      }

      const update = { updatedAt: now };
      let auditAction = "";

      if (action === "edit") {
        const ownEdit = current.authorUid === decoded.uid &&
          hasStaffPermission(assignments, "global_media", "content.edit_own");
        const broadEdit = hasStaffPermission(assignments, "global_media", "content.edit");
        if (!ownEdit && !broadEdit) fail("FORBIDDEN", "You cannot edit this story.");
        if (!["draft", "revision_requested"].includes(current.status)) {
          fail("CONFLICT", "Only draft or returned stories can be edited.");
        }
        const title = cleanText(req.body.title, 180, "A story title");
        const body = cleanText(req.body.body, 30000, "Story body");
        const summary = cleanText(req.body.summary, 500, "Story summary", false);
        const category = cleanText(req.body.category || "News", 60, "Category");
        const revisions = Array.isArray(current.revisions) ? current.revisions.slice(-19) : [];
        revisions.push({
          action: "edited",
          actorUid: decoded.uid,
          actorName: user.displayName || user.email || "Staff member",
          at: new Date().toISOString(),
          previousStatus: current.status
        });
        Object.assign(update, { title, body, summary, category, status: "draft", revisions });
        auditAction = "newsroom.story_edited";
      } else if (action === "submit") {
        if (current.authorUid !== decoded.uid ||
            !hasStaffPermission(assignments, "global_media", "content.create")) {
          fail("FORBIDDEN", "Only the story author can submit this story.");
        }
        if (!["draft", "revision_requested"].includes(current.status)) {
          fail("CONFLICT", "This story cannot be submitted from its current status.");
        }
        Object.assign(update, { status: "submitted", submittedAt: now });
        auditAction = "newsroom.story_submitted";
      } else if (action === "request_revision") {
        if (!hasStaffPermission(assignments, "global_media", "content.review")) {
          fail("FORBIDDEN", "You do not have review permission.");
        }
        if (current.status !== "submitted") fail("CONFLICT", "Only submitted stories can be returned.");
        const note = cleanText(req.body.note, 1000, "Revision instructions");
        Object.assign(update, {
          status: "revision_requested",
          reviewNote: note,
          reviewerUid: decoded.uid,
          reviewerName: user.displayName || user.email || "",
          reviewedAt: now
        });
        auditAction = "newsroom.revision_requested";
      } else if (action === "approve") {
        if (!hasStaffPermission(assignments, "global_media", "content.review")) {
          fail("FORBIDDEN", "You do not have review permission.");
        }
        if (current.status !== "submitted") fail("CONFLICT", "Only submitted stories can be approved.");
        Object.assign(update, {
          status: "approved",
          reviewNote: "",
          reviewerUid: decoded.uid,
          reviewerName: user.displayName || user.email || "",
          reviewedAt: now
        });
        auditAction = "newsroom.story_approved";
      } else if (action === "publish") {
        if (!hasStaffPermission(assignments, "global_media", "content.publish")) {
          fail("FORBIDDEN", "You do not have publishing permission.");
        }
        if (current.status !== "approved") fail("CONFLICT", "A story must be approved before publication.");
        Object.assign(update, {
          status: "published",
          publisherUid: decoded.uid,
          publisherName: user.displayName || user.email || "",
          publishedAt: now
        });
        auditAction = "newsroom.story_published";
      } else if (action === "archive") {
        if (!hasStaffPermission(assignments, "global_media", "content.edit")) {
          fail("FORBIDDEN", "You do not have permission to archive stories.");
        }
        if (current.status === "published") fail("CONFLICT", "Published stories cannot be archived through this action.");
        update.status = "archived";
        auditAction = "newsroom.story_archived";
      } else {
        fail("INVALID_INPUT", "Choose a supported newsroom action.");
      }

      transaction.update(storyRef, update);
      transaction.create(auditRef, {
        actorUid: decoded.uid,
        actorRoleAtTime: assignments.map(item => item.role).join(","),
        action: auditAction,
        resourceType: "newsroomStory",
        resourceId: id,
        outcome: "success",
        occurredAt: now,
        requestId,
        metadata: { departmentCode: "global_media", previousStatus: current.status, nextStatus: update.status || current.status }
      });
      return { id, status: update.status || current.status, action };
    });

    return sendJson(res, 200, { result });
  } catch (error) {
    return handleApiError(res, error);
  }
};
