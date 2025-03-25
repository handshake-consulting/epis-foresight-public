import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
) {
    console.log("you are here", request.headers.get('cookie'));
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    if (!token) return NextResponse.json({ error: 'Unauthorized ti' }, { status: 401 });

    const { valid, uid } = await verifyFirebaseToken(token);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Your data fetching logic here
    // Query for all sessions or paginated sessions based on fetchAll flag
    let query = supabase
        .from('chat_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', uid)
        .eq('type', 'article')
        .order('updated_at', { ascending: false });

    const { data: sessions, error } = await query;
    // Return with cache headers
    return NextResponse.json(sessions, {
        headers: {
            'Cache-Control': 'max-age=60, s-maxage=60, stale-while-revalidate=300',
        },
    });
}