'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification
} from 'firebase/auth';
import { auth, db, ref, onValue } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                // Fetch profile data from Realtime Database
                const profileRef = ref(db, `users/${user.uid}`);
                unsubscribeProfile = onValue(profileRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setProfile(snapshot.val());
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching profile:", error);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setProfile(null);
                if (unsubscribeProfile) unsubscribeProfile();
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const signIn = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const signOut = () => {
        return firebaseSignOut(auth);
    };

    const sendVerification = (user) => {
        return sendEmailVerification(user);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, sendVerification }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
