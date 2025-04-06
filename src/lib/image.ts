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

// Replace Cloudflare with Replicate
const genImageBlob = genReplicateImage;

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
