import { ArticleSession } from '@/app/article/EbookArticlePage';
import { notFound } from 'next/navigation';

export const getSessionsList = async (token: string) => {
    const response = await fetch('http://localhost:3000/api/getSession', {
        // cache: 'force-cache',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        next: { revalidate: 60 },
    })
    const sessions: ArticleSession[] = await response.json()
    console.log(getSessionsList);

    if (!sessions) notFound()
    return sessions
}