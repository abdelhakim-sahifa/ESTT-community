# Project Migration: ESTT Community (Web to React Native)

This document provides a comprehensive technical guide for engineers to rebuild the ESTT Community platform as a React Native mobile application.

## 1. Project Overview
ESTT Community is a collaborative platform for students of the École Supérieure de Technologie de Tétouan. It facilitates resource sharing (PDFs, docs), club management, internal real-time communication, and a student marketplace (Ads).

### Technology Stack (Current Web)
- **Framework**: Next.js 14 (App Router)
- **Authentication**: Firebase Auth (Academic Email restricted)
- **Primary Database**: Firebase Realtime Database (RTDB)
- **File Storage**: Supabase Storage
- **Styling**: Tailwind CSS + Shadcn UI
- **Notifications**: Nodemailer (Server-side)

---

## 2. Recommended Mobile Stack
- **Framework**: **Expo** (Managed Workflow)
- **Navigation**: **Expo Router** (File-based routing)
- **Styling**: **NativeWind** (Tailwind for React Native)
- **Database/Auth**: `@react-native-firebase/app`, `auth`, `database`
- **Storage**: `@supabase/supabase-js`
- **Utility**: `lucide-react-native`, `expo-camera`, `expo-image-picker`

---

## 3. Data Architecture (Critical Details)

### Firebase RTDB Structure
| Path | Description | Key Fields |
| :--- | :--- | :--- |
| `users/{uid}` | User Profiles | `firstName`, `lastName`, `filiere`, `startYear`, `academicOverride`, `role` |
| `resources/{id}` | Academic Files | `title`, `description`, `url`, `semester`, `module`, `unverified` (bool) |
| `clubs/{id}` | Student Clubs | `name`, `description`, `logo`, `themeColor`, `verified` (bool), `members` |
| `clubPosts/{clubId}/{postId}` | Club Updates | `title`, `content`, `imageUrl`, `type` (announcement/activity) |
| `chats/{roomId}/messages` | Group Chat | `text`, `senderId`, `senderName`, `timestamp`, `isMentor` |
| `studentAds/{id}` | Marketplace Ads | `title`, `description`, `url` (image), `status` (live/pending), `link` |
| `tickets/{id}` | Event Tickets | `userId`, `eventId`, `scanned` (bool), `createdAt` |

### Supabase Storage
- **Bucket Name**: `resources`
- **File Naming Convention**: `${Date.now()}_${original_filename}`
- **Security**: Public Read, Authenticated Write.

---

## 4. Implementation Steps (Simple to Complex)

### Step 1: Authentication & User Onboarding
- **Requirement**: Allow only `@etu.uae.ac.ma` emails.
- **Exceptions**: Check `emailExceptions` node in Firebase for allowed `@gmail.com` addresses.
- **Logic**: 
  - On first login, prompt for `filiere` (Major) and `startYear`.
  - Calculate `level` (Year 1 or 2) based on current month (Reset on July 1st).

### Step 2: Global Configuration & Static Data
- Port the academic structure (Fields, Semesters, Modules) from the web's `lib/data.js`.
- These are static lists used for filtering resources.

### Step 3: Home Feed & Announcements
- **Announcements**: Combine data from `adminAnnouncements` and `clubPosts`.
- **Carousel Logic**: Prioritize posts with `imageUrl`. Sort by `createdAt` descending.
- **Ads Preview**: Show latest "live" ads from `studentAds`.

### Step 4: Academic Resources (Core Feature)
- **Browsing**: Filter by Major -> Semester -> Module.
- **Sharing**: Implement file upload to Supabase. Note: React Native requires `FormData` or Base64 depending on the library used.
- **Verification**: New uploads mark `unverified: true` and are hidden until admin approval.

### Step 5: Real-time Group Chat
- **Room IDs**: Logic is `${filiere}_year${level}` (e.g., `idd_year1`).
- **Reset Logic**: Every July 1st, clear `messages` for all rooms to start the new year fresh.
- **Mentors**: Users with `level == 2` in a Room 1 chat are labeled as "Mentors".

### Step 6: Clubs & Events
- List all `verified: true` clubs.
- Individual Club Pages: Display posts, board members, and a "Join" button.
- **Ticket Generation**: When a user registers for an event, create a record in `tickets` and generate a QR Code containing the `ticketId`.

### Step 7: Admin Features (Mobile Scanner)
- **Scanning**: Use `expo-camera` to scan ticket QR codes.
- **Validation**: Check if `ticket.eventId` matches the current club's event and if `scanned` is false. Update to `scanned: true` on success.

---

## 5. Engineer Specifics (How-To)

### Level Calculation Logic
```javascript
const currentMonth = new Date().getMonth(); // 0-11
const currentYear = new Date().getFullYear();
const isNewAcademicYear = currentMonth >= 8; // Starting September
const yearOfStudy = isNewAcademicYear ? (currentYear - startYear + 1) : (currentYear - startYear);
```

### Email Restriction Logic
```javascript
const isAcademic = email.endsWith('@etu.uae.ac.ma');
const isWhitelisted = await checkWhitelist(email); // Firebase lookup
if (!isAcademic && !isWhitelisted) throw Error("Use academic email");
```

### Navigation Map
- `/ (Tabs)`
  - `Home`: Announcements & Ads.
  - `Resources`: Folders for study materials.
  - `Chat`: Real-time class group.
  - `Profile`: User settings & contributions.
- `/ (Stack)`
  - `Login/Signup`
  - `ClubDetail/[id]`
  - `ResourceUpload`
  - `QRScanner` (Admin only)

---

## 6. Project Credentials (EXTERNAL ENGINEER ACCESS)

### Firebase Configuration
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBxyQZhdDbY3CN0G0o0AXPG9hueTXh7_54",
    authDomain: "estt-community.firebaseapp.com",
    databaseURL: "https://estt-community-default-rtdb.firebaseio.com",
    projectId: "estt-community",
    storageBucket: "estt-community.firebasestorage.app",
    messagingSenderId: "154353945946",
    appId: "1:154353945946:web:70546c5aec1bae742b3763",
    measurementId: "G-SQVSELPERE"
};
```

### Supabase Configuration
- **URL**: `https://fnaiedociknutdxoezhn.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYWllZG9jaWtudXRkeG9lemhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjE2NTMsImV4cCI6MjA4MDA5NzY1M30.ydJoZcnBWZUAWKnpq0rdGdqxHvo2fw-61HDJHfavZnk`

### Email Service (Nodemailer/Admin)
- **Service**: Gmail
- **Email**: `estt.community@gmail.com`
- **App Password**: `akhe qiyr tkbv zwpd`
