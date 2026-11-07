# 24/7Nation Global Media — Security and Governance Baseline

## 1. Current security position

The current Firestore rules restrict all database reads and writes to one known owner UID. This is a temporary owner-only baseline. It is safer than opening the database, but it is not the final multi-user access model.

The owner UID check in browser JavaScript is a user-interface gate, not a security boundary. Database rules and trusted backend verification must enforce access independently.

The current dashboard has not yet completed end-to-end browser security testing. Do not add staff accounts or real member records until the role model and rules have been implemented and tested.

## 2. Identity requirements

- Require authenticated accounts for all private areas.
- Verify ID tokens on trusted server-side endpoints.
- Use least privilege and deny access by default.
- Keep owner authority separate from delegated administrators.
- Do not allow an administrator to promote themselves or alter the owner identity.
- Require re-authentication for sensitive actions where supported.
- Provide account suspension, recovery and credential rotation procedures.
- Never collect passwords or verification codes through chat, forms or support messages.

## 3. Role and data access requirements

Before enabling staff roles, define a permission matrix covering:
- Read, create, edit, approve, publish, archive and delete.
- Which department or records each role may access.
- Whether personal data, contracts, rights documents or private messages are included.
- Who can invite, suspend or change roles.
- Who can export records.

Enforce this matrix in Firestore rules and trusted backend functions. Hiding a navigation item or disabling a button is not access control.

## 4. Audit history

Audit events should be append-only from normal application workflows and written by trusted backend code. Capture, as appropriate:
- Actor UID and effective role.
- Action and affected record.
- Timestamp.
- Outcome.
- Reason or approval reference for sensitive changes.
- Request/correlation identifier where available.

Never store passwords, authentication tokens, private keys or unnecessary personal information in audit records. Ordinary staff should not be able to edit or erase audit history.

## 5. Data protection

- Collect only information needed for a defined purpose.
- Separate public content from private staff/member information.
- Define retention, correction, export and deletion processes.
- Restrict media uploads by type and size; scan or validate files where feasible.
- Store rights, credits, consent and usage restrictions with media records.
- Use secure transport and provider access controls.
- Plan encrypted backups and periodically test restoration.
- Document privacy notices and support contact before public registration.

## 6. Editorial and AI safeguards

- Require a human approver before public release.
- Preserve source notes and correction history.
- Respect copyright, music rights, image rights, interview consent and embargoes.
- Do not submit confidential member or staff information to third-party AI services without an approved legal and privacy basis.
- Keep AI API keys server-side.
- Apply rate limits, quotas, monitoring and clear AI-assisted labelling where appropriate.

## 7. Communications safeguards

Before messaging or calling launches:
- Define who can contact whom and who can create groups.
- Provide blocking, reporting and moderation workflows.
- Protect uploaded files and message access.
- Define retention and abuse-response processes.
- Use a managed real-time calling provider and test network resilience.
- Do not record calls by default; any recording feature requires clear notice, consent and lawful retention controls.

## 8. Incident response

Maintain a practical response plan for suspected account compromise, data exposure, malicious uploads, unauthorised publishing and service outage. The plan should identify who can disable access, rotate secrets, preserve evidence, notify affected people and restore service.

## 9. Release security checklist

- [ ] No private keys, tokens or passwords committed.
- [ ] Authentication and authorisation tested.
- [ ] Firestore and Storage rules tested for allowed and denied cases.
- [ ] Privileged actions logged.
- [ ] Input validation and safe output rendering reviewed.
- [ ] Dependencies and third-party integrations reviewed.
- [ ] Privacy and rights implications checked.
- [ ] Backup and rollback path known.
- [ ] Public claims match the actual feature status.
