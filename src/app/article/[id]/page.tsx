import AutoLoginProvider from "@/components/AutoLoginProvider";
import { getArticleById } from "@/data/getArticle";
import { getSessionsList } from "@/data/getSession";
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

    const { id } = (await params);
    const cookieslist = await cookies()
    const uidcook = cookieslist.get('auth-uid')
    const supabase = await createClient();


    //   const finalTitle = exists ? initialTitle : await changeTitle({ title: initialTitle });
    const { data: specificSession, error: specificError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", id)
        .eq("user_id", uidcook?.value)
        .single();

    if (specificError) {
        console.error("Error fetching session for metadata:", specificError);
        return {
            title: "Article",
        };
    }

    return {
        title: specificSession?.title || "Article",
    };
}



const page = async ({ params }: { params: Params }) => {
    const { id } = (await params);
    const sessionlist = await getSessionsList({ fetchAll: true });
    const articleData = await getArticleById(id);

    // Default profile to use if we can't get a real one
    const defaultProfile: UserProfile = {
        email: "ekemboy@gmail.com",
        display_name: "Guest User",
        photo_url: "",
        email_verified: true,
        new_user: false
    };

    return (
        <AutoLoginProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <EbookArticlePage
                    initialSessionId={id}
                    sessionList={sessionlist}
                    articleData={articleData}
                />
            </Suspense>
        </AutoLoginProvider>
    );
};

export default page;
