"use client"

import { userLogin } from "@/app/login/action";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";

interface AutoLoginProviderProps {
    children: React.ReactNode;
}

export default function AutoLoginProvider({ children }: AutoLoginProviderProps) {
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                const auth = getAuth();
                const email = "denis@gmail.com";
                const password = "denis@gmail.com"; // Use a secure password

                try {
                    // Try to sign in first
                    const result = await signInWithEmailAndPassword(auth, email, password);
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="ml-3 text-lg">Logging in...</p>
            </div>
        );
    }

    return <>{children}</>;
}
