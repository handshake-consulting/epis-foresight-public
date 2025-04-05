import AutoLoginProvider from "@/components/AutoLoginProvider";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import EbookArticlePage from "../EbookArticlePage";

// Define the UserProfile interface locally to avoid import issues
interface UserProfile {
    email: string;
    display_name: string;
    photo_url: string;
    email_verified: boolean;
    new_user: boolean;
}

type Params = Promise<{ id: string }>

export const dynamic = "force-dynamic";

// Dynamic metadata
export async function generateMetadata({
    params,
}: {
    params: Params
}) {
    try {
        const { id } = (await params);
        // Skip database query during build time to avoid errors
        if (process.env.NEXT_PHASE === 'phase-production-build') {
            return {
                title: "Article",
            };
        }

        const cookieslist = await cookies();
        const uidcook = cookieslist.get('auth-uid');

        // If no user ID cookie, return default metadata
        if (!uidcook?.value) {
            return {
                title: "Article",
            };
        }

        const supabase = await createClient();

        // Query with error handling
        try {
            const { data: specificSession, error: specificError } = await supabase
                .from("chat_sessions")
                .select("*")
                .eq("id", id)
                .eq("user_id", uidcook.value)
                .single();

            if (specificError || !specificSession) {
                return {
                    title: "Article",
                };
            }

            return {
                title: specificSession.title || "Article",
            };
        } catch (dbError) {
            console.error("Database error fetching session for metadata:", dbError);
            return {
                title: "Article",
            };
        }
    } catch (error) {
        console.error("Error in generateMetadata:", error);
        return {
            title: "Article",
        };
    }
}



const page = async ({ params }: { params: Params }) => {
    const { id } = (await params);
    // const sessionlist = await getSessionsList({ page: 1, pageSize: 10 })
    // Default profile to use if we can't get a real one
    const defaultProfile: UserProfile = {
        email: "ekemboy@gmail.com",
        display_name: "Guest User",
        photo_url: "",
        email_verified: true,
        new_user: false
    };
    // console.log('Session lIST', sessionlist);


    return (
        <AutoLoginProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <EbookArticlePage initialSessionId={id} />
            </Suspense>

        </AutoLoginProvider>
    );
};

export default page;
