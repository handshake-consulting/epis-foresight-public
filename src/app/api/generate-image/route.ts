import { genAndUploadImage } from "@/lib/image";
import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

        // Parse request body
        const body = await request.json();
        const { prompt } = body;

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json(
                { error: "Invalid prompt" },
                { status: 400 }
            );
        }

        // Check for required environment variable
        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json(
                { error: "Replicate API token is not configured" },
                { status: 500 }
            );
        }

        // Generate and upload image
        const imageUrl = await genAndUploadImage(prompt);

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Failed to generate image" },
                { status: 500 }
            );
        }

        const uuid = imageUrl.split('/').pop()?.split('.')[0] || "";

        // Return the image URL
        return NextResponse.json({
            imageUrl,
            uuid,
            storage_type: "supabase"
        });
    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
