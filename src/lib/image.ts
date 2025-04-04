

import { createClient } from '@/utils/supabase/server';

export async function genCloudflareImage(prompt: string): Promise<Blob | null> {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "image/jpeg",
            Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
        },
        body: JSON.stringify({ prompt }),
    };

    const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
        options
    );

    if (!resp.ok) {
        console.error("Error generating image", await resp.text());
        console.error("resp", resp);
        return null;
    }
    const testres = await resp.json();
    // console.log("resp", testres);

    // Extract image data from JSON response
    if (testres.success && testres.result?.image) {
        // Convert base64 image to blob
        const base64Data = testres.result.image;
        const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }

        const byteArray = new Uint8Array(byteArrays);
        return new Blob([byteArray], { type: 'image/jpeg' });
    }

    return null;
}
const genImageBlob = genCloudflareImage;
export async function genAndUploadImage(prompt: string) {
    const key = crypto.randomUUID();
    const filename = `images/${key}.jpg`;

    const blob = await genImageBlob(prompt);
    //  console.log(blob);

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
