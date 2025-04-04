import { verifyFirebaseToken } from '@/utils/firebase/edge';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Claude Haliku system prompt for generating a chat title
const SYSTEM_PROMPT = `You are a helpful assistant that generates concise, descriptive titles for chat conversations.
Your task is to create a brief (3-6 words) but informative title that captures the essence of what the conversation might be about, based on the first message.
Respond with ONLY the title, nothing else - no quotes, no explanations, just the title text.`;

export async function POST(request: NextRequest) {
    try {
        //    console.log('Request to generate-title API:', request);

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

        // Parse the request body
        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Check if we have an Anthropic API key
        if (!process.env.ANTHROPIC_API_KEY) {
            // Fallback to a simple title generation if no API key is available
            const words = message.split(' ');
            const firstFewWords = words.slice(0, 4).join(' ');
            const title = firstFewWords.length > 30
                ? firstFewWords.substring(0, 30) + '...'
                : firstFewWords;

            return NextResponse.json({ title });
        }

        // Use the Anthropic SDK to call Claude Haliku
        try {
            // Initialize the Anthropic client
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

            // Call Claude Haiku using the Anthropic SDK
            const response = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 30,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: `First message: "${message}"` }
                ]
            });

            // Extract the title from the response
            let title = '';
            if (response.content[0].type === 'text') {
                title = response.content[0].text.trim();
            } else {
                // Fallback if we don't get a text response
                title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            }

            return NextResponse.json({ title });
        } catch (error) {
            console.error('Error calling Anthropic API:', error);

            // Fallback to a simple title if Claude API call fails
            const truncatedContent = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            return NextResponse.json({ title: truncatedContent });
        }
    } catch (error) {
        console.error('Error in generate-title API:', error);
        return NextResponse.json(
            { error: 'Failed to generate title' },
            { status: 500 }
        );
    }
}
