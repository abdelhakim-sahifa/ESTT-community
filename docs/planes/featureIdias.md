# ESTT Community – New Feature Ideas

This document lists potential new features that extend the current ESTT Community platform while fitting its existing stack (Next.js 14, Firebase RTDB, Supabase, Tailwind + shadcn).

---

## 1. Learning & Resources

- **Resource bookmarking & personal library**
  - Students can “save” resources to a personal list (e.g. `userFavorites/{uid}/{resourceId}`).
  - Add “Recently viewed” and “Pinned for this semester” sections.
- **Resource ratings & feedback**
  - 1–5 star rating + optional short review per resource.
  - Show average rating in listings; admins can see low‑quality resources to clean up.
- **Recommended resources**
  - Use `users/{uid}.filiere`, `level`, and most accessed modules.
  - Surfaces:
    - “Recommended for your filière & level”
    - “Most used this week in your filière”.
- **Study collections / playlists**
  - Users group multiple resources into named “Collections” (e.g. “DS Révision S2”).
  - Collections can be private or shareable links inside clubs or chats.

---

## 2. Clubs & Events

- **Unified events calendar**
  - Global calendar aggregating all club events (month/week/list views).
  - Filters: club, event type (workshop, talk, competition), free/paid.
- **Event reminders & RSVPs**
  - Students mark “Interested / Going”.
  - Store in `eventAttendees/{eventId}/{uid}` and send email / in‑app reminders.
- **Post‑event recap & resources**
  - After events, clubs upload slides, photos, and a feedback form linked to the event.
  - Shown on the event page and in an attendee’s profile history.
- **Club role management**
  - Roles like `president`, `vp`, `media`, etc., with permissions (post, edit events, validate members).
  - Stored in `clubs/{id}/members/{uid}.role`.

---

## 3. Chat & Community

- **Threaded discussions**
  - Allow replies to specific messages (threads) for announcements and questions.
  - Structure like `chats/{roomId}/threads/{messageId}/replies`.
- **Mentor Q&A corner**
  - Dedicated Q&A rooms per filière where `level 2` students answer questions.
  - Answers can be marked as “Accepted” and surfaced later.
- **Reactions & polls**
  - Message reactions (👍, ❤️, ✅) kept as a small map per message.
  - Simple polls in chat or club pages (e.g. vote on event dates).

---

## 4. Student Marketplace (Ads)

- **Buyer–seller conversations**
  - Lightweight chat tied to each ad: `adChats/{adId}/{conversationId}/messages`.
  - Notifications when a new message arrives.
- **Ad categories & filters**
  - Categories (books, electronics, services, housing), price range filter, condition (new/used).
  - Sorting by recency or price.
- **Ad safety & reporting**
  - “Report this ad” button → `adReports/{adId}/{reportId}`.
  - Admin dashboard to review reports, hide ads, or warn/ban users.

---

## 5. Profiles & Gamification

- **Public profiles & contribution history**
  - Show counts of verified resources, events attended, clubs joined, blog posts.
  - “Contribution timeline” with filters by type.
- **Badges & levels**
  - Example badges:
    - “Contributor” (3+ resources approved)
    - “Mentor” (10+ helpful answers)
    - “Event champion” (5+ events attended)
  - Displayed on profile, in chat, and club pages.
- **Personal academic roadmap**
  - Based on filière + level, show recommended modules each semester.
  - Link to best‑rated resources for each module.

---

## 6. Admin & Analytics

- **Advanced analytics dashboard**
  - Per‑filière stats: active users, most downloaded modules, peak usage times.
  - Club performance: event attendance over time, engagement on posts.
  - Marketplace metrics: number of ads by category, time to first response.
- **Moderation queues**
  - Explicit queues for:
    - Pending resources
    - Reported resources/ads/users
    - Pending clubs
  - Filters and bulk moderation actions.
- **Configurable announcements & banners**
  - Admin UI to schedule homepage banners and alerts (exam periods, deadlines).
  - Target by filière, level, or club membership.

---

## 7. PWA & Mobile Experience

- **Offline‑friendly mode**
  - Cache recent resources metadata, club list, and schedule.
  - Offline banner + limited read‑only mode when RTDB is unreachable.
- **Installable app‑like experience**
  - Refine manifest, icons, and “Install app” prompts.
  - Per‑device settings (dark mode, reduced motion) stored locally and/or in RTDB.

---

## 8. Onboarding & Ecosystem

- **In‑app onboarding & guided tour**
  - First‑time users get a short tour (search, clubs, chat, contribute).
- **Data export & simple APIs for clubs**
  - Export club event stats to CSV.
  - Simple read‑only endpoints for clubs to integrate stats in their own materials.

