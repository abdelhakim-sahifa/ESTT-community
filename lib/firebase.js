// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, push, set, update, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if we have the minimum required configuration
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.databaseURL;

let app;
let db;
let auth;

// Only initialize Firebase on the client side and if the config is valid
// This prevents errors during Next.js build time when environment variables might be missing
if (typeof window !== 'undefined' && isConfigValid) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getDatabase(app);
    auth = getAuth(app);
}

export { app, db, auth, ref, get, push, set, update, onValue, remove };

