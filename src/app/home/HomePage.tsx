"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthCheck } from "@/hook/use-auth-check";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { UserProfile } from "@/utils/profile";
import { createClient } from "@/utils/supabase/clients";
import { ArrowRight, BookOpen, Clock, Edit, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface ArticlePreview {
    id: string;
    title: string;
    topic: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    preview_text?: string;
}

export default function HomePage({ profile }: { profile: UserProfile }) {
    const [articles, setArticles] = useState<ArticlePreview[]>([]);
    const [featuredArticle, setFeaturedArticle] = useState<ArticlePreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
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
                            data.map(async (article) => {
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

                                return {
                                    ...article,
                                    preview_text: previewText
                                };
                            })
                        );

                        // Set featured article to the most recent one
                        setFeaturedArticle(articlesWithPreview[0]);

                        // Set the rest of the articles
                        setArticles(articlesWithPreview.slice(1));
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

    // Filter articles based on search query
    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.preview_text && article.preview_text.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Create new article
    const createNewArticle = useCallback(() => {
        router.push('/article');
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="container mx-auto px-4 py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">EpiForesight</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={createNewArticle}
                            className="rounded-full bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Article
                        </Button>

                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                                {profile.photo_url ? (
                                    <Image
                                        src={profile.photo_url}
                                        alt={profile.display_name}
                                        width={32}
                                        height={32}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold">
                                        {profile?.display_name?.charAt(0) || ""}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium">{profile.display_name}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Featured Article */}
                        {featuredArticle && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Article</h2>
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="md:flex">
                                        <div className="md:flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center p-8 md:w-48">
                                            <BookOpen className="h-16 w-16 text-white" />
                                        </div>
                                        <div className="p-8 w-full">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">
                                                        {new Date(featuredArticle.updated_at).toLocaleDateString()}
                                                    </div>
                                                    <Link
                                                        href={`/article/${featuredArticle.id}`}
                                                        className="block mt-1 text-2xl font-semibold text-gray-900 hover:text-blue-600 transition"
                                                    >
                                                        {featuredArticle.title}
                                                    </Link>
                                                </div>
                                                <Link
                                                    href={`/article/${featuredArticle.id}`}
                                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    <span>Edit</span>
                                                </Link>
                                            </div>
                                            <p className="mt-4 text-gray-600 text-lg">
                                                {featuredArticle.preview_text || "No preview available."}
                                            </p>
                                            <div className="mt-6">
                                                <Link
                                                    href={`/article/${featuredArticle.id}`}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    Read More
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Article Grid */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Recent Articles</h2>
                                <Link
                                    href="/article"
                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    <span>Create New</span>
                                    <Plus className="ml-1 h-4 w-4" />
                                </Link>
                            </div>

                            {filteredArticles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredArticles.map((article) => (
                                        <Card key={article.id} className="hover:shadow-lg transition-shadow">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-lg font-semibold line-clamp-2">
                                                        {article.title}
                                                    </CardTitle>
                                                    <div className="flex items-center text-gray-500 text-sm">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <CardDescription className="text-gray-600 line-clamp-2 mt-1">
                                                    {article.topic}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pb-3">
                                                <p className="text-gray-600 line-clamp-3">
                                                    {article.preview_text || "No preview available."}
                                                </p>
                                            </CardContent>
                                            <CardFooter className="pt-0 flex justify-between">
                                                <Link
                                                    href={`/article/${article.id}`}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                                >
                                                    Read More
                                                    <ArrowRight className="ml-1 h-3 w-3" />
                                                </Link>
                                                <Link
                                                    href={`/article/${article.id}`}
                                                    className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Link>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg p-8 text-center">
                                    {searchQuery ? (
                                        <div>
                                            <p className="text-gray-600 mb-4">No articles found matching "{searchQuery}"</p>
                                            <Button
                                                onClick={() => setSearchQuery("")}
                                                variant="outline"
                                            >
                                                Clear Search
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-gray-600 mb-4">No articles yet. Create your first article!</p>
                                            <Button
                                                onClick={createNewArticle}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Article
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Getting Started Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
                            <p className="text-gray-700 mb-6">
                                Create beautiful articles with AI assistance. Start with a topic, and our system will generate
                                a well-structured article that you can refine and edit.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-blue-600 font-bold text-lg">1</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Enter a Topic</h3>
                                    <p className="text-gray-600 text-sm">
                                        Start by entering a topic or question you'd like to explore.
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-blue-600 font-bold text-lg">2</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Generate Content</h3>
                                    <p className="text-gray-600 text-sm">
                                        Our AI will generate a comprehensive article based on your topic.
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-blue-600 font-bold text-lg">3</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Refine & Edit</h3>
                                    <p className="text-gray-600 text-sm">
                                        Refine the article with follow-up prompts to get exactly what you need.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-6 md:mb-0">
                            <div className="flex items-center space-x-2">
                                <BookOpen className="h-6 w-6 text-blue-400" />
                                <h2 className="text-xl font-bold">EpiForesight</h2>
                            </div>
                            <p className="text-gray-400 mt-2 max-w-md">
                                Expand your foresight about the future of faith with AI-powered article generation.
                            </p>
                        </div>
                        <div className="flex space-x-8">
                            <div>
                                <h3 className="font-semibold mb-3">Navigation</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                                    <li><Link href="/article" className="hover:text-white transition">New Article</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-3">Account</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
                                    <li>
                                        <form action="/auth/signout" method="post">
                                            <button type="submit" className="hover:text-white transition">Sign Out</button>
                                        </form>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} EpiForesight. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
