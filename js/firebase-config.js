// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fixed Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCFP_7A46Hv23vO7UsQuxWQ9i65UTCP4i8",
    authDomain: "testest-cbe30.firebaseapp.com",
    databaseURL: "https://testest-cbe30-default-rtdb.firebaseio.com",
    projectId: "testest-cbe30",
    storageBucket: "testest-cbe30.appspot.com",
    messagingSenderId: "474527168378",
    appId: "1:474527168378:web:371fe9a307c0b6da8d08c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db, ref, get, push, set, update };
