import AutoLoginProvider from "@/components/AutoLoginProvider";
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
    // console.log('filters', filters);

    // if (!filters || filters === 'false') {
    //     // console.log('wooow', filters);
    //     redirect("/article?new=true")
    // }

    return (
        <AutoLoginProvider>
            <EbookArticlePage />
        </AutoLoginProvider>
    );
};

export default page;
