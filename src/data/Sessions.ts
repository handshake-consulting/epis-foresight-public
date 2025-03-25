import { unstable_cache } from 'next/cache';

// export const getSessionsList = unstable_cache(async (cookies: any) => {
//     // const cookeList = await cookies()
//     // const token = cookeList.get('auth-token')
//     // if (!token)
//     //     notFound()
//     // const { valid, uid } = await verifyFirebaseToken(token.value);

//     // Create Supabase client
//     const supabase = await createClient(cookies);

//     // Query for all sessions or paginated sessions based on fetchAll flag
//     let query = supabase
//         .from('chat_sessions')
//         .select('*', { count: 'exact' })
//         .eq('user_id', 'xA8vPolZwRfjjIBxirQDeR8BAPr1')
//         .eq('type', 'article')
//         .order('updated_at', { ascending: false });

//     const { data: sessions, error } = await query;
//     if (!sessions) notFound()
//     return sessions
// },
//     ['sessions'],
//     { revalidate: 3600, tags: ['sessions'] }
// )


export const getSessionsList = unstable_cache(
    async (origin: any) => {

        // Use fetch directly with cache options
        const response = await fetch(
            `${origin?.startsWith("localhost") ? "http" : "https"
            }://${origin}/api/getSession`,
            {
                next: { revalidate: 3600 },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch sessions');
        }

        return response.json();
    },
    ['sessions'],
    { revalidate: 3600, tags: ['sessions'] }
);