import AutoLoginProvider from "@/components/AutoLoginProvider";
import { getSessionsList } from "@/data/Sessions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EbookArticlePage from "./EbookArticlePage";

// Define the UserProfile interface locally to avoid import issues
interface UserProfile {
    email: string;
    display_name: string;
    photo_url: string;
    email_verified: boolean;
    new_user: boolean;
}

const page = async (
    {
        searchParams
    }: {
        searchParams: Promise<{ new: string }>
    }
) => {
    const filters = (await searchParams).new
    const headList = await headers()
    const origin = headList.get("origin") ?? headList.get("host");
    console.log(origin);
    // console.log('filters', filters);
    const session = await getSessionsList(origin)
    // if (!filters || filters === 'false') {
    //     // console.log('wooow', filters);
    //     redirect("/article?new=true")
    // }
    if (session.length > 0) {
        redirect('/article/' + session[0].id)
    }

    return (
        <AutoLoginProvider>
            <EbookArticlePage articlenav={{} as any} initialSessionId={''} initialSession={session} initialArticle={{} as any} />
        </AutoLoginProvider>
    );
};

export default page;
