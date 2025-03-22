'use server'
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const getArticle = async ({ page = 1, pageSize = 10 }: { page: number, pageSize: number }) => {
    // This function is kept for backward compatibility
}

export const getArticleById = async (articleId: string) => {
    const cookieList = await cookies();
    const token = cookieList.get('auth-token');
    const uidCookie = cookieList.get('auth-uid');

    if (!token || !uidCookie) {
        notFound();
    }

    const { valid, uid } = await verifyFirebaseToken(token.value);

    if (!valid || uid !== uidCookie.value) {
        notFound();
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get session details
    const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', articleId)
        .eq('user_id', uid)
        .single();

    if (sessionError || !session) {
        console.error("Error fetching article session:", sessionError);
        return null;
    }

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', articleId)
        .order('created_at', { ascending: true });

    if (messagesError) {
        console.error("Error fetching article messages:", messagesError);
        return null;
    }

    return {
        session,
        messages
    };
}
