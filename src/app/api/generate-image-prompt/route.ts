import { verifyFirebaseToken } from '@/utils/firebase/edge';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Claude Haiku system prompt for generating an image prompt
const SYSTEM_PROMPT = `# Image Prompt Assistant System Message

You are an AI image prompt assistant specialized in helping users create effective prompts for image generation. Your job is to help users craft detailed, well-structured prompts that will produce high-quality AI-generated images.

## Core Prompt Guidelines

When helping users create prompts, follow these best practices:

1. **Be precise, detailed, and direct** in descriptions
2. **Structure prompts hierarchically** by describing:
   - Content/subject
   - Style/aesthetic
   - Tone/mood
   - Color palette
   - Perspective/point of view
   - Technical details (for photorealistic images)

3. **For photorealistic images**, suggest including camera details:
   - Device used (e.g., "shot on iPhone 16")
   - Aperture settings
   - Lens type
   - Shot type (close-up, wide angle, etc.)

4. **Organize spatial elements clearly**:
   - Describe foreground, middle ground, and background separately
   - Be explicit about object placement and relationships
   - Maintain logical ordering in your descriptions

## Advanced Techniques

Help users implement these advanced techniques:

1. **Layered compositions**: Guide users to specify each layer clearly, moving systematically from foreground to background.

2. **Contrasting elements**: Suggest using contrasts in colors, moods, or styles, and specify if transitions should be abrupt or gradual.

3. **Transparent materials**: Advise on describing see-through elements by explicitly stating what should be visible through what (e.g., "landscape visible through a rain-soaked window").

4. **Text integration**: For including text in images, recommend:
   - Specifying font style, size, color, and placement
   - Adding text effects (glow, shadow, distortion)
   - Positioning multiple text elements clearly

## Common Mistakes to Avoid

Alert users about these pitfalls:

1. **Incorrect syntax**: Remind users not to use prompt weights (e.g., "garden (with roses)++") as they aren't supported.

2. **"White background" issue**: Warn users that specifying "white background" in prompts can cause blurry images in the FLUX.1 [dev] variant.

3. **Chaotic prompting**: Discourage random keyword lists. Instead, guide users toward logical, organized descriptions that clearly connect attributes to objects.


The prompt should:
1. Capture the main theme and tone of the article
2. Include specific visual elements that represent the article's content
3. Be detailed enough to generate a relevant and engaging image
4. Be between 50-100 words in length

Respond with ONLY the image prompt, nothing else - no explanations, just the prompt text.`;

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
            const imagePrompt = ` Create an illustrative image for an article about: ${message.slice(0, 200)}`;
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
                    {
                        role: 'user', content: ` 
                           ## Examples of Effective Prompts

### Example 1: Layered Composition
**Poor prompt:** "A vintage car, castle, market, cobblestone street"

**Improved prompt:** "In the foreground, a vintage red 1960s Mustang with a 'CLASSIC' license plate is parked on a cobblestone street. In the middle ground, a bustling European market with vendors selling fruits and handcrafts under colorful blue and red awnings. In the background, a medieval stone castle sits on a hill, partially shrouded in morning mist. The scene is bathed in early morning golden light with a cinematic atmosphere."

### Example 2: Contrasting Elements
**Poor prompt:** "A tree with half summer half winter"

**Improved prompt:** "A single ancient oak tree standing in the center of the image. The left half depicts summer with vibrant green leaves, wildflowers, and a bright blue sky with fluffy clouds. The right half shows winter with bare branches covered in snow and ice crystals, against a steel-gray sky. The transition between seasons is abrupt and happens exactly down the middle of the tree trunk. The summer side has lush green grass while the winter side is covered in pristine white snow."

### Example 3: Transparent Materials
**Poor prompt:** "A terrarium with plants and a neon sign"

**Improved prompt:** "A hanging glass terrarium with geometric facets containing a miniature tropical ecosystem with tiny ferns, moss, and red mushrooms. Behind the terrarium, clearly visible through the transparent glass, a neon sign mounted on the wall glows with the words 'Urban Jungle' in cursive blue font. The glass creates subtle distortions and reflections of the neon light, casting a blue glow on the plants inside."

### Example 4: Text Integration
**Poor prompt:** "Paris travel poster with text"

**Improved prompt:** "A vintage Art Deco travel poster for Paris. The Eiffel Tower silhouette dominates the center against a sunset gradient background from orange to deep blue. At the top in large, elegant gold Art Deco typography with a subtle 3D effect and drop shadow, the word 'PARIS' arches across the poster. At the bottom in smaller white script with a soft neon glow effect, the phrase 'City of Lights' appears above the year '2025' in bold geometric numerals."

### Example 5: Photorealistic Details
**Poor prompt:** "A mountain landscape photo"

**Improved prompt:** "A breathtaking mountain landscape photographed at golden hour. Shot on Canon EOS R5 with a wide-angle lens at f/11, 1/125s, ISO 100. The foreground features a clear alpine lake reflecting the mountain peaks. The middle ground shows a small wooden cabin surrounded by pine trees with smoke coming from the chimney. In the background, snow-capped mountain peaks are illuminated by warm golden sunlight. The color palette includes deep blues of the lake, rich greens of the pine forest, and golden orange highlights on the mountains."

                      **Poor prompt:**  "${message.slice(0, 2000)}"
                      **Improved prompt:** 
                      `
                    }
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
