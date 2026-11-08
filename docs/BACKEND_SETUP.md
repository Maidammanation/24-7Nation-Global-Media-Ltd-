# 24/7Nation Global Media — Secure Backend Setup

Status: Backend endpoints committed; production credentials and live integration are not configured.

## 1. What this first backend provides

The Vercel Node.js API routes in this repository provide an owner-only foundation for:

- Listing role assignments.
- Creating a new staff Firebase Authentication account directly from the owner dashboard, assigning its role, and generating a password-setup invitation link.
- Assigning a role to an existing Firebase Authentication account.
- Revoking an active assignment without deleting its history.
- Reading the latest 50 audit events.

The routes verify Firebase ID tokens on the server, check the configured owner UID, and use the Firebase Admin SDK. Role assignment changes and their audit events are written together. Audit events are not editable through these APIs.

**Important:** This is an owner-only role administration foundation. It does not yet grant staff access to the dashboard, Firestore collections, Storage files, or publishing workflows. The current Firestore rules must remain owner-only until a separate, complete role-based ruleset and tests are reviewed.

## 2. Required Vercel environment variables

Add these to the Vercel project 247nation-global-media for Preview and Production as appropriate:

| Variable | Value |
|---|---|
| OWNER_UID | The verified owner Firebase Authentication UID |
| FIREBASE_SERVICE_ACCOUNT_JSON | The complete JSON content of a dedicated service-account key for Firebase project nation-global-media |

Do not use the ITF SUPA Firebase project credentials. Do not use a browser Firebase web configuration as an Admin SDK credential.

### Create a dedicated service account

1. Open Google Cloud Console for project nation-global-media.
2. Create a dedicated service account for the 24/7Nation Vercel backend.
3. Grant only the IAM permissions needed to look up Firebase Authentication users and access the Firestore database. Have the exact roles reviewed against the project's IAM policy before issuing a key.
4. Generate a JSON key only if the deployment cannot use a supported keyless identity integration.
5. Copy the JSON key directly into the Vercel environment variable editor. Do not paste it into GitHub, source files, chat, email, or a public issue.
6. Save the variable for the intended environments and redeploy.

Treat the JSON key as a high-value secret. Restrict who can view Vercel environment variables, rotate the key if exposed, and delete unused keys. Never add it to this repository.

## 3. API routes

### POST /api/admin/create-staff

Creates a Firebase Authentication account for a new staff member, creates the role assignment and audit event, and returns a Firebase password-reset link for the owner to share privately. The owner supplies the person's display name, email, role, department codes and appointment reason. No staff password is created, requested or returned.

Example JSON request:

    {
      "displayName": "Amina Musa",
      "email": "amina@example.com",
      "role": "editor",
      "departmentCodes": ["global_media"],
      "reason": "Appointed by the owner"
    }

The account is created with an unverified email. The staff member must use the private password-setup link to choose a password. The link is returned only to the authenticated owner and must not be posted publicly. If account setup or the role/audit transaction fails, the newly created Auth account is deleted.

The service account requires Firebase Authentication Admin permissions for account creation/deletion and password-reset link generation. Firebase Authentication Viewer is insufficient.

### GET /api/admin/role-assignments

Returns up to 100 recent role assignment records. Requires an Authorization: Bearer Firebase-ID-token header. Only the configured owner UID is accepted.

### POST /api/admin/role-assignments

Creates a role assignment for an existing Firebase Authentication UID.

Example JSON request:

    {
      "uid": "EXISTING_FIREBASE_AUTH_UID",
      "role": "editor",
      "departmentCodes": ["global_media"],
      "reason": "Appointment approved by the owner"
    }

Supported roles: super_admin, department_admin, editor, journalist, artist_manager, production_manager, community_manager, member.

Supported department codes: music_records, global_media, family, mobile_app, website, community_portal.

The owner role cannot be assigned through this endpoint. A department administrator must have at least one department scope. Duplicate active assignments with the same role and scope are rejected.

### PATCH /api/admin/role-assignments

Revokes an active assignment. It does not delete the record.

Example JSON request:

    {
      "assignmentId": "ROLE_ASSIGNMENT_DOCUMENT_ID",
      "reason": "Access revoked following a role review"
    }

### GET /api/admin/audit-events

Returns up to 50 latest audit events. This endpoint is read-only.

## 4. Security controls in this release

- Firebase ID token verification occurs on the server, including revoked-token checking.
- Only the configured owner UID can use these management endpoints.
- Requests with a mismatched browser Origin are rejected.
- Responses are marked no-store.
- Role and department values are allowlisted and validated.
- Role assignment and audit-event creation are committed together.
- Role revocation is transactional and creates a separate audit event.
- No endpoint is provided to edit or delete audit events.
- Secrets are read only from server environment variables.
- Errors returned to callers do not expose provider details or stack traces.

## 5. Required checks before real use

- [ ] Add the two Vercel environment variables securely.
- [ ] Confirm the service account has only the required IAM permissions.
- [ ] Deploy to a Preview environment first.
- [ ] Verify missing credentials fail closed with HTTP 503.
- [ ] Verify unauthenticated requests return HTTP 401.
- [ ] Verify a signed-in non-owner returns HTTP 403.
- [ ] Verify owner can create a staff account and receive its password-setup link.
- [ ] Verify duplicate email is rejected without creating a duplicate account.
- [ ] Verify a new staff account and role assignment create an audit event.
- [ ] Verify owner can list assignments and audit events.
- [ ] Verify an invalid Firebase UID cannot receive an assignment.
- [ ] Verify valid assignment creation creates exactly one audit event.
- [ ] Verify revocation changes status and creates an audit event.
- [ ] Verify a revoked assignment cannot be revoked a second time.
- [ ] Verify no normal API route can update or delete audit events.
- [ ] Keep Firestore rules owner-only until role-based access tests cover every collection and role.

Do not enter real staff or member records until these checks pass.

## 6. Known limitations

- The admin dashboard UI has not yet been connected to these API routes.
- Staff role assignments are records only; they do not grant login or data permissions.
- The APIs currently support owner-only management, not delegated super-admin workflows.
- Rate limiting, alerting and operational monitoring still need to be added before wider rollout.
- Service-account key setup is a manual deployment prerequisite. No private key is stored in Git.
