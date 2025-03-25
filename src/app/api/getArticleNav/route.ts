import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
) {

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id') || 'mander';

    const supabase = await createClient();

    // Get all article sessions for the user, ordered by updated_at descending
    const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', 'xA8vPolZwRfjjIBxirQDeR8BAPr1')
        .eq('type', 'article')
        .order('updated_at', { ascending: false });

    if (error || !sessions) {
        throw new Error('Failed to load article sessions');
    }

    // Find the index of the current session
    const currentIndex = sessions.findIndex(session => session.id === id);


    // Determine previous and next session IDs
    const prevId = currentIndex > 0 ? sessions[currentIndex - 1].id : null;
    const nextId = currentIndex < sessions.length - 1 ? sessions[currentIndex + 1].id : null;

    // Return navigation object
    const data = {
        prevId,
        currentId: id,
        nextId
    };

    return NextResponse.json(data);
}