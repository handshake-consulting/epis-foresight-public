"use client"

import { userLogin } from "@/app/login/action";
import { userAuth } from "@/utils/firebase/client";
import { createClient } from "@/utils/supabase/clients";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
import { useEffect, useState } from "react";
import BookLoadingAnimation from "./BookLoadingAnimation";

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
                    //  console.log("Auto login successful");
                } catch (signInError: any) {
                    // If sign in fails, try to create the user
                    if (signInError.code === 'auth/user-not-found') {
                        try {
                            //   console.log("User not found, creating new user");
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

                            //    console.log("User created and auto login successful");
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
        return <BookLoadingAnimation />;
    }

    return <>{children}</>;
}
