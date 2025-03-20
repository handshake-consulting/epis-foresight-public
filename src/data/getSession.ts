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

    // Query chat_messages table for all messages with images
    const { data: messages, error, count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact' })
        .eq('user_id', uid)
        .not('image', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, to);
    return messages
}