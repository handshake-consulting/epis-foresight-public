'use server'
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const getSessionsList = async ({ page = 1, pageSize = 10 }: { page: number, pageSize: number }) => {
    const cookeList = await cookies()
    const token = cookeList.get('auth-token')
    if (!token)
        notFound()
    const { valid, uid } = await verifyFirebaseToken(token.value);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Create Supabase client
    const supabase = await createClient();

    // Query chat_sessions table for article sessions
    const { data: sessions, error, count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', uid)
        .eq('type', 'article')
        .order('updated_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching sessions:", error);
        return [];
    }

    return sessions;
}
