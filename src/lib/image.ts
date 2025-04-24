import { createClient } from '@/utils/supabase/server';
import Replicate from "replicate";

export async function genReplicateImage(prompt: string): Promise<Blob | null> {
    try {
        // Prevent execution during Static Site Generation or metadata generation
        // This environment check helps avoid issues during RSC metadata processing
        if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
            console.warn("Skipping image generation during build time");
            return null;
        }

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
            useFileOutput: false // Get URL instead of ReadableStream
        });

        const input = {
            raw: true,
            prompt: prompt,
            aspect_ratio: "1:1",
            output_format: "jpg",
            safety_tolerance: 6,
            image_prompt_strength: 0.1
        };

        const output = await replicate.run("black-forest-labs/flux-1.1-pro-ultra", { input });

        // Check if we have a valid output
        if (!output || typeof output !== 'string') {
            console.error("Invalid output from Replicate API:", output);
            return null;
        }

        // Fetch the image from the URL returned by Replicate
        const imageResponse = await fetch(output);
        if (!imageResponse.ok) {
            console.error("Failed to fetch image from Replicate URL:", imageResponse.statusText);
            return null;
        }

        // Convert the response to a Blob
        const imageBlob = await imageResponse.blob();
        return imageBlob;
    } catch (error) {
        console.error("Error generating image with Replicate:", error);
        return null;
    }
}

// Add BFL fallback helper
async function genBflImage(prompt: string): Promise<Blob | null> {
    try {
        // Environment guard similar to Replicate path
        if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
            console.warn("Skipping BFL image generation during build time");
            return null;
        }

        const apiKey = process.env.BFL_API_KEY;
        if (!apiKey) {
            console.error("BFL_API_KEY is not set – cannot use fallback");
            return null;
        }

        // 1. Submit generation task
        const createResponse = await fetch("https://api.us1.bfl.ai/v1/flux-pro-1.1", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "x-key": apiKey
            },
            body: JSON.stringify({
                prompt,
                image_prompt: "", // optional secondary prompt left blank
                width: 1024,
                height: 1024,
                prompt_upsampling: false,
                safety_tolerance: 6,
                output_format: "jpeg",
                webhook_url: "",
                webhook_secret: ""
            })
        });

        if (!createResponse.ok) {
            console.error("BFL create task failed:", createResponse.status, createResponse.statusText);
            return null;
        }

        const createData: any = await createResponse.json();
        const requestId = createData.id;
        if (!requestId) {
            console.error("BFL create task response did not contain id", createData);
            return null;
        }

        // 2. Poll for result
        const pollInterval = 500; // ms
        const maxAttempts = 40; // ~20 seconds
        let attempts = 0;
        let sampleUrl: string | null = null;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, pollInterval));
            attempts += 1;

            const statusRes = await fetch(`https://api.us1.bfl.ai/v1/get_result?id=${requestId}`, {
                method: "GET",
                headers: {
                    "accept": "application/json",
                    "x-key": apiKey
                }
            });

            if (!statusRes.ok) {
                console.error("BFL get_result failed:", statusRes.status, statusRes.statusText);
                return null;
            }

            const statusData: any = await statusRes.json();
            const status = statusData.status;

            if (status === "Ready") {
                sampleUrl = statusData?.result?.sample;
                break;
            } else if (status === "Failed" || status === "Error") {
                console.error("BFL generation failed with status:", status);
                return null;
            }
            // otherwise, keep polling (Queued/InProgress etc.)
        }

        if (!sampleUrl) {
            console.error("BFL polling timed out or no sample URL returned");
            return null;
        }

        // 3. Fetch the generated image
        const imageResponse = await fetch(sampleUrl);
        if (!imageResponse.ok) {
            console.error("Failed to fetch image from BFL signed URL:", imageResponse.statusText);
            return null;
        }

        const imageBlob = await imageResponse.blob();
        return imageBlob;
    } catch (error) {
        console.error("Error generating image with BFL API:", error);
        return null;
    }
}

// Primary image generation function that prefers Replicate but falls back to BFL
async function genImageBlob(prompt: string): Promise<Blob | null> {
    // Try Replicate first
    const replicateBlob = await genReplicateImage(prompt);
    if (replicateBlob) {
        return replicateBlob;
    }

    console.warn("Replicate failed, attempting BFL fallback");
    return await genBflImage(prompt);
}

export async function genAndUploadImage(prompt: string) {
    const key = crypto.randomUUID();
    const filename = `images/${key}.jpg`;

    const blob = await genImageBlob(prompt);

    if (!blob) {
        return null;
    }

    const res = await put(filename, blob);

    return res;
}

export async function put(path: string, blob: Blob) {
    // Use Supabase storage for production
    const supabase = await createClient();

    // Convert blob to File object
    const buffer = await blob.arrayBuffer();
    const file = new File([buffer], path.split('/').pop() || 'image.jpg', { type: blob.type });

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
        .from('images')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        console.error('Error uploading to Supabase:', error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(path);

    return publicUrl;
}
