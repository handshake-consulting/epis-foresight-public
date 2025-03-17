"use client"

import { Button } from "@/components/ui/button";
import { useAuthCheck } from "@/hook/use-auth-check";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { UserProfile } from "@/utils/profile";
import { createClient } from "@/utils/supabase/clients";
import { ArrowRight, BookOpen, BookPlus, ChevronDown, ChevronRight, Clock, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ArticlePreview {
    id: string;
    title: string;
    topic: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    preview_text?: string;
    reading_time?: number;
}

// Interface for grouped articles (chapters)
interface Chapter {
    title: string;
    articles: ArticlePreview[];
    expanded: boolean;
}

export default function EbookHomePage({ profile }: { profile: UserProfile }) {
    const [articles, setArticles] = useState<ArticlePreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [bookTitle, setBookTitle] = useState("Your Knowledge Journey");
    const [lastReadArticleId, setLastReadArticleId] = useState<string | null>(null);
    const router = useRouter();

    // Use the auth check hook to verify authentication on the client side
    useAuthCheck({ refreshInterval: 120000 });

    // Load articles
    useEffect(() => {
        const loadArticles = async () => {
            setLoading(true);
            try {
                const { user } = await getCurrentAuthState();
                if (user) {
                    const supabase = createClient();

                    // Get all article sessions
                    const { data } = await supabase
                        .from('chat_sessions')
                        .select('*')
                        .eq('type', 'article')
                        .order('updated_at', { ascending: false });

                    if (data && data.length > 0) {
                        // Get preview text for each article
                        const articlesWithPreview = await Promise.all(
                            data.map(async (article, index) => {
                                // Get the first message from the assistant for this article
                                const { data: messages } = await supabase
                                    .from('chat_messages')
                                    .select('*')
                                    .eq('session_id', article.id)
                                    .eq('role', 'assistant')
                                    .order('created_at', { ascending: true })
                                    .limit(1);

                                let previewText = "";
                                if (messages && messages.length > 0) {
                                    // Extract first paragraph or first 150 characters
                                    const content = messages[0].content;
                                    const firstParagraphMatch = content.match(/^(.+?)(?:\n\n|\n|$)/);
                                    if (firstParagraphMatch) {
                                        previewText = firstParagraphMatch[1].slice(0, 150);
                                        if (previewText.length < firstParagraphMatch[1].length) {
                                            previewText += "...";
                                        }
                                    } else {
                                        previewText = content.slice(0, 150) + (content.length > 150 ? "..." : "");
                                    }
                                }

                                // Calculate estimated reading time (rough estimate: 200 words per minute)
                                const wordCount = messages && messages.length > 0
                                    ? messages[0].content.split(/\s+/).length
                                    : 0;
                                const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                                return {
                                    ...article,
                                    preview_text: previewText,
                                    reading_time: readingTime
                                };
                            })
                        );

                        setArticles(articlesWithPreview);

                        // Set the most recent article as last read
                        if (articlesWithPreview.length > 0) {
                            setLastReadArticleId(articlesWithPreview[0].id);
                        }

                        // Group articles into chapters based on topics
                        groupArticlesIntoChapters(articlesWithPreview);
                    }
                }
            } catch (error) {
                console.error("Error loading articles:", error);
            } finally {
                setLoading(false);
            }
        };

        loadArticles();
    }, []);

    // Group articles into chapters based on topics
    const groupArticlesIntoChapters = (articles: ArticlePreview[]) => {
        // Create a map of topics to articles
        const topicMap: Record<string, ArticlePreview[]> = {};

        articles.forEach(article => {
            const topic = article.topic || "Uncategorized";
            if (!topicMap[topic]) {
                topicMap[topic] = [];
            }
            topicMap[topic].push(article);
        });

        // Convert the map to an array of chapters
        const newChapters: Chapter[] = Object.entries(topicMap).map(([title, articles]) => ({
            title,
            articles,
            expanded: true // Start with all chapters expanded
        }));

        setChapters(newChapters);
    };

    // Toggle chapter expansion
    const toggleChapter = (index: number) => {
        setChapters(prev => {
            const updated = [...prev];
            updated[index].expanded = !updated[index].expanded;
            return updated;
        });
    };

    // Mark article as last read
    const markAsLastRead = (articleId: string) => {
        setLastReadArticleId(articleId);
        localStorage.setItem('lastReadArticle', articleId);
    };

    // Create new article
    const createNewArticle = useCallback(() => {
        router.push('/article?new=true');
    }, [router]);

    // Calculate reading progress
    const readingProgress = useMemo(() => {
        if (articles.length === 0) return 0;
        return Math.round((1 / articles.length) * 100);
    }, [articles]);

    // Filter articles based on search query
    const filteredChapters = useMemo(() => {
        if (!searchQuery) return chapters;

        return chapters.map(chapter => {
            const filteredArticles = chapter.articles.filter(article =>
                article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (article.preview_text && article.preview_text.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            return {
                ...chapter,
                articles: filteredArticles,
                expanded: filteredArticles.length > 0 ? true : chapter.expanded
            };
        }).filter(chapter => chapter.articles.length > 0);
    }, [chapters, searchQuery]);

    return (
        <div className="min-h-screen bg-[#f0e6d2]">
            {/* Header */}
            <header className="bg-[#fcf9f2] border-b border-[#e8e1d1] shadow-sm">
                <div className="container mx-auto px-4 py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <BookOpen className="h-8 w-8 text-[#8a7e66]" />
                        <h1 className="text-2xl font-bold text-[#5d5545] font-serif">EpiForesight</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8a7e66]" />
                            <input
                                type="text"
                                placeholder="Search in this book..."
                                className="pl-10 pr-4 py-2 rounded-md border bg-white border-[#e8e1d1] text-[#5d5545] focus:outline-none focus:ring-1 focus:ring-[#8a7e66] font-serif text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={createNewArticle}
                            className="rounded-md bg-[#8a7e66] hover:bg-[#5d5545] text-white border-none font-serif"
                        >
                            <BookPlus className="h-4 w-4 mr-2" />
                            Add New Section
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a7e66]"></div>
                    </div>
                ) : (
                    <>
                        {/* Book Cover */}
                        <div className="mb-16 bg-white rounded-lg shadow-xl overflow-hidden border border-[#d3c7a7] relative">
                            {/* Book spine effect */}
                            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#8a7e66] to-[#d3c7a7]"></div>

                            <div className="ml-6 p-8 text-center">
                                <div className="inline-block bg-[#f5f1e6] p-16 rounded-lg mb-6 border-[#e8e1d1] border">
                                    <BookOpen className="h-24 w-24 text-[#8a7e66] mx-auto" />
                                </div>
                                <h1 className="text-4xl font-bold text-[#5d5545] font-serif mb-4">{bookTitle}</h1>
                                <p className="text-lg text-[#8a7e66] font-serif italic mb-6">
                                    A collection of knowledge and insights
                                </p>

                                {/* Reading progress */}
                                <div className="max-w-md mx-auto mb-6">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-[#8a7e66] font-serif">Reading Progress</span>
                                        <span className="text-[#8a7e66] font-serif">{readingProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#f5f1e6] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#8a7e66] rounded-full"
                                            style={{ width: `${readingProgress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Continue reading button */}
                                {lastReadArticleId && (
                                    <Link
                                        href={`/article/${lastReadArticleId}`}
                                        className="inline-flex items-center px-6 py-3 border border-[#8a7e66] text-[#8a7e66] hover:bg-[#f5f1e6] text-base font-medium rounded-md shadow-sm focus:outline-none font-serif mr-4"
                                    >
                                        Continue Reading
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                )}

                                <Link
                                    href="#table-of-contents"
                                    className="inline-flex items-center px-6 py-3 bg-[#8a7e66] hover:bg-[#5d5545] text-white text-base font-medium rounded-md shadow-sm focus:outline-none font-serif"
                                >
                                    View Table of Contents
                                </Link>
                            </div>
                        </div>

                        {/* Table of Contents */}
                        <div id="table-of-contents" className="mb-16">
                            <div className="p-8 bg-white border-[#d3c7a7] rounded-lg shadow-xl border relative">
                                {/* Book spine effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#8a7e66] to-[#d3c7a7]"></div>

                                <div className="ml-3">
                                    <h2 className="text-3xl font-bold text-[#5d5545] font-serif mb-8 text-center">Table of Contents</h2>

                                    {filteredChapters.length > 0 ? (
                                        <div className="space-y-6">
                                            {filteredChapters.map((chapter, chapterIndex) => (
                                                <div key={chapter.title} className="space-y-2">
                                                    {/* Chapter heading */}
                                                    <div
                                                        className="flex items-center cursor-pointer hover:bg-[#f5f1e6] p-2 rounded-md"
                                                        onClick={() => toggleChapter(chapterIndex)}
                                                    >
                                                        {chapter.expanded ? (
                                                            <ChevronDown className="h-5 w-5 text-[#8a7e66] mr-2" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-[#8a7e66] mr-2" />
                                                        )}
                                                        <h3 className="text-xl font-bold text-[#5d5545] font-serif">
                                                            {/* Chapter {chapterIndex + 1}: */}

                                                            {chapter.title}
                                                        </h3>
                                                    </div>

                                                    {/* Chapter sections (articles) */}
                                                    {chapter.expanded && (
                                                        <div className="ml-7 space-y-3 border-l-2 pl-4 pb-2 border-dashed border-opacity-50 border-gray-300">
                                                            {chapter.articles.map((article, articleIndex) => (
                                                                <div key={article.id} className={`${article.id === lastReadArticleId ? 'bg-[#f5f1e6]' : ''} p-3 rounded-md`}>
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center">
                                                                                <span className="inline-block w-8 text-center text-[#8a7e66] font-serif mr-2">
                                                                                    {chapterIndex + 1}.{articleIndex + 1}
                                                                                </span>
                                                                                <Link
                                                                                    href={`/article/${article.id}`}
                                                                                    className="font-semibold text-[#5d5545] hover:text-[#8a7e66] transition font-serif"
                                                                                    onClick={() => markAsLastRead(article.id)}
                                                                                >
                                                                                    {article.title}
                                                                                </Link>
                                                                                {article.id === lastReadArticleId && (
                                                                                    <span className="ml-2 text-xs bg-[#8a7e66] text-white px-2 py-0.5 rounded-full font-serif">
                                                                                        Last Read
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="mt-1 text-[#8a7e66] font-serif ml-10">
                                                                                {article.preview_text || "No preview available."}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex items-center text-xs text-[#8a7e66] font-serif italic ml-4">
                                                                            <Clock className="h-3 w-3 mr-1" />
                                                                            <span>{article.reading_time || 1} min read</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 text-[#8a7e66] font-serif">
                                            {searchQuery ? (
                                                <div>
                                                    <p className="mb-4">{`No sections found matching "{${searchQuery}}"`}</p>
                                                    <Button
                                                        onClick={() => setSearchQuery("")}
                                                        variant="outline"
                                                        className="font-serif border-[#e8e1d1] text-[#8a7e66] hover:bg-[#f5f1e6]"
                                                    >
                                                        Clear Search
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="mb-4">Your book is empty. Add your first section!</p>
                                                    <Button
                                                        onClick={createNewArticle}
                                                        className="bg-[#8a7e66] hover:bg-[#5d5545] text-white font-serif"
                                                    >
                                                        <BookPlus className="h-4 w-4 mr-2" />
                                                        Start Writing
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-[#5d5545] text-[#f5f1e6] py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-6 md:mb-0">
                            <div className="flex items-center space-x-2">
                                <BookOpen className="h-6 w-6 text-[#f5f1e6]" />
                                <h2 className="text-xl font-bold font-serif">EpiForesight</h2>
                            </div>
                            <p className="text-[#e8e1d1] mt-2 max-w-md font-serif">
                                Expand your knowledge with AI-powered book creation.
                            </p>
                        </div>
                        <div className="flex space-x-8">
                            <div>
                                <h3 className="font-semibold mb-3 font-serif">Navigation</h3>
                                <ul className="space-y-2 text-[#e8e1d1] font-serif">
                                    <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                                    <li><Link href="/article?new=true" className="hover:text-white transition">New Section</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-[#8a7e66] mt-8 pt-8 text-center text-[#e8e1d1] text-sm font-serif">
                        &copy; {new Date().getFullYear()} EpiForesight. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
