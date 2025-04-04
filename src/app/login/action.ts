'use server'
import { cookies } from "next/headers";

export interface UserLoginResponse {
    firebase_id_token: string;
    system_admin: boolean;
    website_permissions: {
        [website: string]: {
            role: 'user' | 'admin';
            feedback: boolean;
            chat: boolean;
            knowledge_base: boolean;
            upload: boolean;
            whitelist: boolean;
            log_select: boolean;
            token_stats: boolean;
            graph: {
                view: boolean;
                read_only: boolean;
                publish: boolean;
            };
        };
    };
}

export const userLogin = async (idToken: string) => {
    const authCookie = await cookies();
    const cookie = authCookie.get('auth-token');
    const token = cookie?.value || idToken;

    try {

        const newuser = await fetch(process.env.API_LORE + '/user/is_new_user', {
            method: 'POST',
            headers: {
                'client-id': `${process.env.CLIENT_ID}`,
                'firebase-id-token': token!,
            },

        });
        if (!newuser.ok) {
            throw new Error("You don't have permission to access this website");
        }
        const isNewUser = await newuser.json();
        //  console.log('isNewUser', isNewUser);
        if (isNewUser)
            return { status: true, message: null, isNewUser };


        const response = await fetch(process.env.API_LORE + '/auth/user_authentication', {
            method: 'POST',
            headers: {

                'firebase-id-token': token!,
            },

        });

        const responseData: UserLoginResponse | any = await response.json();

        //  console.log('Response ', responseData);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {

                throw new Error(responseData.detail || "Authentication failed");
            }
            throw new Error(`Backend authentication failed: ${response.status}`);
        }

        if (responseData.system_admin)
            return { status: true, message: null, isNewUser };

        // First check if 'episcopal-foresight-coach' exists in website_permissions
        if (!responseData.website_permissions?.['episcopal-foresight-coach']) {
            throw new Error("You don't have permission to access this website");
        }

        // Then check if chat permission is granted
        if (!responseData.website_permissions['episcopal-foresight-coach'].chat) {
            throw new Error("You don't have chat permission for this website");
        }

        return { status: true, message: null, isNewUser }
    } catch (e: any) {
        //   console.log('Error ', e);

        return { status: false, message: e.message || "Authentication failed" };
    }
}
