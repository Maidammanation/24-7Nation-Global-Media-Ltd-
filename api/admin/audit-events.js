const {
  getFirebaseServices,
  handleApiError,
  requireOwner,
  sendJson
} = require("../_lib/firebase-admin");

module.exports = async function handler(req, res) {
  try {
    await requireOwner(req);

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const { db } = getFirebaseServices();
    const snapshot = await db.collection("auditEvents")
      .orderBy("occurredAt", "desc")
      .limit(50)
      .get();

    const events = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        occurredAt: data.occurredAt && typeof data.occurredAt.toDate === "function"
          ? data.occurredAt.toDate().toISOString()
          : null
      };
    });

    return sendJson(res, 200, { events });
  } catch (error) {
    return handleApiError(res, error);
  }
};
