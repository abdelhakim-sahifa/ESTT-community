# Migration Plan: Paid Events & Payments (Mobile App)

This document outlines the steps to replicate the web application's paid events and Stripe payment functionality in the mobile application (React Native).

## 1. Prerequisites (Backend Reuse)
The mobile app should leverage the existing API routes already implemented in the Next.js backend:
-   `POST /api/checkout`: Creates a Stripe Checkout session.
-   `POST /api/verify-payment`: Manually verifies payment status (fallback).
-   `POST /api/webhook/stripe`: Handles asynchronous completion notifications.

the base url = https://estt-community.vercel.app/
## 2. Dependencies (Mobile)
Install the official Stripe SDK for React Native:
```bash
npm install @stripe/stripe-react-native
```

## 3. Implementation Steps

### A. Admin Dashboard (Event Creation)
1.  **Form Update**: Add a numeric input for `price` in the event creation screen.
2.  **Data Sync**: Ensure the `price` field is saved to Firebase under `clubs/${clubId}/events/${eventId}/price`.
3.  **UI**: Display the price in the admin's event list view.

### B. Event Registration & Checkout
1.  **Payment Check**: If `event.price > 0`, change the registration button to "Pay & Register".
2.  **Initialize Payment**:
    -   Call the `/api/checkout` endpoint from the app.
    -   Instead of redirecting to a web URL, use the session details with the Stripe Mobile SDK.
    -   *Option A*: Use `presentPaymentSheet` for a native experience.
    -   *Option B*: Use a `WebView` to open the Stripe Checkout URL (easiest for quick migration).
3.  **Completion Handler**:
    -   After payment completes, navigate the user to the `Ticket` screen with the `session_id`.
    -   Trigger the same direct verification logic as the web app (calling `/api/verify-payment`) to ensure the ticket is validated immediately.

## 4. Stripe Credentials

> [!IMPORTANT]
> Use these test credentials for the sandbox environment.

| Type | Key Value |
| :--- | :--- |

## 5. Verification Plan
- [ ] Create a paid event from the mobile admin panel.
- [ ] Register for the event using the mobile app.
- [ ] Complete the payment using a Stripe test card.
- [ ] Verify the ticket status changes to `valid` in the mobile app.
- [ ] Confirm receipt of the confirmation email.
