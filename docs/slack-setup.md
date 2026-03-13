# Slack Integration Setup Guide

This document outlines the multi-channel Slack notification system for the ESTT Community platform. This system is designed to keep the developer team and administrators informed about key platform events.

## 1. Channel Organization

We recommend setting up the following Slack channels to categorize notifications:

| Channel Name | Target Audience | Event Types |
| :--- | :--- | :--- |
| `#alerts-prod` | Developers | Critical errors, high-severity bug reports. |
| `#admin-tasks` | Admins | New resource contributions, content reports, verification requests. |
| `#finance-alerts` | Admins/Finance | Ad payments, ticket completions, Stripe webhook events. |
| `#community-vibe` | All | New user signups, resource views (engagement tracking). |

## 2. Configuration (`.env.local`)

Add the following webhook URLs to your environment variables. You can create these in the [Slack App Directory](https://api.slack.com/apps).

### Option 2: Vercel CLI (Fastest)

1. **Install & Login**:
```bash
npm install -g vercel
vercel login
```

2. **Link Project**:
Run this in the project root:
```bash
vercel link
```

3. **Add Secrets**:
```bash
vercel env add SLACK_WEBHOOK_ALERTS
vercel env add SLACK_WEBHOOK_ADMIN
vercel env add SLACK_WEBHOOK_FINANCE
vercel env add SLACK_WEBHOOK_COMMUNITY
```

```bash
# Slack Webhooks
SLACK_WEBHOOK_ALERTS="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_ADMIN="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_FINANCE="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_COMMUNITY="https://hooks.slack.com/services/..."
```

## 3. Trigger Points in Codebase

| Component | Event | Target Channel | Information Sent |
| :--- | :--- | :--- | :--- |
| `report-bug` | Bug Submitted | `#alerts-prod` | Title, Severity, OS/Browser, Reporter. |
| `contribute` | New contribution | `#admin-tasks` | Title, Module, Author, File (if any). |
| `stripe-webhook` | Ad/Ticket Paid | `#finance-alerts` | Amount, Type (Ad/Ticket), Item ID. |
| `resource-view` | Resource Entered | `#community-vibe` | Resource Title, User Name. |

## 4. Technical Implementation

We use a central utility `lib/slack.js` to handle all notifications. This utility abstracts the channel selection logic.

### Example Usage:

```javascript
import { notifySlack } from '@/lib/slack';

await notifySlack('admin', {
    title: 'Nouvelle Ressource',
    message: 'Un utilisateur a partagé un nouveau cours.',
    details: { title: 'Maths S1', author: 'Abdel' }
});
```
