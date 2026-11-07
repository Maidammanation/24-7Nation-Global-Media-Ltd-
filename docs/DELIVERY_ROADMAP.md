# 24/7Nation Global Media — Delivery Roadmap

This roadmap turns the organisation's ambition into controlled, testable releases. A phase is not complete because a screen exists; it is complete when its user journeys, security and recovery checks pass.

## Phase 0 — Governance and foundation
**Status: underway**

- [x] Confirm the six official pillars and organisational boundaries.
- [x] Create the GitHub source repository.
- [x] Create the public static website foundation.
- [x] Create the initial owner dashboard interface.
- [x] Connect the GitHub repository to Vercel.
- [x] Create a dedicated Firebase project for 24/7Nation Global Media.
- [x] Enable Firebase Email/Password authentication.
- [x] Publish temporary owner-only Firestore rules.
- [ ] Verify the public website and admin route in a real browser.
- [ ] Test owner login, wrong password, sign-out and unauthorised account behaviour.
- [ ] Review domain, privacy, legal and contact information.
- [ ] Add repeatable release checks and documented rollback steps.

**Exit gate:** owner login and owner-only data access are tested end-to-end; no unverified service is advertised as live.

## Phase 1 — Secure platform core
- Define Firestore collections and data ownership.
- Implement trusted backend token verification.
- Design and test role-based access for owner, super-admin, departmental staff and members.
- Add secure staff invitations and account suspension.
- Add audit events for sign-in/security events, role changes, publication, corrections and privileged data changes.
- Configure Storage rules and upload validation.
- Add backup/export and recovery procedures.

**Exit gate:** automated rules tests prove that each role can access only its permitted records and every privileged action is attributable.

## Phase 2 — Owner operations and content management
- Build real dashboard CRUD for organisation settings, newsroom, artists, releases, productions and media library.
- Add draft/review/approval/publish workflow.
- Add media rights, credits, consent and source tracking.
- Add search, filters, pagination and safe exports.
- Add operational reports based on real records, not hard-coded figures.

**Exit gate:** owner and authorised staff can complete core content workflows on mobile without editing source code; audit trail and permissions pass testing.

## Phase 3 — Public media platform
- Publish approved newsroom stories and corrections.
- Create dedicated artist and release pages.
- Create Maidammanation Productions portfolio and programme pages.
- Add event and partnership information.
- Add SEO, structured metadata, social sharing, accessibility and performance improvements.

**Exit gate:** public content is populated only from approved records and all publication rights and attribution checks are in place.

## Phase 4 — Community Portal
- Member application and verification workflow.
- Member profiles and preferences.
- Announcements and programme registration.
- Member privacy controls, moderation, reporting and safeguarding.
- Clear retention, deletion and support procedures.

**Exit gate:** privacy and safeguarding review completed; members cannot access other members' private records.

## Phase 5 — AI Studio
- Newsroom research and drafting assistant.
- Creative briefs, captions, scripts and podcast outlines.
- Search and tagging for approved media assets.
- Owner/admin assistant for reports and approved site updates.
- Server-side provider integration, cost limits, abuse controls and human approval.

**Exit gate:** secrets remain server-side, outputs are labelled and reviewable, sources can be checked, and no autonomous public publishing is enabled.

## Phase 6 — 24/7 Nation Connect
- Direct and group messaging.
- Conversation permissions, blocking, reporting and moderation.
- File sharing and voice notes with secure storage.
- Notifications and delivery controls.
- Voice/video calls using managed real-time infrastructure.
- Mobile reliability, bandwidth and abuse testing.

**Exit gate:** security, privacy, moderation, notification reliability and call quality are tested before public launch. Recording remains off by default.

## Phase 7 — Mobile app and ecosystem integration
- Design shared identity and API contracts.
- Build mobile app around stable public content and member services.
- Integrate website, member portal and Connect with one account and consistent permissions.
- Add analytics and operational monitoring with privacy safeguards.

**Exit gate:** end-to-end account, content and communication flows work across web and mobile.

## Release discipline

For every release, record:
1. What changed and why.
2. Files and services affected.
3. Risks and data/security implications.
4. Tests performed and results.
5. Deployment URL and commit.
6. Rollback method.

Do not combine major database migrations, permission changes and unrelated visual redesigns in one unreviewed release. Prefer small, reversible changes.
