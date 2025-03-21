import { verifyFirebaseToken } from '@/utils/firebase/edge';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Claude Haiku system prompt for generating loading text
const SYSTEM_PROMPT = `# Loading Text Generator System Message

You are an AI assistant specialized in generating engaging, contextually relevant loading messages for an article generation system. Your job is to create a series of loading messages that inform users about the article processing status while keeping them engaged.

## Guidelines for Loading Messages

1. Create 5-7 short, engaging loading messages related to the article content
2. Each message should be 1-2 sentences maximum
3. Show a logical progression from starting analysis to completion
4. Include specific details from the article content to make messages contextually relevant
5. Maintain a professional but conversational tone
6. Format as a JSON array of strings

## Example Output Format

\`\`\`json
{
  "loadingMessages": [
    "Analyzing key concepts in your article about renewable energy...",
    "Extracting main arguments about solar panel efficiency...",
    "Organizing supporting evidence from recent studies...",
    "Connecting ideas across different renewable technologies...",
    "Finalizing insights on the future of clean energy solutions...",
    "Preparing your comprehensive article for display..."
  ]
}
\`\`\`

Keep your response focused solely on generating the JSON array of loading messages based on the article content provided.`;

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
            // Fallback to default loading messages if no API key is available
            const defaultMessages = [
                "Analyzing your article content...",
                "Extracting key concepts and themes...",
                "Organizing information into a coherent structure...",
                "Refining arguments and supporting evidence...",
                "Finalizing your article for presentation...",
                "Almost ready to display your complete article..."
            ];
            return NextResponse.json({ loadingMessages: defaultMessages });
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
                max_tokens: 500,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: `Generate loading messages for this article content: "${message.slice(0, 2000)}"` }
                ]
            });

            // Extract the loading messages from the response
            let loadingMessages = [];
            if (response.content[0].type === 'text') {
                try {
                    // Try to parse JSON from the response
                    const responseText = response.content[0].text.trim();
                    // Find JSON object in the response
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const jsonData = JSON.parse(jsonMatch[0]);
                        if (Array.isArray(jsonData.loadingMessages)) {
                            loadingMessages = jsonData.loadingMessages;
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing JSON from Claude response:', parseError);
                }
            }

            // Fallback if parsing failed
            if (loadingMessages.length === 0) {
                loadingMessages = [
                    "Analyzing your article content...",
                    "Extracting key concepts and themes...",
                    "Organizing information into a coherent structure...",
                    "Refining arguments and supporting evidence...",
                    "Finalizing your article for presentation...",
                    "Almost ready to display your complete article..."
                ];
            }

            return NextResponse.json({ loadingMessages });
        } catch (error) {
            console.error('Error calling Anthropic API:', error);

            // Fallback to default loading messages if Claude API call fails
            const defaultMessages = [
                "Analyzing your article content...",
                "Extracting key concepts and themes...",
                "Organizing information into a coherent structure...",
                "Refining arguments and supporting evidence...",
                "Finalizing your article for presentation...",
                "Almost ready to display your complete article..."
            ];
            return NextResponse.json({ loadingMessages: defaultMessages });
        }
    } catch (error) {
        console.error('Error in generate-loading-text API:', error);
        return NextResponse.json(
            { error: 'Failed to generate loading text' },
            { status: 500 }
        );
    }
}
