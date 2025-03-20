import { verifyFirebaseToken } from '@/utils/firebase/edge';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Claude Haiku system prompt for generating an image prompt
const SYSTEM_PROMPT = `You are a specialized assistant that converts article content into high-quality FLUX.1 image generation prompts. When given article text, create natural language prompts that follow FLUX.1 best practices:

1. Write in natural, conversational language rather than using technical syntax or weights
2. Structure your prompt clearly with:
   - Main subject description (specific and detailed)
   - Style, tone, and color palette specifications
   - Perspective and composition details (foreground, middle ground, background)
   - For photorealistic images, include camera specifications (device, aperture, lens, shot type)

3. Leverage FLUX.1's special capabilities:
   - Clearly define layered image elements (specify placement in foreground/background)
   - Create contrasting elements if appropriate (with clear transition descriptions)
   - Properly describe transparent or see-through materials when needed
   - Include precise text specifications (font style, size, color, placement, effects)

4. Avoid common mistakes:
   - Don't use syntax like (term)++ or weights
   - Avoid "white background" phrasing which can cause blurry images
   - Don't list keywords in random order - organize descriptions logically
   - Keep prompt length between 50-100 words

Respond ONLY with the formatted prompt - no explanations or other text. Your response should be ready to copy directly into the FLUX image generator.`;

export async function POST(request: NextRequest) {
    try {
        console.log('Request to generate-image-prompt API:', request);

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
            const imagePrompt = `Create an illustrative image for an article about: ${message.slice(0, 200)}`;
            return NextResponse.json({ prompt: imagePrompt });
        }

        // Use the Anthropic SDK to call Claude Haiku
        try {
            // Initialize the Anthropic client
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

            // Call Claude Haiku using the Anthropic SDK
            const response = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 300,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: `convert  this to a flux image model prompt: "${message.slice(0, 2000)}"` }
                ]
            });

            // Extract the image prompt from the response
            let prompt = '';
            if (response.content[0].type === 'text') {
                prompt = response.content[0].text.trim();
            } else {
                // Fallback if we don't get a text response
                prompt = `Create an illustrative image for an article about: ${message.slice(0, 200)}`;
            }

            return NextResponse.json({ prompt });
        } catch (error) {
            console.error('Error calling Anthropic API:', error);

            // Fallback to a simple image prompt if Claude API call fails
            const imagePrompt = `Create an illustrative image for an article about: ${message.slice(0, 200)}`;
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
