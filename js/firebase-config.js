// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, set, connectDatabaseEmulator, goOffline, goOnline } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCFP_7A46Hv23vO7UsQuxWQ9i65UTCP4i8",
    authDomain: "testest-cbe30.firebaseapp.com",
    projectId: "testest-cbe30",
    storageBucket: "testest-cbe30.firebasestorage.app",
    messagingSenderId: "474527168378",
    appId: "1:474527168378:web:371fe9a307c0b6da8d08c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Configure Firebase connection with better error handling and connection stability
// Use modular goOffline/goOnline functions (not methods) to control connection
try {
    goOffline(db); // Start offline to prevent immediate connection
    setTimeout(() => {
        goOnline(db); // Go online after a brief delay
    }, 100);
} catch (e) {
    // If these functions are unavailable or fail, log and continue
    console.warn('Could not toggle Firebase connection state:', e);
}

export { db, ref, get, push, set };
