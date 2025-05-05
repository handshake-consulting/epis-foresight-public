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
        // First check for new user
        const newUserResponse = await fetch(process.env.API_LORE + '/user/is_new_user', {
            method: 'POST',
            headers: {
                'client-id': `${process.env.CLIENT_ID}`,
                'firebase-id-token': token!,
            },
        });

        if (!newUserResponse.ok) {
            const contentType = newUserResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await newUserResponse.json();
                throw new Error(errorData.detail || `Error checking new user: ${newUserResponse.status}`);
            } else {
                throw new Error(`Error checking new user: ${newUserResponse.status}`);
            }
        }

        // Parse response body safely (may be JSON or plain text)
        const newUserBody = await newUserResponse.text();
        let isNewUser: boolean = false;
        try {
            // Attempt to parse JSON first (response might be "true" or "false" as JSON booleans/strings)
            const parsed = JSON.parse(newUserBody);
            // If parsed is an object, assume API schema changed – treat as not new user
            if (typeof parsed === 'boolean') {
                isNewUser = parsed;
            }
        } catch {
            // Fallback: treat plain text "true" / "false" (case-insensitive) as boolean
            const trimmed = newUserBody.trim().toLowerCase();
            if (trimmed === 'true') isNewUser = true;
            else if (trimmed === 'false' || trimmed === '') isNewUser = false;
        }

        if (isNewUser) {
            return { status: true, message: null, isNewUser };
        }

        // Authenticate existing user
        const authResponse = await fetch(process.env.API_LORE + '/auth/user_authentication', {
            method: 'POST',
            headers: {
                'firebase-id-token': token!,
            },
        });

        if (!authResponse.ok) {
            const contentType = authResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await authResponse.json();
                throw new Error(errorData.detail || `Authentication failed: ${authResponse.status}`);
            } else {
                throw new Error(`Authentication failed: ${authResponse.status}`);
            }
        }

        // Parse JSON only if response is OK and content-type is application/json
        let responseData: UserLoginResponse;
        try {
            responseData = await authResponse.json();
        } catch (parseError) {
            console.error('Error parsing authentication response:', parseError);
            throw new Error('Invalid response format from authentication server');
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
        console.error('Authentication error:', e);
        return { status: false, message: e.message || "Authentication failed" };
    }
}
