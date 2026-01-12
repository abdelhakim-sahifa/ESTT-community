# Deep Link Implementation Plan for Next.js

This guide explains how to handle the deep links referenced in your mobile app (`https://estt-community.vercel.app/deeplink/...`) within your separate Next.js web project.

## Goal
Redirect users who visit `https://estt-community.vercel.app/deeplink/...` to your mobile app (`esttplus://...`) if they are on a mobile device, or show a relevant landing page if they are on desktop.

## URL Structure Support
We need to handle the following web routes and map them to App URIs:

| Content Type | Web URL | App URI |
| :--- | :--- | :--- |
| **Club** | `/deeplink/club/[id]` | `esttplus://club/[id]` |
| **Event** | `/deeplink/event/[clubId]/[eventId]` | `esttplus://event/[clubId]/[eventId]` |
| **Post** | `/deeplink/post/[id]?clubId=...` | `esttplus://post/[id]?clubId=...` |
| **Resource** | `/deeplink/resource/[id]` | `esttplus://resource/[id]` |

## Implementation Steps (Next.js App Router)

### 1. Create a Dynamic Route
Create a new file at `app/deeplink/[...slug]/page.tsx` to catch all sub-paths under `/deeplink`.

```tsx
// app/deeplink/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function DeepLinkPage({ params }: { params: { slug: string[] } }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Checking device...');

  useEffect(() => {
    // 1. Construct the App URI
    // The pathname starts with /deeplink, so we strip that to get the rest
    // e.g., /deeplink/club/123 -> club/123
    const pathParts = pathname.replace(/^\/deeplink\//, '');
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    const appUri = `esttplus://${pathParts}${queryString}`;
    
    // 2. Platform Detection
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    // 3. Redirection Logic
    if (isAndroid || isIOS) {
      setStatus('Opening App...');
    
    } else {
      setStatus('Redirecting to web version...');
      // Optional: Redirect to the normal web page for this content
      // router.push(`/web/${pathParts}`); 
    }

  }, [pathname, searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'sans-serif' 
    }}>
      <img src="/icon.png" alt="App Icon" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 20 }} />
      <h2>Opening ESTT Community...</h2>
      <p style={{ color: '#666' }}>{status}</p>
      
      <div style={{ marginTop: 40 }}>
        <a href="https://estt-community.vercel.app" style={{ color: '#1967d2', textDecoration: 'none' }}>
          Back to Home
        </a>
      </div>
    </div>
  );
}
```

### 2. Middleware (Optional)
If you need server-side redirection or handling (e.g., for better SEO meta tags before redirecting), you can use `middleware.ts`, but a client-side component is usually sufficient for deep link redirection logic.

### 3. Testing
Deploy your Next.js app and try visiting `https://estt-community.vercel.app/deeplink/club/123` on your phone. It should attempt to open your app.

## Android App Links (Advanced)
To make links open *immediately* without the browser intermediate page (the "Open with..." dialog), you need to set up **App Links** (Android) and **Universal Links** (iOS).

1.  **Host `assetlinks.json`**:
    Place a file at `https://estt-community.vercel.app/.well-known/assetlinks.json`.
    ```json
    [{
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.estt.community",
        "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
      }
    }]
    ```

2.  **App Configuration**:
    In your Expo project [app.json](file:///c:/Users/abdelhakim%20sahifa/Desktop/esttplus/app.json):
    ```json
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "estt-community.vercel.app",
              "pathPrefix": "/deeplink"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
    ```
    *Note: This requires a new native build (`npx expo run:android` or EAS Build).*
