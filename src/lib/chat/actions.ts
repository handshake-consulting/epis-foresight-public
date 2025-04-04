'use server'

import { cookies } from 'next/headers';

export async function streamResponse(formData: FormData) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    //  console.log(token);

    if (!token?.value) {
        throw new Error('User not authenticated')
    }

    const message = formData.get('message')
    if (!message || typeof message !== 'string') {
        throw new Error('Message is required')
    }

    try {
        const response = await fetch(process.env.API_URL + 'chat_stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client-id': process.env.CLIENT_ID!,
                'graph-id': process.env.GRAPH_ID!,
                'firebase-id-token': token.value
            },
            body: JSON.stringify({ query: message, session: "e6765dd9-fe59-44c7-943d-45a206b4b8d2", user: "babfswW65pfql2V6RzF05D1IKh83" }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
        }

        // Return a plain object with the response data
        return {
            url: process.env.API_URL + 'chat_stream',
            headers: {
                'Content-Type': 'application/json',
                'client-id': process.env.CLIENT_ID!,
                'graph-id': process.env.GRAPH_ID!,
                'firebase-id-token': token.value
            },
            message
        }
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to process request')
    }
}
