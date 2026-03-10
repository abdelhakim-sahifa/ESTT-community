# Migration Plan: Supabase to Google Drive API for Contribution Storage

## Objective
Replace Supabase Storage with Google Drive as the host for uploaded files (PDFs, images) submitted by contributors and admins.

## Current State Analysis
- **Storage Layer**: Currently using `@supabase/supabase-js` to upload files to a `resources` bucket directly from the client side.
- **Helper File**: `lib/supabase.js` exports `uploadResourceFile(file)` which authenticates anonymously and uploads the file up to 10MB.
- **Usage**:
  - `app/(marketing)/contribute/page.js` - User contributions.
  - `components/features/admin/AdminFastContribute.js` - Admin rapid contributions.
- Realtime Database (Firebase) stores the resulting `publicUrl`.

## Proposed Architecture with Google Drive
Google Drive API requires a Service Account for authentication so that we don't prompt users to log in with their Google accounts. Since Service Account credentials (private key) cannot be exposed to the client, **uploads must be handled on the server side (Next.js API route)**.

### 1. Prerequisites (Google Cloud Setup)
- Create a project in Google Cloud Console.
- Enable the **Google Drive API**.
- Create a **Service Account** and generate a JSON key.
- Create a folder in Google Drive (e.g., "ESTT Contributions") and share it with the Service Account email (give it "Editor" or "Content Manager" access).
- Add the credentials to `.env.local`:
  ```env
  GOOGLE_CLIENT_EMAIL="your-service-account-email"
  GOOGLE_PRIVATE_KEY="your-private-key"
  GOOGLE_DRIVE_FOLDER_ID="your-folder-id"
  ```

### 2. Dependency Changes
- **Install**: `npm install googleapis`
- **Uninstall** (optional): `npm uninstall @supabase/supabase-js`, once the migration is complete.

### 3. Implementation Steps
#### Step 3.1: Create an API Route (`app/api/upload-drive/route.js`)
Since we're using the App Router, we will create an endpoint that accepts `multipart/form-data`:
- Authenticate using the Service Account credentials.
- Read the file from `request.formData()`.
- Upload the file to the specified Google Drive folder utilizing `googleapis`.
- Set the file permissions to `type: 'anyone', role: 'reader'` so that it is publicly accessible.
- Return the `webViewLink` (or `webContentLink`) to the client.

#### Step 3.2: Update the Client Helper (`lib/drive.js`)
Replace `lib/supabase.js` with a new file or update the existing function to make a `POST` request to our new API route:
```javascript
export async function uploadResourceFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/upload-drive', {
        method: 'POST',
        body: formData
    });
    
    if (!res.ok) throw new Error('Upload failed');
    return await res.json(); // expected format: { publicUrl: '...', ... }
}
```

#### Step 3.3: Update Components
Refactor import statements in the components that use the upload function.
- `app/(marketing)/contribute/page.js`
- `components/features/admin/AdminFastContribute.js`

*(By keeping the function name `uploadResourceFile` and its return signature identical, the component changes will be minimal—mostly just changing the import path).*

## Security & Limitations
- **Deployment File Size Limit**: Next.js App Router handles `formData()` well. However, Serverless hosting providers like Vercel have a strict payload limit (e.g., 4.5MB for the free tier) on API routes. If files are expected to be up to 10MB, this might cause HTTP 413 Payload Too Large errors unless hosted on a VPS, a custom server, or Vercel's paid plans with increased limits. If Vercel is used, an alternative but more complex approach is to implement a resumable upload directly from the client to Google Drive using a temporarily granted access token from the backend.
- **Drive limits**: Google Drive has storage limits (15GB free for the account that owns the folder). It's best to have a dedicated Google account for this application.
