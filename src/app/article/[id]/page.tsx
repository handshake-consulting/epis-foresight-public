import AutoLoginProvider from "@/components/AutoLoginProvider";
import { getArticle, getArticleNavigation, preload } from "@/data/getArticle";
import { getSessionsList } from "@/data/Sessions";
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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

// export const dynamic = "force-dynamic";

// Dynamic metadata
// export async function generateMetadata({
//     params,
// }: {
//     params: Params
// }) {

//     const { id } = (await params);
//     const cookieslist = await cookies()
//     const uidcook = cookieslist.get('auth-uid')
//     const supabase = await createClient();


//     //   const finalTitle = exists ? initialTitle : await changeTitle({ title: initialTitle });
//     const { data: specificSession, error: specificError } = await supabase
//         .from("chat_sessions")
//         .select("*")
//         .eq("id", id)
//         .eq("user_id", uidcook?.value)
//         .single();

//     if (specificError) {
//         console.error("Error fetching session for metadata:", specificError);
//         return {
//             title: "Article",
//         };
//     }

//     return {
//         title: specificSession?.title || "Article",
//     };
// }



const page = async ({ params }: { params: Params }) => {

    const cookieList = await cookies();
    const token = cookieList.get('auth-token');
    if (!token) notFound();

    const { valid, uid } = await verifyFirebaseToken(token.value);
    if (!valid) notFound();
    const { id } = (await params);
    const session = await getSessionsList(token.value || '')
    console.log('session', session);
    const article = await getArticle(id, '')
    const articlenav = await getArticleNavigation(id)
    console.log('article', article);
    console.log('article nav', articlenav);
    preload(articlenav.nextId || '', '')

    // const sessionlist = await getSessionsList({ page: 1, pageSize: 10 })



    return (
        <AutoLoginProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <EbookArticlePage articlenav={articlenav} initialSessionId={id} initialSession={session} initialArticle={article} />
            </Suspense>

        </AutoLoginProvider>
    );
};

export default page;
