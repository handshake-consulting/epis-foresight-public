import { redirect } from "next/navigation";



// Define the UserProfile interface locally to avoid import issues
interface UserProfile {
    email: string;
    display_name: string;
    photo_url: string;
    email_verified: boolean;
    new_user: boolean;
}

const page = async () => {
    // Default profile to use if we can't get a real one

    return redirect("/article")
};

export default page;
