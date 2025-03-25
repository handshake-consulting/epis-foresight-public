import { unstable_cache } from "next/cache";

// export const getArticle = unstable_cache(async (id: string, uid: string) => {

//     const supabase = await createClient();

//     // Get session details
//     const { data: session, error: sessionError } = await supabase
//         .from('chat_sessions')
//         .select('*')
//         .eq('id', id)
//         .eq('user_id', uid)
//         .single();

//     if (sessionError || !session) {
//         notFound()
//     }

//     // Get all messages for this session
//     const { data: messages, error: messagesError } = await supabase
//         .from('chat_messages')
//         .select('*')
//         .eq('session_id', id)
//         .order('created_at', { ascending: true });

//     if (messagesError) {
//         throw new Error('Failed to load article messages');
//     }

//     // Process messages to build article versions
//     const versions = [];
//     let topic = '';
//     let maxVersion = 0;

//     // First pass: find topic and max version
//     messages.forEach(msg => {
//         if (msg.is_topic && msg.role === 'user') {
//             topic = msg.content;
//         }

//         if (msg.version && msg.version > maxVersion) {
//             maxVersion = msg.version;
//         }
//     });

//     // Second pass: build versions
//     for (let v = 1; v <= maxVersion; v++) {
//         const versionMessages = messages.filter(msg => msg.version === v);

//         // Find edit prompt (if any)
//         const editPrompt = versionMessages.find(msg => msg.is_edit && msg.role === 'user')?.content;

//         // Find article content
//         const contentMsg = versionMessages.find(msg => !msg.is_topic && !msg.is_edit && msg.role === 'assistant');

//         if (contentMsg) {
//             // Process image messages
//             const imageMessages: any = [];

//             versionMessages.forEach(msg => {
//                 if (msg.role === 'assistant') {
//                     // Check if message has an image field
//                     if (msg.image) {
//                         imageMessages.push({
//                             id: msg.id || uuidv4(),
//                             sender: 'assistant',
//                             imageId: msg.id || uuidv4(),
//                             storageType: 'supabase',
//                             imageUrl: msg.image,
//                             timestamp: new Date(msg.created_at).toISOString(),
//                             version: v
//                         });
//                     } else {
//                         // Check if it's an image message (JSON format) - for backward compatibility
//                         try {
//                             if (msg.content.trim().startsWith('{') && msg.content.trim().endsWith('}')) {
//                                 const contentData = JSON.parse(msg.content);

//                                 if (contentData.message_type === 'image' && contentData.imageId) {
//                                     imageMessages.push({
//                                         id: msg.id || uuidv4(),
//                                         sender: 'assistant',
//                                         imageId: contentData.imageId,
//                                         storageType: contentData.storageType || 'bucket',
//                                         timestamp: new Date(msg.created_at).toISOString(),
//                                         version: v
//                                     });
//                                 }
//                             }
//                         } catch (e) {
//                             // Not a valid JSON, ignore
//                         }
//                     }
//                 }
//             });

//             // Add version
//             versions.push({
//                 versionNumber: v,
//                 content: contentMsg.content,
//                 editPrompt,
//                 timestamp: new Date(contentMsg.created_at).toISOString(),
//                 images: imageMessages
//             });
//         }
//     }

//     console.log({
//         id: session.id,
//         title: session.title,
//         topic: topic || session.topic || '',
//         currentVersion: versions.length,
//         versions,
//         created_at: session.created_at,
//         updated_at: session.updated_at
//     });

//     // Set article state
//     return {
//         id: session.id,
//         title: session.title,
//         topic: topic || session.topic || '',
//         currentVersion: versions.length,
//         versions,
//         created_at: session.created_at,
//         updated_at: session.updated_at
//     };

// },
//     ['articles'],
//     { revalidate: 3600, tags: ['articles'] }
// )

export const getArticle = unstable_cache(
    async (id: string) => {
        console.log(id);

        // Use fetch directly with cache options
        const response = await fetch(
            `http://localhost:3001/api/getArticle?id=${id}`,
            {
                next: { revalidate: 3600 },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch sessions');
        }

        return response.json();
    },
    ['article'],
    { revalidate: 3600, tags: ['article'] }
);

export const preload = (id: string) => {
    // void evaluates the given expression and returns undefined
    // https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/void
    void getArticle(id)

}

export const getArticleNavigation = unstable_cache(async (id: string) => {
    // Use fetch directly with cache options
    const response = await fetch(
        `http://localhost:3001/api/getArticleNav?id=${id}`,
        {
            next: { revalidate: 3600 },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch sessions');
    }

    return response.json();

},
    ['articlesNav'],
    { revalidate: 3600, tags: ['articlesNav'] }
)
