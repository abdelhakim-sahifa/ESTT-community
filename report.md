
# Auto Email Sender Scan Report

Date: 2025-12-29

## Summary

I scanned the repository to identify user flows and code locations where automated (transactional) email sending should be implemented using Nodemailer. Firebase client-side email actions (email verification, password reset) are already used in places; the rest of the application needs server-side transactional emails (ticket confirmations, approvals, notifications, form confirmations, etc.).

## High-priority flows to add auto-email sending

- Signup / Welcome
  - Why: send a welcome / account-created transactional email and optionally a server-side verification email if you prefer server control.
  - Files: app/signup/page.js, context/AuthContext.js
  - Trigger point: after successful user creation (where `signUp` returns and after `sendEmailVerification` call).
  - Email examples: Welcome email, account created, additional onboarding instructions.

- Ticket creation & validation
  - Why: when a ticket is created, users expect a confirmation (with ticket id/QR and link); when an admin validates a ticket, user should be notified.
  - Files: app/clubs/[clubId]/forms/[formId]/page.js (push to `tickets`), app/tickets/[ticketId]/page.js, app/clubs/[clubId]/admin/page.js (admin ticket actions).
  - Trigger points: immediately after push/create of `tickets`, and on status updates (e.g., pending -> valid).
  - Email examples: Ticket confirmation (with QR or secure link), ticket validated, ticket rejected.

- Club request workflow (create/approve/reject)
  - Why: requestor and named contacts should be notified when a club request is approved or rejected.
  - Files: app/clubs/request/page.js, components/AdminDashboard.js (approve/reject handlers), lib/clubUtils.js (createClubFromRequest).
  - Trigger point: after `createClubFromRequest(...)` completes and after updating `clubRequests` status to `approved`/`rejected`.
  - Email examples: Request received, request approved (include next steps), request rejected (reason).

- Club change requests
  - Why: notify the requestor and club admins when changes are approved/rejected.
  - Files: components/AdminDashboard.js (handleApproveChangeRequest / handleRejectChangeRequest), clubChangeRequests DB node.
  - Trigger point: after updating `clubChangeRequests/${id}` status to `approved`/`rejected`.

- Join requests & form submissions
  - Why: confirm to applicants and notify club administrators when someone requests to join or submits a form.
  - Files: app/clubs/[clubId]/join/page.js, any form pages under app/clubs/[clubId]/forms/* that write `joinRequests` or `formSubmissions`.
  - Trigger point: after pushing `joinRequests` / `formSubmissions` to the DB.

- Admin actions affecting users (role changes, invites)
  - Why: inform affected users of role assignments, invites, membership changes.
  - Files: various admin UIs (components/AdminDashboard.js, club admin pages).
  - Trigger point: after update/write operations that change `clubs/*/organizationalChart` or `users/*/role`.

- Contact / Contribute submissions
  - Why: confirm receipt to the submitter and notify site admins.
  - Files: app/contribute/page.js (and any contact forms).
  - Trigger point: after a successful submission.

## Lower-priority / optional flows

- New club posts / announcements
  - Notify club members optionally when `clubPosts` is created. Files: app/page.js (reads `clubPosts`), club post creation UIs.

## Notes about authentication-related emails

- The app already uses Firebase client-side functions for email verification and password resets (`sendEmailVerification`, `sendPasswordResetEmail`). These are generally secure and recommended to keep for auth flows.
- Recommendation: Keep Firebase for auth action emails, and use Nodemailer for transactional emails (tickets, approvals, confirmations, notifications). Alternatively you can centralize all emails to your server route to unify branding and templates, but you will then need to handle the verification / reset flows yourself or call Firebase Admin APIs.

## Recommended implementation approach (high level)

- Add a server-side API route to send transactional emails using Nodemailer. Because this project uses the `app/` router, create: `app/api/send-email/route.js` (server route) which accepts a JSON payload like `{ to, subject, template, data }`.
- Secure the route: require server-side verification (use Firebase Admin token verification, or only call the route from server-side modules). For admin-triggered emails, call send-email from server-side code (e.g., inside `lib/clubUtils.js` or server components) after DB updates.
- Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`.
- Templates: store simple Handlebars / MJML / plain HTML templates under `lib/email-templates/` or `templates/` and render them server-side before sending.
- Idempotency & retries: when sending emails after DB writes, ensure the email-send call is executed after the DB write completes (or queued). Consider storing an `emails` node in DB for audit / retry.

## Suggested concrete integration points (files & lines to edit)

- Signup: app/signup/page.js — after `signUp` success and profile DB write (near the `await sendVerification(user);` call), call server API to send welcome email.
- Ticket creation: app/clubs/[clubId]/forms/[formId]/page.js — after `push(ref(db, 'tickets'))` completes, call send-email API to the ticket holder and club admins.
- Ticket validation: wherever status is updated (admin UIs / functions that set `tickets/${id}/status`), call send-email after the update.
- Club request approve/reject: lib/clubUtils.js — after `update(requestRef, { status: 'approved' })` (or rejected), call send-email to `requestData.requestedBy` (or stored email) with decision.
- Club change requests: components/AdminDashboard.js — after the `update(ref(db, `clubChangeRequests/${request.id}`), { status: 'approved' })` call, add send-email.
- Join requests & forms: where `joinRequests` / `formSubmissions` are pushed, call send-email to applicant and club contacts.

(Exact line numbers vary because of build artifacts — search for `push(ref(db, 'tickets')`, `clubRequests`, `clubChangeRequests`, `formSubmissions`, and the admin handlers in `components/AdminDashboard.js`.)

## Minimal developer checklist to implement Nodemailer

1. Add `nodemailer` to `package.json` and install.
2. Create `app/api/send-email/route.js` implementing Nodemailer with env-configured SMTP.
3. Add simple template renderer (e.g., small Handlebars helper) and a `templates/` folder with at least: `welcome.html`, `ticket-confirmation.html`, `ticket-validated.html`, `club-request-approved.html`, `form-submission-confirmation.html`.
4. Wire calls at the points described above (server-side where possible). Protect the API.
5. Test end-to-end with a staging SMTP account.

## Next steps I can take for you

- Implement the `app/api/send-email/route.js` with Nodemailer and one example template (welcome or ticket confirmation).
- Implement one end-to-end flow (e.g., ticket confirmation) and a small unit test / manual testing instructions.

---

# Gmail Configuration
EMAIL_USER=estt.community@gmail.com
EMAIL_PASSWORD=akhe qiyr tkbv zwpd
PORT=3000
