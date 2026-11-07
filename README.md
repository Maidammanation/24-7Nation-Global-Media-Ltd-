# 24/7 Nation Global Media

**Rising A Voice For The North.**

A mobile-first digital home for 24/7 Nation Global Media — bringing together youth empowerment, music, community development and media innovation.

## Official main divisions

1. **24/7 Nation Music Records** — artist development, music releases, talent management and promotion.
2. **24/7 Nation Global Media** — the central media operation for news, journalism, storytelling, entertainment coverage, live media and partnerships. **Maidammanation Productions** is its production and creative arm, covering film, video, interviews, podcasts, live coverage, editing, graphics and animation.
3. **24/7 Nation Family** — the family and community movement focused on unity, youth empowerment and community development.
4. **24/7 Nation Mobile App** — the planned mobile destination for content, artists, services and community connection.
5. **24/7 Nation Website** — the official public digital home for news, music, videos, events and company information.
6. **Community Portal for Members** — a dedicated member space planned for registration, profiles, announcements and communication.

These are six distinct pillars under one organisation and one shared vision. Maidammanation Productions sits inside pillar 2; it is not a seventh pillar or a separate parent organisation. **24/7 Nation Connect** is the planned communication service across the website, member portal and future mobile app.

## Brand identity

- Black, red and gold visual identity
- One Vision • One Family • One Movement
- Arewa to the World
- Rising A Voice For The North

## Current website foundation

This first release is a responsive static website built with plain HTML, CSS and JavaScript so it can be edited and maintained directly from GitHub, including on a phone.

### Files

- `index.html` — homepage structure and content
- `styles.css` — responsive design system and layouts
- `script.js` — mobile navigation, active section navigation and footer year

## Run locally

Open `index.html` in a browser, or serve the repository with any static web host.

## Important implementation notes

The homepage presents the six official divisions. The mobile app and member portal are future products and are not represented as already operational. News publishing, artist records, music playback, account registration, community messaging, voice/video calls, livestreaming, payments, AI services and the owner/admin dashboard still need secure backend integration. Do not enter real user data or credentials into this static website.

## Next development milestones

1. Review and refine the homepage on mobile and desktop.
2. Build dedicated pages for the six pillars and Maidammanation Productions media categories.
3. Add a secure owner dashboard and role-based content management.
4. Connect authentication, database and media storage.
5. Develop the mobile app and member community portal.
6. Add an AI assistant with human approval, then 24/7 Nation Connect messaging followed by voice/video calling using managed real-time infrastructure.
7. Add SEO, analytics, accessibility, privacy, security and production deployment checks.

© 24/7 Nation Global Media.

## Planned AI and communication architecture

- AI features: newsroom research and drafting support, creative writing assistance, media-library search/tagging and an owner/admin copilot.
- AI safety: source review, human editorial approval, privacy safeguards, rights checks and no autonomous publishing.
- Messaging: authenticated accounts, conversation permissions, moderation/reporting, secure media storage and push notifications.
- Voice/video: WebRTC-based calling using a managed real-time communications provider (for example, LiveKit), with signalling, STUN/TURN, access controls and reliability testing.
- Suggested backend foundation: Firebase Authentication, Firestore and Cloud Storage, with privileged server-side functions. Keep service-account keys and admin credentials out of browser code.
- Build order: backend and roles first; content management and audit logs next; AI tools after server-side security; messaging next; voice/video after messaging and notification flows are stable.
- Calls must not be recorded by default. Any future recording feature requires explicit consent, clear notice and a lawful retention policy.

All AI, dashboard, chat, voice and video features described above are planned. They are not live until implemented, tested and deployed.


## Organisation and engineering handbook

The project now keeps its governance and technical decisions in version-controlled documents:

- [Organisation Charter](docs/ORGANISATION_CHARTER.md) — purpose, six pillars, roles and operating principles.
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) — current foundation and target system architecture.
- [Delivery Roadmap](docs/DELIVERY_ROADMAP.md) — phased implementation plan and release gates.
- [Security and Governance](docs/SECURITY_GOVERNANCE.md) — access control, privacy, audit history and release security.
- [Data Model and Permission Matrix](docs/DATA_MODEL_AND_PERMISSION_MATRIX.md) — proposed collections and role boundaries.
- [Firestore Field Schema](docs/FIRESTORE_FIELD_SCHEMA.md) — version 1 field-level data contract.
- [Firestore Rules](firestore.rules) — tracked owner-only security baseline; not automatically deployed to Firebase.
- [Firebase Configuration](firebase.json) — Firebase CLI rules and index file paths.
- [Firestore Rules Tests](tests/firestore-rules/firestore.rules.test.js) — emulator tests for owner, signed-in non-owner and unauthenticated access.
- [GitHub Actions Security Workflow](.github/workflows/firestore-rules-tests.yml) — runs the rules tests on relevant changes.

Read these documents before changing organisational structure, permissions, data models or platform architecture. Update them whenever an approved decision changes.


## Secure backend foundation

- [Backend Setup and API Reference](docs/BACKEND_SETUP.md) — owner-only role assignment and read-only audit history endpoints, required server secrets, and deployment checks.
- [Role Assignment API](api/admin/role-assignments.js) — owner-only create/list/revoke operations; assignments do not yet grant staff data access.
- [Audit Events API](api/admin/audit-events.js) — owner-only read access to the latest audit events.
- [Backend Validation Tests](tests/backend/validation.test.js) — input validation tests for role and department assignments.
- [Backend CI Workflow](.github/workflows/backend-validation-tests.yml) — runs backend validation tests on relevant changes.

The backend requires Vercel environment variables documented in BACKEND_SETUP.md. No service-account key is committed. The Firestore owner-only rules remain unchanged.
