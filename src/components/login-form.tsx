"use client"

import { userLogin } from "@/app/login/action"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signInWithGoogle } from "@/utils/firebase/client"
import { createClient } from "@/utils/supabase/clients"
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, User } from "firebase/auth"
import { useEffect, useState } from "react"

export default function LoginForm() {
    // Function to store/update user data in Supabase
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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [animateIn, setAnimateIn] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isEmailLogin, setIsEmailLogin] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)

    useEffect(() => {
        // Trigger animation after component mounts
        const timer = setTimeout(() => {
            setAnimateIn(true)
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true)
            setError(null)

            const { error, idToken } = await signInWithGoogle()
            if (error) {
                throw error
            }

            const { status, message } = await userLogin(idToken!)
            if (!status) {
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
                setError(message)
                return
            }

            // Redirect will happen automatically through Firebase Auth
            window.location.href = '/chat'
        } catch (error) {
            console.error("Error signing in with Google:", error)
            setError("An error occurred during sign in. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleEmailPasswordAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            setError(null)

            const auth = getAuth()
            let user;

            if (isRegistering) {
                //   console.log('here');

                // Register new user
                const result = await createUserWithEmailAndPassword(auth, email, password)
                user = result.user
            } else {
                //   console.log('there');

                // Sign in existing user
                const result = await signInWithEmailAndPassword(auth, email, password)
                user = result.user
            }

            // Get the ID token
            const idToken = await user.getIdToken()

            // Store the token in a cookie
            document.cookie = `auth-token=${idToken}; path=/; max-age=3600; secure; samesite=strict`

            const { status, message, isNewUser } = await userLogin(idToken)
            if (!status) {
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
                setError(message)
                return
            }

            // Store/update user data in Supabase
            await upsertUserInSupabase(user)

            // Redirect after successful authentication
            window.location.href = isNewUser ? '/profile' : '/chat'
        } catch (error: any) {
            console.error("Error with email/password auth:", error)

            // Handle specific Firebase auth errors
            if (error.code === 'auth/email-already-in-use') {
                setError("This email is already in use. Try signing in instead.")
            } else if (error.code === 'auth/invalid-email') {
                setError("Invalid email address.")
            } else if (error.code === 'auth/weak-password') {
                setError("Password is too weak. It should be at least 6 characters.")
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setError("Invalid email or password.")
            } else {
                setError("An error occurred during authentication. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    const toggleAuthMethod = () => {
        setIsEmailLogin(!isEmailLogin)
        setError(null)
    }

    return (
        <div className={`transition-all duration-500 ease-out transform ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Card className="border-border/40 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-center">ForesightCoach for EDOT Login</CardTitle>
                    <CardDescription className="text-center">
                        Augemented strategic foresight for the future of faith
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {isEmailLogin ? (
                        <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="your@email.com"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}

                                className="w-full py-6 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-spin h-5 w-5 border-2   rounded-full border-white" />
                                ) : (
                                    isRegistering ? "Register" : "Sign In"
                                )}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsRegistering(!isRegistering)}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Register"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">Continue with</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-6 transition-all duration-200 hover:shadow-md"
                                variant="outline"
                            >
                                {loading ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                            <path d="M1 1h22v22H1z" fill="none" />
                                        </svg>
                                        Sign in with Google
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={toggleAuthMethod}
                            className="text-sm text-primary hover:underline"
                        >
                            {isEmailLogin ? "Use Google Sign In" : "Use Email & Password"}
                        </button>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <p>Secure login powered by Google Authentication</p>
                    <p>Augemented strategic foresight for the future of faith</p>
                </CardFooter>
            </Card>
        </div>
    )
}
