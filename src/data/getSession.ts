'use server'
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const getSessionsList = async ({ page = 1, pageSize = 10, fetchAll = false }: { page?: number, pageSize?: number, fetchAll?: boolean }) => {
    const cookeList = await cookies()
    const token = cookeList.get('auth-token')
    if (!token)
        notFound()
    const { valid, uid } = await verifyFirebaseToken(token.value);

    // Create Supabase client
    const supabase = await createClient();

    // Query for all sessions or paginated sessions based on fetchAll flag
    let query = supabase
        .from('chat_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', uid)
        .eq('type', 'article')
        .order('updated_at', { ascending: false });

    // Apply pagination only if not fetching all
    if (!fetchAll) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
    }

    const { data: sessions, error } = await query;

    if (error) {
        console.error("Error fetching sessions:", error);
        return [];
    }

    return sessions;
}
