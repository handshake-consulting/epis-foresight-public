"use client"

import { updateProfile } from "@/app/profile/action"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Check, User } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

interface UpdateProfileFormProps {
    initialDisplayName?: string
    initialPhotoUrl?: string
    email?: string
}

export default function UpdateProfileForm({ initialDisplayName = '', initialPhotoUrl = '', email = '' }: UpdateProfileFormProps) {
    const [displayName, setDisplayName] = useState(initialDisplayName)
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl || null)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file type
        if (!file.type.startsWith('image/')) {
            setMessage({ text: "Please select an image file", type: 'error' })
            return
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ text: "Image size should be less than 5MB", type: 'error' })
            return
        }

        setPhotoFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setPhotoPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Reset message
        setMessage(null)

        // Validate display name
        if (!displayName.trim()) {
            setMessage({ text: "Display name is required", type: 'error' })
            return
        }

        try {
            setLoading(true)

            const result = await updateProfile(displayName, photoFile || undefined)

            if (result.success) {
                setMessage({ text: result.message, type: 'success' })
                router.refresh()
            } else {
                setMessage({ text: result.message, type: 'error' })
            }
        } catch (error) {
            console.error("Error updating profile:", error)
            setMessage({ text: "An unexpected error occurred", type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-border/40 shadow-lg w-full overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/10 bg-muted/10">
                <CardTitle className="text-xl flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    Personal Information
                </CardTitle>
                <CardDescription>
                    Update your profile details and public information
                </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
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

                    {/* Profile Photo */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted/30 border-2 border-border/30 shadow-md transition-all duration-300 group-hover:border-primary/50">
                                {photoPreview ? (
                                    <Image
                                        src={photoPreview}
                                        alt="Profile Preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg border-2 border-background hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                            >
                                <Camera size={16} />
                            </button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/*"
                            className="hidden"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-4 pt-2">
                        {/* Email (read-only) */}
                        {email && (
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="w-full px-3 py-2.5 border border-border/50 rounded-md bg-muted/20 text-muted-foreground"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">Read only</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Display Name */}
                        <div className="space-y-2">
                            <label htmlFor="display-name" className="text-sm font-medium flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Display Name
                            </label>
                            <input
                                id="display-name"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                                placeholder="Your display name"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 mt-6 disabled:opacity-50 transition-all duration-200"
                    >
                        {loading ? (
                            <span className="animate-spin h-5 w-5 border-2 rounded-full border-white" />
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="text-center text-sm text-muted-foreground border-t border-border/10 bg-muted/5 py-4">
                <p>Your profile information will be visible to other users in chat sessions</p>
            </CardFooter>
        </Card>
    )
}
