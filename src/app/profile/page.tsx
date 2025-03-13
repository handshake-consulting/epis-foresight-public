import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import UpdatePasswordForm from "@/components/update-password-form";
import UpdateProfileForm from "@/components/update-profile-form";
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { getProfile } from "@/utils/profile";
import { ArrowLeft, MessageSquare, User2 } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const ProfilePage = async () => {
    const profile = await getProfile();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
        redirect("/login");
    }

    const { valid } = await verifyFirebaseToken(token.value);
    if (!valid) {
        redirect("/login");
    }
    console.log('Profile', profile);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
            {/* Header with navigation */}
            <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/40">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={18} />
                        <span>Back to Chat</span>
                    </Link>
                    <Link href="/chat">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <MessageSquare size={16} />
                            <span className="hidden sm:inline">Go to Chat</span>
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="relative mb-12 pb-6 text-center">
                    <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Manage your personal information and account security
                    </p>
                    <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>

                {/* New User Alert */}
                {profile.new_user ? (
                    <Alert className="mb-8 max-w-2xl mx-auto border border-destructive/30 bg-destructive/5" variant="destructive">

                        <User2 className="h-5 w-5" />
                        <AlertDescription className="font-medium">
                            Please update your password for security as a first time user
                        </AlertDescription>

                    </Alert>
                ) : null}

                {/* Profile Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
                    <div className="space-y-8 flex flex-col">
                        {/* Profile Update Form */}
                        <UpdateProfileForm
                            initialDisplayName={profile.display_name || ''}
                            initialPhotoUrl={profile.photo_url || ''}
                            email={profile.email}
                        />
                    </div>

                    <div className="space-y-8 flex flex-col">
                        {/* Password Update Form */}
                        <UpdatePasswordForm />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-auto py-6 text-center text-sm text-muted-foreground border-t border-border/20">
                <div className="container mx-auto px-4">
                    <p>© {new Date().getFullYear()} Foresight ESP. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default ProfilePage;
