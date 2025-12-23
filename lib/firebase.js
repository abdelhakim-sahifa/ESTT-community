// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, push, set, update, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

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

