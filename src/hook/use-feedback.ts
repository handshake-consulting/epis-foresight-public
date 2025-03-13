"use client"

import { getIdToken } from "@/utils/firebase/client";
import { useCallback, useState } from "react";

// Feedback function for chat messages
const feedbackChat = async (
    clientId: string,
    firebaseIdToken: string,
    body: {
        user: string;
        session: string;
        query: string;
        response: string;
        feedback: string;
        feedback_value: number;
    },
    graphId?: string
) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = baseUrl + "feedback";

    const headers = {
        'Content-Type': 'application/json',
        'firebase-id-token': firebaseIdToken,
        'client-id': clientId,
        ...(graphId && { 'Graph-Id': graphId })
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json();
};

export const useFeedBackChat = ({ graphId }: { graphId?: string | undefined }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Get client ID and firebase token
    const getAuthDetails = async () => {
        const token = await getIdToken();
        const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

        if (!token || !clientId) {
            throw new Error('Authentication required');
        }

        return { clientId, firebaseIdToken: token };
    };

    const submitFeedback = useCallback(
        async (body: Parameters<typeof feedbackChat>[2]) => {
            setIsLoading(true);
            setError(null);

            try {
                const { clientId, firebaseIdToken } = await getAuthDetails();
                console.log(clientId, firebaseIdToken, body, graphId);

                return await feedbackChat(clientId, firebaseIdToken, body, graphId);
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [graphId]
    );

    return { submitFeedback, isLoading, error };
};
