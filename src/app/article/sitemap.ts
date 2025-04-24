import { BASE_URL } from '@/utils/consant'
import { createClient } from '@/utils/supabase/server'
import type { MetadataRoute } from 'next'



export async function generateSitemaps() {
    // For simplicity, we'll just create a single sitemap
    // You can adjust this if you have a large number of articles
    return [{ id: 0 }, { id: 1 }]
}

export default async function sitemap({
    id
}: {
    id: number
}): Promise<MetadataRoute.Sitemap> {
    // Create the Supabase client
    const supabase = await createClient()

    // Fetch articles from the chat_sessions table
    const { data: articles, error } = await supabase
        .from('chat_sessions')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .range(id * 50000, (id + 1) * 50000 - 1) // Google's limit is 50,000 URLs per sitemap

    if (error || !articles) {
        console.error('Error fetching articles for sitemap:', error)
        // Return just the homepage if there's an error
        return [
            {
                url: BASE_URL,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 1,
            },
        ]
    }

    // Create sitemap entries for each article
    const articleEntries = articles.map((article) => ({
        url: `${BASE_URL}/article/${article.id}`,
        lastModified: new Date(article.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    // Add the homepage
    const sitemap: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        ...articleEntries,
    ]

    return sitemap
}
