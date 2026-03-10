# Google Drive Integration Flow

This document explains how the "Contribute-Drive" system stores resources directly in Google Drive.

## Overview

The system uses a **Centralized Storage** model. Although the app requests Drive permissions from every user during login, the actual file storage happens in a single "Community Drive" account (usually an admin account) to simplify permission management and avoid requiring every user to manage their own storage limits for collective resources.

---

## 1. Authentication & Configuration (One-Time Setup)

Before anyone can upload, the application must be linked to a Google account that will "host" the files.

1.  **Authorization**: An administrator visits `/api/drive/auth`. This initiates an OAuth2 flow with the `https://www.googleapis.com/auth/drive.file` scope.
2.  **Token Exchange**: Google redirects back to `/api/drive/callback` with an authorization code.
3.  **Persistence**: The backend exchanges the code for a **Refresh Token**. This token is stored in the Firebase Realtime Database at `adminSettings/driveConfig/refreshToken`.
    *   *Reference*: [drive/auth/route.js](file:///c:/Users/abdel/Desktop/ESTT-community/app/api/drive/auth/route.js), [drive/callback/route.js](file:///c:/Users/abdel/Desktop/ESTT-community/app/api/drive/callback/route.js)

---

## 2. The Upload Flow (Contributor Perspective)

When a student or admin contributes a resource via the UI:

### Step A: Client-Side Call
The UI component calls `uploadResourceFile(file)` from `lib/drive.js`. This function creates a `FormData` object and sends it to our internal API.
*   *Reference*: [lib/drive.js](file:///c:/Users/abdel/Desktop/ESTT-community/lib/drive.js)

### Step B: Backend Processing (`/api/upload-drive`)
1.  **Token Retrieval**: The API fetches the stored `refreshToken` from Firebase (or environment variables).
2.  **Authentication**: It uses the `googleapis` library to authenticate as the "Community Drive" account.
3.  **File Creation**: The file is uploaded to the folder ID specified in `GOOGLE_DRIVE_FOLDER_ID`.
4.  **Public Access**: The API calls `drive.permissions.create` to set the file to `anyone` with the `reader` role. This is crucial so that other students can view/download the resource.
5.  **Response**: The API returns the `webViewLink` (Public URL) and the Google Drive `fileId`.
*   *Reference*: [api/upload-drive/route.js](file:///c:/Users/abdel/Desktop/ESTT-community/app/api/upload-drive/route.js)

### Step C: Database Finalization
The client receives the `publicUrl` and saves it as the resource link in the standard Firebase `contributions` or `resources` path.

---

## 3. Key Implementation Files

| Component | Responsibility | Path |
| :--- | :--- | :--- |
| **Auth Entry** | Starts Admin OAuth flow | [app/api/drive/auth/route.js](file:///c:/Users/abdel/Desktop/ESTT-community/app/api/drive/auth/route.js) |
| **Callback** | Saves tokens to Firebase | [app/api/drive/callback/route.js](file:///c:/Users/abdel/Desktop/ESTT-community/app/api/drive/callback/route.js) |
| **Upload API** | Handles the actual Google API calls | [app/api/upload-drive/route.js](file:///c:/Users/abdel/Desktop/ESTT-community/app/api/upload-drive/route.js) |
| **Client Helper**| Bridge between UI and API | [lib/drive.js](file:///c:/Users/abdel/Desktop/ESTT-community/lib/drive.js) |
| **Config** | Google Provider Scopes | [lib/firebase.js](file:///c:/Users/abdel/Desktop/ESTT-community/lib/firebase.js) |

---

## 4. Why this approach?

*   **Privacy**: Users don't have to worry about their personal files being linked; the community account handles everything.
*   **Consistency**: All community resources are in one managed folder.
*   **Ease of Use**: Contributors don't need to manually set sharing permissions on their own drives.
*   **Zero Cost**: Uses the free 15GB space of a dedicated Google account instead of paid cloud storage.

> [!NOTE]
> If you ever need to change the account that stores the files, simply visit `/api/drive/auth` again and sign in with the new account.
