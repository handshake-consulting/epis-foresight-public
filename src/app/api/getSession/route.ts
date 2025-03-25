import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
) {


    const supabase = await createClient();

    // Your data fetching logic here
    // Query for all sessions or paginated sessions based on fetchAll flag
    let query = supabase
        .from('chat_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', 'xA8vPolZwRfjjIBxirQDeR8BAPr1')
        .eq('type', 'article')
        .order('updated_at', { ascending: false });

    const { data: sessions, error } = await query;
    // Return with cache headers
    return NextResponse.json(sessions);
}