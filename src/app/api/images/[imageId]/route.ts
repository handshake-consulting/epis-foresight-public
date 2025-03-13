import { NextRequest, NextResponse } from "next/server";
type Params = Promise<{ imageId: string }>
export async function GET(
    request: NextRequest,
    segmentData: { params: Params }
    // { params }: { params: { imageId: string } }
) {
    const params = await segmentData.params
    const imageId = params.imageId


    if (!imageId) {
        return new NextResponse("Image ID is required", { status: 400 });
    }

    try {
        // Get Firebase ID token from cookies
        const authCookie = request.cookies.get('auth-token');
        const token = authCookie?.value;

        if (!token) {
            console.error("No Firebase ID token available in cookies");
            return new NextResponse("Authentication required", { status: 401 });
        }

        // Make request to external API
        const response = await fetch(process.env.API_LORE! + "/image/get", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "client-id": process.env.NEXT_PUBLIC_CLIENT_ID || "",
                "firebase-id-token": token
            },
            body: JSON.stringify({
                object_uuid: "",
                chunk_uuid: "",
                image_uuid: imageId
            })
        });

        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            return new NextResponse(`Error fetching image: ${response.statusText}`, {
                status: response.status
            });
        }

        // Parse the JSON response
        const responseData = await response.json();

        // Check if we have image URLs in the response
        if (!responseData.image_urls || !responseData.image_urls.length) {
            console.error("No image URLs in response:", responseData);
            return new NextResponse("Image not found", { status: 404 });
        }

        // Return the image URLs array directly
        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Error in image route:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
