# 24/7Nation Global Media — Data Model and Permission Matrix

Status: Design baseline — not yet deployed as database collections or access rules.

## 1. Design principles

- Keep the six official pillars unchanged.
- Keep Maidammanation Productions within pillar 02, 24/7 Nation Global Media.
- Treat 24/7 Nation Connect as a cross-platform communication service, not a seventh pillar.
- Deny access by default. Grant only the permissions required for a person's assigned work.
- Separate public content from confidential business, staff and member records.
- Never rely on hidden buttons or browser-side role checks as security controls.
- Keep privileged role changes, publication actions and audit writes on a trusted backend.
- Do not store passwords, authentication tokens, private keys or payment-card data in Firestore.

## 2. Proposed Firestore collections

| Collection | Purpose | Data classification |
|---|---|---|
| organisation | Approved organisation profile, contact and brand settings | Public / internal |
| departments | Six pillar metadata and approved department settings | Internal |
| users | User UID, display name, status and minimal profile fields | Confidential |
| roleAssignments | User-to-role and department scope assignments | Highly restricted |
| stories | Newsroom drafts, approved stories, source references and corrections | Mixed; private drafts |
| artists | Artist profiles, public biography and internal management metadata | Mixed |
| releases | Music release metadata, credits, rights status and links | Mixed |
| productions | Maidammanation Productions projects, schedules and crew assignments | Internal |
| mediaAssets | File metadata, storage path, rights, consent, credit and expiry | Mixed |
| memberApplications | Membership applications and review status | Confidential |
| members | Approved member profiles and preferences | Confidential |
| announcements | Approved public or member-only announcements | Mixed |
| auditEvents | Append-only record of privileged actions | Highly restricted |
| systemSettings | Non-secret feature flags and platform settings | Restricted |

This is a proposed logical model. Collection names, fields, indexes and retention periods must be reviewed before implementation.

## 3. Proposed role model

Roles are proposals, not active account permissions:

- Owner: ultimate organisational authority and access to all approved management functions.
- Super-admin: delegated platform administration, without the ability to change or replace the owner.
- Department administrator: manages only assigned department records and staff workflows.
- Editor / journalist: creates and edits assigned editorial drafts; cannot publish unless separately approved.
- Artist / production manager: manages assigned artist, release or production records.
- Community manager: processes member workflows and approved community announcements.
- Member: accesses only their own profile and explicitly authorised member resources.
- Public visitor: accesses published public content only.

A user may have a role scoped to one department. Do not assume every staff member should see every department.

## 4. Permission matrix

| Action | Owner | Super-admin | Department admin | Editor / manager | Member |
|---|---|---|---|---|---|
| View public published content | Yes | Yes | Yes | Yes | Yes |
| View all confidential records | Yes | Limited by policy | Assigned scope | Assigned records | No |
| Create assigned drafts/records | Yes | If delegated | Assigned scope | Assigned scope | Own permitted submissions |
| Edit assigned records | Yes | If delegated | Assigned scope | Assigned scope | Own permitted profile |
| Approve / publish public content | Yes | If delegated | Department scope if granted | No by default | No |
| Invite or suspend staff | Yes | If delegated | No by default | No | No |
| Change owner identity | Owner-controlled recovery only | No | No | No | No |
| Read audit history | Yes | Limited, if delegated | Department scope if approved | No by default | No |
| Edit or delete audit history | No normal client access | No | No | No | No |
| Export confidential data | Explicitly authorised | Explicitly authorised | No by default | No | Own data request only |

All permissions must be enforced by Firestore Security Rules and trusted backend endpoints. The matrix is a starting point for review, not an executable security policy.

## 5. Editorial workflow

Draft → Submitted for review → Approved → Scheduled / Published → Archived.

- Drafts and private source notes must never be publicly readable.
- Publishing requires an authorised approver.
- Corrections must preserve the prior published version and record the reason.
- Record source references, contributor attribution, image/video rights and consent where applicable.
- AI-assisted drafts require human review before publication.

## 6. Audit event minimum fields

A trusted backend should create audit events containing:

- eventId
- actorUid
- actorRoleAtTime
- action
- resourceType
- resourceId
- timestamp (server-generated)
- outcome
- reason or approval reference for sensitive actions
- requestId where available

Audit events must not contain passwords, tokens, private keys or unnecessary personal information. Ordinary users and administrators must not be able to modify or erase them.

## 7. Implementation sequence

1. Review and approve this logical model and role matrix.
2. Define exact field schemas, validation, indexes and data retention.
3. Implement trusted role assignment and token verification.
4. Write deny-by-default Firestore rules and automated allow/deny tests.
5. Implement audit writes through trusted backend code.
6. Add Storage rules and secure upload validation.
7. Only then enable staff invitations and real operational records.

## 8. Current security warning

The existing Firestore rules are intentionally owner-only and should remain so until the new access model is implemented and tested. Do not manually add staff permissions by broadening the current catch-all rule. Do not enter sensitive member, staff, contract or private editorial records into placeholder modules.
