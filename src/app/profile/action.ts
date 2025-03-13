'use server'
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function updateProfile(displayName: string, photoFile?: File) {
    try {
        const cookieList = await cookies();
        const cook = cookieList.get('auth-token');
        const token = cook?.value;

        if (!token) {
            return { success: false, message: "Not authenticated" };
        }

        let photoUrl = '';

        // Upload photo to Supabase if provided
        if (photoFile) {
            const supabase = await createClient();

            // Generate a unique filename
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `profile-photos/${fileName}`;

            // Upload the file
            const { data, error } = await supabase.storage
                .from('chat-images')
                .upload(filePath, photoFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error("Error uploading file:", error);
                return { success: false, message: "Failed to upload profile photo" };
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath);

            photoUrl = urlData.publicUrl;
        }

        // Update profile with API
        const response = await fetch(process.env.API_LORE + `/user/update_profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client-id': `${process.env.CLIENT_ID}`,
                'firebase-id-token': `${token}`
            },
            body: JSON.stringify({
                display_name: displayName,
                photo_url: photoUrl || undefined
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            return {
                success: false,
                message: errorData?.message || `Failed to update profile: ${response.status}`
            };
        }

        return { success: true, message: "Profile updated successfully" };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: "An error occurred while updating profile" };
    }
}

export async function changePassword(newPassword: string) {
    console.log('newPassword', newPassword);

    try {
        const cookieList = await cookies();
        const cook = cookieList.get('auth-token');
        const token = cook?.value;

        if (!token) {
            return { success: false, message: "Not authenticated" };
        }

        const response = await fetch(process.env.API_LORE + `/user/change_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client-id': `${process.env.CLIENT_ID}`,
                'firebase-id-token': `${token}`
            },
            body: JSON.stringify({
                new_password: newPassword
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.log('errorData', errorData);

            return {
                success: false,
                message: errorData?.message || `Failed to change password: ${response.status}`
            };
        }

        return { success: true, message: "Password changed successfully" };
    } catch (error) {
        console.error("Error changing password:", error);
        return { success: false, message: "An error occurred while changing password" };
    }
}
