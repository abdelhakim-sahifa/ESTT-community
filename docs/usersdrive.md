# Plan: Using User's Google Drive for Contribution Storage

## Objective
Enable users to store their contributions (PDFs, Images) directly into their own Google Drive accounts instead of a central storage system (like Supabase or a Service Account).

## Architecture & Flow
Instead of a server-side service account, we use the user's personal OAuth2 token to interact with the Google Drive API.

### 1. Authentication with Scopes
Update the existing `signInWithGoogle` in `context/AuthContext.js` to include required scopes:
```javascript
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file'); 
// drive.file: View and manage Google Drive files and folders that you have opened or created with this app
```

### 2. Handling the Access Token
When the user signs in, Firebase returns a `UserCredential`. We can extract the Google Access Token:
```javascript
const result = await signInWithPopup(auth, googleProvider);
const credential = GoogleAuthProvider.credentialFromResult(result);
const token = credential.accessToken;
// This token needs to be stored (e.g., in a session or state) to use it for uploads.
```
> [!WARNING]
> Access tokens expire. If the user stays on the page for a long time or wants to upload later, we might need to handle token refreshing or re-authentication.

### 3. Client-Side Upload Process
Since we have the token on the client side, we can upload directly to Google Drive without an intermediate API route (unless we want to hide certain logic):
1. User selects a file.
2. The app calls the Google Drive API `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` using the `Authorization: Bearer [TOKEN]` header.
3. The app creates a file and receives a `fileId`.
4. The app sets the file's permission to `anyoneWithLink` (reader) so others in the community can see it.

### 4. Database Storage
The Firebase Realtime Database will still store the metadata of the contribution, but the `url` will point to the user's Google Drive file (WebViewLink).

## Pros & Cons

### Pros
- **Zero Storage Cost**: Files are stored in the user's 15GB free space.
- **Privacy**: User retains ownership of their files.
- **No File Size Limits (App-side)**: Google Drive handles large files easily.

### Cons
- **Permissions Complexity**: Users must agree to an extra permission popup.
- **Reliability**: If the user deletes the file from their Drive, the link in ESTT Community breaks.
- **Maintenance**: Handling OAuth tokens and potential expired sessions on the client side is more complex than a simple API key.
- **Visibility**: The user might accidentally keep the file "Private", making it invisible to other students/admins.

## Implementation Steps
1. **Update Firebase Config**: Ensure Google Sign-In is configured in the Google Cloud Console with the correct Authorized Redirect URIs.
2. **Modify `AuthContext.js`**: Add `.addScope()` to the provider and store the `accessToken`.
3. **Create `lib/drive-client.js`**: A helper using `fetch` or a lightweight library to handle the multipart upload and permission setting.
4. **Update Contribution Pages**: Update the logic to use the new client-side upload helper.
