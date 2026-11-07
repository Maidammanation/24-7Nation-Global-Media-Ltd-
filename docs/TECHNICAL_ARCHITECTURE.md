# 24/7Nation Global Media — Technical Architecture

## 1. Current verified foundation

- Public website: plain HTML, CSS and JavaScript.
- Source control: GitHub repository `Maidammanation/24-7Nation-Global-Media-Ltd-`, default branch `main`.
- Hosting: Vercel project `247nation-global-media`, connected to the GitHub repository.
- Public entry point: `index.html`.
- Owner dashboard entry point: `admin.html`.
- Dashboard authentication code: Firebase Authentication Web SDK.
- Firebase project ID: `nation-global-media`.
- Firestore region selected: `europe-west3`.
- Current Firestore rules are an owner-only baseline for the known owner UID.
- The dashboard's department pages are placeholders. No operational content CRUD, staff role management, audit-log module, AI service, messaging or calling service is complete.

This is a status snapshot, not a claim that every browser flow has passed end-to-end testing.

## 2. Current repository shape

```text
/
├── index.html
├── styles.css
├── script.js
├── admin.html
├── admin.css
├── admin.js
├── README.md
└── docs/
    ├── ORGANISATION_CHARTER.md
    ├── TECHNICAL_ARCHITECTURE.md
    ├── DELIVERY_ROADMAP.md
    └── SECURITY_GOVERNANCE.md
```

Keep the public website simple while it is static. As the application grows, move code into a clear structure only with a planned migration and tested routes; do not rename or relocate current entry files casually.

## 3. Target architecture

### Public experience
- Public website for company information, approved news, artist profiles, releases, productions, events and contact.
- Search-engine metadata, accessible markup, responsive design and performance budgets.
- Public pages must never expose private member, staff or administrative data.

### Identity and access
- Firebase Authentication for sign-in.
- Trusted backend verification of Firebase ID tokens.
- Server-managed role claims or a secure role registry.
- Firestore security rules that enforce least privilege at the data layer.
- Owner recovery and account-change procedures documented before opening staff registration.

### Data
- Firestore for structured records.
- Cloud Storage for media assets and documents, with access rules and metadata.
- Server-side functions for privileged writes, publication actions, role administration and integrations.
- Data schema, indexes, retention and export procedures documented before production data is entered.

### Content workflow
- Draft → review → approved → scheduled/published → archived.
- Separate public content from private editorial notes and personal data.
- Store source references, media rights, consent and correction history where relevant.
- Every privileged publication or correction action should be attributable.

### AI services
- AI calls must run through a trusted backend, never expose provider secrets in browser JavaScript.
- Use approved source material and show when content is AI-assisted.
- Require human review before public publishing.
- Apply rate limits, access checks, logging, privacy minimisation and cost controls.
- Do not use AI as the final decision-maker for hiring, discipline, member eligibility or other high-impact decisions.

### Communication
- Build authenticated messaging, permissions, reporting/blocking, moderation and notifications before calling features.
- Use a managed real-time provider for voice/video (for example, LiveKit) rather than attempting to operate global calling infrastructure from scratch.
- Plan signalling, STUN/TURN, bandwidth, abuse controls and mobile testing.
- Calls are not recorded by default. Any future recording requires clear notice, consent and a lawful retention policy.

## 4. Environments and releases

Maintain separate development, preview and production environments. Never use production member data for testing. Keep environment-specific configuration separate and review every production change.

- GitHub `main` is the production source branch currently connected to Vercel.
- Use preview deployments to test changes before release.
- A deployment marked READY confirms hosting deployment status, not functional acceptance.
- Test the homepage, mobile navigation, admin route, authentication, authorisation and data access before calling a release complete.
- Keep a known-good deployment available for rollback.

## 5. Secrets and configuration

- Firebase web configuration is client-side configuration, not a service-account private key.
- Never commit service-account JSON, private keys, OAuth client secrets, AI provider keys, Vercel tokens or user passwords.
- Store server secrets in the hosting provider's encrypted environment-variable settings.
- Restrict Firebase API usage where appropriate and configure App Check before broad public use.
- Rotate any credential immediately if it is accidentally exposed.

## 6. Reliability and quality

Before each significant release:
- Check links and routes.
- Check mobile and desktop layouts.
- Check browser console and deployment/runtime errors.
- Test authentication and unauthorised access.
- Test Firestore and Storage rules using representative user roles.
- Verify accessibility basics, page metadata and performance.
- Confirm backup/export and recovery paths for important data.

## 7. Architecture decision rule

Choose the simplest architecture that securely supports the next real user need. Avoid adding frameworks, services or paid integrations just because they sound advanced. Record significant decisions, trade-offs, cost implications and rollback plans in writing.
