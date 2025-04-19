"use client"

import { createClient } from "@/utils/supabase/clients";

/**
 * Checks if an article session has any associated messages in the chat_messages table.
 * If not, it deletes the session from the chat_sessions table.
 * 
 * @param sessionId The ID of the article session to check
 * @param userId The ID of the user who owns the session
 * @returns A boolean indicating whether the session was deleted (true) or kept (false)
 */
export async function cleanupEmptyArticleSession(sessionId: string, userId: string): Promise<boolean> {
    if (!sessionId || !userId) {
        console.error("[CLEANUP] Invalid sessionId or userId provided");
        return false;
    }

    try {
        console.log(`[CLEANUP] Checking if article session ${sessionId} has any messages`);
        const supabase = createClient();

        // Check if there are any assistant messages for this session
        const { data: messages, error: messagesError, count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact" })
            .eq("session_id", sessionId)
            .eq("user_id", userId)
            .eq("role", "assistant");

        if (messagesError) {
            console.error("[CLEANUP ERROR] Error checking for messages:", messagesError);
            return false;
        }

        // If there are no assistant messages, delete the session
        if (!count || count === 0) {
            console.log(`[CLEANUP] No assistant messages found for session ${sessionId}, deleting session`);

            // Delete the session
            const { error: deleteError } = await supabase
                .from("chat_sessions")
                .delete()
                .eq("id", sessionId)
                .eq("user_id", userId);

            if (deleteError) {
                console.error("[CLEANUP ERROR] Error deleting empty session:", deleteError);
                return false;
            }

            console.log(`[CLEANUP] Successfully deleted empty session ${sessionId}`);
            return true;
        }

        console.log(`[CLEANUP] Session ${sessionId} has ${count} assistant messages, keeping session`);
        return false;
    } catch (error) {
        console.error("[CLEANUP ERROR] Unexpected error in cleanupEmptyArticleSession:", error);
        return false;
    }
}

/**
 * Checks if an article generation was successful by verifying if there are any
 * assistant messages for the given version in the chat_messages table.
 * If not, it removes the version from the article state.
 * 
 * @param sessionId The ID of the article session to check
 * @param userId The ID of the user who owns the session
 * @param versionNumber The version number to check
 * @returns A boolean indicating whether the version was found (true) or not (false)
 */
export async function verifyArticleVersionExists(
    sessionId: string,
    userId: string,
    versionNumber: number
): Promise<boolean> {
    if (!sessionId || !userId || !versionNumber) {
        console.error("[VERIFY] Invalid parameters provided");
        return false;
    }

    try {
        console.log(`[VERIFY] Checking if version ${versionNumber} exists for session ${sessionId}`);
        const supabase = createClient();

        // Check if there are any assistant messages for this version
        const { data: messages, error: messagesError, count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact" })
            .eq("session_id", sessionId)
            .eq("user_id", userId)
            .eq("role", "assistant")
            .eq("version", versionNumber);

        if (messagesError) {
            console.error("[VERIFY ERROR] Error checking for version messages:", messagesError);
            return false;
        }

        const versionExists = count !== null && count > 0;
        console.log(`[VERIFY] Version ${versionNumber} for session ${sessionId} exists: ${versionExists}`);

        return versionExists;
    } catch (error) {
        console.error("[VERIFY ERROR] Unexpected error in verifyArticleVersionExists:", error);
        return false;
    }
}
