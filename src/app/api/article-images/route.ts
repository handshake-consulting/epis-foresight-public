import { ImageMessage } from "@/components/chat/types";
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Get the authorization token from the request
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Verify the Firebase token
        const { valid, uid } = await verifyFirebaseToken(token);
        if (!valid || !uid) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get pagination parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        // Calculate pagination range
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

        if (error) {
            console.error("Error fetching article images:", error);
            return NextResponse.json(
                { error: "Failed to fetch article images" },
                { status: 500 }
            );
        }

        // Process messages to extract image information
        const imageMessages: ImageMessage[] = [];

        for (const message of messages) {
            // Check if the message has an image
            if (message.image) {
                try {
                    // Add image message
                    imageMessages.push({
                        id: message.id,
                        sender: message.role as "user" | "assistant",
                        timestamp: new Date(message.created_at),
                        imageId: message.id,
                        storageType: "supabase",
                        imageUrl: message.image,
                        version: message.version
                    });
                } catch (e) {
                    console.error("Error processing message:", e);
                    // Skip this message if there's an error
                    continue;
                }
            }
        }
        // console.log(imageMessages);

        // Return the image messages with pagination metadata
        return NextResponse.json({
            images: imageMessages,
            pagination: {
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            }
        });
    } catch (error) {
        console.error("Error fetching article images:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
