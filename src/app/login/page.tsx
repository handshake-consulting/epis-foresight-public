import LoginForm from "@/components/login-form";
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (token) {
        const { valid } = await verifyFirebaseToken(token.value);
        if (valid) {
            redirect("/chat");
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left column - Visual elements and information */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto">
                    {/* Logo/Brand */}
                    <div className="mb-8 flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">E</div>
                        <h2 className="ml-3 text-2xl font-bold">ForesightCoach by IFTF for EDOT</h2>
                    </div>

                    {/* Illustration */}
                    <div className="mb-12 py-6">
                        <div className="aspect-video bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                            <img
                                src="https://miro.medium.com/v2/resize:fit:1300/1*lLsyrkVBXIpKfJr26zLjgA.png"
                                alt="IFTF Foresight Coach"
                                className="max-w-full h-auto"
                            />
                        </div>
                    </div>

                    {/* Feature highlights */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold mb-4">About ForesightCoach</h3>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-base font-medium">Grounded in Custom Research on Faith in the Future</h4>
                                <p className="mt-1 text-sm text-muted-foreground">This system contains reports from IFTF and McKinsey prepared for EDOT, along with books by Bob Johansen on foresight and the future.</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-base font-medium">Expanding Ideas</h4>
                                <p className="mt-1 text-sm text-muted-foreground">This is not a question-and-answer system. It is a system for expanding ideas through dynamic conversation.</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-base font-medium">Personal History</h4>
                                <p className="mt-1 text-sm text-muted-foreground">Store conversations for future reference.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right column - Login form */}
            <div className="md:w-1/2 p-8 md:p-12 flex items-center justify-center">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Welcome</h1>
                        <p className="mt-3 text-muted-foreground">Sign in to access ForesightCoach</p>
                    </div>

                    <LoginForm />

                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        {/* <p>By signing in, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.</p> */}
                        <p className="mt-4">Need help? <a href="mailto:jeremy@handshake.fyi?cc=lev@handshake.fyi,mendie@handshake.fyi" className="text-primary hover:underline">Contact Support</a></p>
                    </div>
                </div>
            </div>
        </div>
    )
}
