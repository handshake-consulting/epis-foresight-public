import { verifyFirebaseToken } from '@/utils/firebase/edge';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Claude Haiku system prompt for generating an image prompt
const SYSTEM_PROMPT = `You convert article text into concrete visual descriptions for image generation. Create visual metaphors but describe them using ONLY literal, physical objects and actions. Descriptions must be only 10 words maximum and contain no abstract phrases like "as" or "representing."`;

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

        // Parse the request body
        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Check if we have an Anthropic API key
        if (!process.env.ANTHROPIC_API_KEY) {
            // Fallback to a simple image prompt if no API key is available
            const imagePrompt = `Abstract concept representing: ${message.slice(0, 100)}, illustrated in minimalist retro-futuristic line art. Composition includes geometric shapes, flowing curves, fine black linework, halftone patterns, and selective use of color (red, blue, or yellow) on a muted beige background. Visual style inspired by mid-century graphics, surrealist art, and vintage scientific illustrations.`;
            return NextResponse.json({ prompt: imagePrompt });
        }

        // Use the Anthropic SDK to call Claude Haiku
        try {
            // Initialize the Anthropic client
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

            // Call Claude Haiku using the Anthropic SDK
            const userPrompt = `${message.slice(0, 2000)}

Create a visual metaphor for this article and describe it using ONLY concrete physical objects and actions. Your description must:
1. Be exactly 10 words or fewer
2. Contain NO abstract phrases like "as," "representing," or "symbolizing"
3. Describe ONLY what would physically appear in the image
4. Be immediately visualizable by an image generator

INCORRECT: "Local knowledge and diaspora expertise as interlocked gears driving sustainable mining."
CORRECT: "Golden gears connecting village elders to modern miners underground."

INCORRECT: "Strategic clarity as a guiding light"
CORRECT: "Lighthouse beam transforming into streams of colorful data."`;

            const response = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 300,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: 'user', content: userPrompt
                    }
                ]
            });

            // Extract the image description from the response
            let imageDescription = '';
            if (response.content[0].type === 'text') {
                imageDescription = response.content[0].text.trim();
            } else {
                // Fallback if we don't get a text response
                imageDescription = `Abstract concept about ${message.slice(0, 50)}`;
            }

            // Create the complete prompt by appending the template text
            const prompt = `${imageDescription}, illustrated in minimalist retro-futuristic line art. Composition includes geometric shapes, flowing curves, fine black linework, halftone patterns, and selective use of color (red, blue, or yellow) on a muted beige background. Visual style inspired by mid-century graphics, surrealist art, and vintage scientific illustrations.`;

            return NextResponse.json({ prompt });
        } catch (error) {
            console.error('Error calling Anthropic API:', error);

            // Fallback to a simple image prompt if Claude API call fails
            const imagePrompt = `Abstract concept about: ${message.slice(0, 100)}, illustrated in minimalist retro-futuristic line art. Composition includes geometric shapes, flowing curves, fine black linework, halftone patterns, and selective use of color (red, blue, or yellow) on a muted beige background. Visual style inspired by mid-century graphics, surrealist art, and vintage scientific illustrations.`;
            return NextResponse.json({ prompt: imagePrompt });
        }
    } catch (error) {
        console.error('Error in generate-image-prompt API:', error);
        return NextResponse.json(
            { error: 'Failed to generate image prompt' },
            { status: 500 }
        );
    }
}
