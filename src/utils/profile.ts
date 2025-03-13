import { cookies } from "next/headers";
import { notFound } from "next/navigation";
export interface UserProfile {

    email: string
    display_name: string;
    photo_url: string;
    email_verified: boolean
    new_user: boolean

}
export async function getProfile() {

    const cookieList = await cookies();
    const cook = cookieList.get('auth-token');
    const token = cook?.value;
    // console.log('Token', token);

    if (!token) notFound()
    const res = await fetch(process.env.API_LORE + `/user/profile`, {
        headers: {
            'client-id': `${process.env.CLIENT_ID}`,
            'firebase-id-token': `${token}`
        }
    })
    const profile: UserProfile = await res.json()
    if (!profile) notFound()
    return profile
}