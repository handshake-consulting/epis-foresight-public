"use client"

import { changePassword } from "@/app/profile/action"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthCheck } from "@/hook/use-auth-check"
import { Check, KeyRound, LogIn, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function UpdatePasswordForm() {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
    const [passwordChanged, setPasswordChanged] = useState(false)
    const router = useRouter()
    useAuthCheck({ refreshInterval: 120000 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Reset message
        setMessage(null)

        // Validate passwords
        if (newPassword.length < 6) {
            setMessage({ text: "Password must be at least 6 characters long", type: 'error' })
            return
        }

        if (newPassword !== confirmPassword) {
            setMessage({ text: "Passwords do not match", type: 'error' })
            return
        }

        try {
            setLoading(true)

            const result = await changePassword(newPassword)

            if (result.success) {
                // Clear form
                setNewPassword("")
                setConfirmPassword("")
                setPasswordChanged(true)

                // Show success message with login instruction
                setMessage({
                    text: "Password changed successfully. Please log in again with your new password.",
                    type: 'success'
                })

                // Clear the auth cookie since it's now invalid
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            } else {
                setMessage({ text: result.message, type: 'error' })
            }

        } catch (error) {
            console.error("Error updating password:", error)
            setMessage({ text: "An unexpected error occurred", type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-border/40 shadow-lg w-full overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/10 bg-muted/10">
                <CardTitle className="text-xl flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary" />
                    Security Settings
                </CardTitle>
                <CardDescription>
                    Update your password to keep your account secure
                </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
                {passwordChanged ? (
                    <div className="space-y-6">
                        <div className="p-4 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg dark:text-green-200 dark:bg-green-900/20 dark:border-green-800/30">
                            <div className="flex items-center">
                                <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                                Password changed successfully. You need to log in again with your new password.
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <Link href="/login">
                                <Button className="py-5 px-8 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                                    <LogIn size={16} />
                                    Go to Login Page
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message && (
                            <div className={`p-4 text-sm rounded-lg border animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                                ? 'text-green-800 bg-green-100 border-green-200 dark:text-green-200 dark:bg-green-900/20 dark:border-green-800/30'
                                : 'text-destructive bg-destructive/10 border-destructive/20'
                                }`}>
                                <div className="flex items-center">
                                    {message.type === 'success' ? (
                                        <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                                    ) : (
                                        <svg className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    )}
                                    {message.text}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <label htmlFor="new-password" className="text-sm font-medium flex items-center gap-1.5">
                                    <KeyRound size={14} className="text-muted-foreground" />
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full px-3 py-2.5 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Must be at least 6 characters long
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-muted-foreground" />
                                    Confirm Password
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 mt-4 disabled:opacity-50 transition-all duration-200"
                            >
                                {loading ? (
                                    <span className="animate-spin h-5 w-5 border-2 rounded-full border-white" />
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>

            <CardFooter className="text-center text-sm text-muted-foreground border-t border-border/10 bg-muted/5 py-4">
                <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} className="text-muted-foreground" />
                    <p>{`Use a strong, unique password that you don't use elsewhere`}</p>
                </div>
            </CardFooter>
        </Card>
    )
}
