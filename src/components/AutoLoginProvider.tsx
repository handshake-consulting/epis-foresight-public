"use client"

import { userLogin } from "@/app/login/action";
import { userAuth } from "@/utils/firebase/client";
import { createClient } from "@/utils/supabase/clients";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { saveToken } from "./action";

interface AutoLoginProviderProps {
    children: React.ReactNode;
}

export default function AutoLoginProvider({ children }: AutoLoginProviderProps) {
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const autoLogin = async () => {
            try {
                // Check if we already have a token
                const hasCookie = document.cookie.includes('auth-token=');
                if (hasCookie) {
                    // We already have a token, no need to authenticate again
                    setIsAuthenticating(false);
                    return;
                }

                // Perform automatic login with predefined credentials
                const auth = userAuth;
                const email = "denis@gmail.com";
                const password = "denis@gmail.com1"; // Use a secure password

                try {
                    // Try to sign in first
                    const result = await signInWithEmailAndPassword(auth, email, password);
                    const user = result.user;

                    // Get the ID token
                    const idToken = await user.getIdToken();

                    await saveToken(idToken)
                    // Store the token in a cookie
                    document.cookie = `auth-token=${idToken}; path=/; max-age=3600; secure; samesite=strict`;
                    document.cookie = `auth-uid=${user.uid}; path=/; max-age=3600; secure; samesite=strict`;

                    // Call the userLogin server action to complete the login process
                    const { status, message } = await userLogin(idToken);
                    if (!status) {
                        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                        throw new Error(message || "Authentication failed");
                    }
                    // Store/update user data in Supabase
                    await upsertUserInSupabase(user);
                    console.log("Auto login successful");
                } catch (signInError: any) {
                    // If sign in fails, try to create the user
                    if (signInError.code === 'auth/user-not-found') {
                        try {
                            console.log("User not found, creating new user");
                            // Create a new user
                            const result = await createUserWithEmailAndPassword(auth, email, password);
                            const user = result.user;

                            // Get the ID token
                            const idToken = await user.getIdToken();

                            // Store the token in a cookie
                            document.cookie = `auth-token=${idToken}; path=/; max-age=3600; secure; samesite=strict`;

                            // Call the userLogin server action to complete the login process
                            const { status, message } = await userLogin(idToken);
                            if (!status) {
                                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                                throw new Error(message || "Authentication failed");
                            }

                            console.log("User created and auto login successful");
                        } catch (createError: any) {
                            console.error("Error creating user:", createError);
                            throw createError;
                        }
                    } else {
                        // If it's not a user-not-found error, rethrow
                        console.error("Error signing in:", signInError);
                        throw signInError;
                    }
                }
            } catch (error: any) {
                console.error("Auto login error:", error);
                setError(error.message || "Auto login failed");
                // We continue anyway since we want users to access the chat
            } finally {
                setIsAuthenticating(false);
            }
        };

        autoLogin();
    }, []);

    // Only render children after authentication is complete
    if (isAuthenticating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0e6d2]">
                <div className="bg-white p-8 rounded-lg shadow-xl border border-[#e8e1d1] flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 relative">
                        {/* Book icon */}
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#8a7e66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="#8a7e66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>

                        {/* Spinner overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin h-12 w-12 border-4 border-[#8a7e66] border-t-transparent rounded-full opacity-70"></div>
                        </div>
                    </div>
                    <p className="font-serif text-[#5d5545] text-lg">Opening your library...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
