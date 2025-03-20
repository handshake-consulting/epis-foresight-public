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

const page = async () => {


    return (
        <AutoLoginProvider>
            <EbookArticlePage />
        </AutoLoginProvider>
    );
};

export default page;
