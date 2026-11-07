import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";

import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(__dirname, "../../firestore.rules");
const rules = readFileSync(rulesPath, "utf8");

const PROJECT_ID = "demo-247nation-security";
const OWNER_UID = "6HtU9DzFW3epuzWobvRg54VrRYt2";

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules }
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

test("owner can read and write Firestore documents", async () => {
  const db = testEnv.authenticatedContext(OWNER_UID).firestore();
  const ref = doc(db, "securityChecks", "owner-access");

  await assertSucceeds(setDoc(ref, { status: "owner-write-allowed" }));
  const snapshot = await assertSucceeds(getDoc(ref));

  assert.equal(snapshot.data().status, "owner-write-allowed");
});

test("a signed-in non-owner cannot read or write", async () => {
  const db = testEnv.authenticatedContext("unauthorised-staff-user").firestore();
  const ref = doc(db, "securityChecks", "staff-access");

  await assertFails(getDoc(ref));
  await assertFails(setDoc(ref, { status: "must-be-denied" }));
});

test("an unauthenticated visitor cannot read or write", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  const ref = doc(db, "securityChecks", "public-access");

  await assertFails(getDoc(ref));
  await assertFails(setDoc(ref, { status: "must-be-denied" }));
});
