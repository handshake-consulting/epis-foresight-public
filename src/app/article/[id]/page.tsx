import AutoLoginProvider from "@/components/AutoLoginProvider";
import { getProfile } from "@/utils/profile";
import { cookies } from "next/headers";
import ArticlePage from "../articlePage";

// Define the UserProfile interface locally to avoid import issues
interface UserProfile {
    email: string;
    display_name: string;
    photo_url: string;
    email_verified: boolean;
    new_user: boolean;
}

type Params = Promise<{ id: string }>

const page = async ({ params }: { params: Params }) => {
    const { id } = (await params);

    // Default profile to use if we can't get a real one
    const defaultProfile: UserProfile = {
        email: "ekemboy@gmail.com",
        display_name: "Guest User",
        photo_url: "",
        email_verified: true,
        new_user: false
    };

    // Try to get the profile with existing token
    let profile: UserProfile = defaultProfile;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (token) {
            try {
                const fetchedProfile = await getProfile();
                if (fetchedProfile) {
                    profile = fetchedProfile;
                }
            } catch (error) {
                console.error("Error getting profile:", error);
                // Continue with default profile
            }
        }
    } catch (error) {
        console.error("Error checking token:", error);
        // Continue with default profile
    }
    console.log("profile", profile);

    return (
        <AutoLoginProvider>
            <ArticlePage profile={profile} initialSessionId={id} />
        </AutoLoginProvider>
    );
};

export default page;
