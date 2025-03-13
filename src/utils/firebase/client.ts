import { createClient } from '@/utils/supabase/clients';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBtZ-R5Kdy_v7GrwioCXFh9atoksa_leik",
    authDomain: "projectlore.firebaseapp.com",
    projectId: "projectlore",
    storageBucket: "projectlore.appspot.com",
    messagingSenderId: "778776159944",
    appId: "1:778776159944:web:890a124daff1971e92e7fd",
    measurementId: "G-MN1H3R08WQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Function to get the current user's ID token
export const getIdToken = async (): Promise<string | null> => {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        return await user.getIdToken(true); // Force refresh the token
    } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
    }
};

// Function to get the current auth state and token
export const getCurrentAuthState = async () => {
    return new Promise<{ user: User | null; token: string | null }>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (!user) {
                resolve({ user: null, token: null });
                return;
            }
            const token = await user.getIdToken();
            resolve({ user, token });
        });
    });
};

const upsertUserInSupabase = async (user: User) => {
    try {
        const supabase = createClient();
        const { error } = await supabase
            .from('users')
            .upsert(
                {
                    firebase_uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    last_login: new Date().toISOString(),
                },
                { onConflict: 'firebase_uid' }
            );

        if (error) {
            console.error('Error upserting user in Supabase:', error);
        }
    } catch (error) {
        console.error('Error in upsertUserInSupabase:', error);
    }
};

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        // Get the ID token
        const idToken = await user.getIdToken();

        // Store the token in a cookie
        document.cookie = `auth-token=${idToken}; path=/; max-age=3600; secure; samesite=strict`;

        // Store/update user data in Supabase
        await upsertUserInSupabase(user);

        return { user, error: null, idToken };
    } catch (error) {
        console.error('Error signing in with Google:', error);
        return { user: null, error };
    }
};

export const signOutUser = async () => {
    try {
        await signOut(auth);
        // Clear the auth cookie
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        return { error: null };
    } catch (error) {
        console.error('Error signing out:', error);
        return { error };
    }
};

export const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

export { auth };
