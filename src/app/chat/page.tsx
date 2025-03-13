import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { getProfile } from "@/utils/profile";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChatPage from "./chatPage";

const page = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    const profile = await getProfile();
    if (!token) {
        redirect("/login");
    }

    const { valid } = await verifyFirebaseToken(token.value);
    if (!valid) {
        redirect("/login");
    }

    return (
        <div>
            <ChatPage profile={profile} />
        </div>
    );
};

export default page;
