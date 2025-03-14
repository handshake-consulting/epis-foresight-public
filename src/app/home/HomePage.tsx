"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthCheck } from "@/hook/use-auth-check";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { UserProfile } from "@/utils/profile";
import { createClient } from "@/utils/supabase/clients";
import { ArrowRight, BookOpen, BookPlus, Clock, Feather, Search } from "lucide-react";
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
                                placeholder="Search your library..."
                                className="pl-10 pr-4 py-2 rounded-md border border-[#e8e1d1] focus:outline-none focus:ring-1 focus:ring-[#8a7e66] bg-white font-serif text-[#5d5545] text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={createNewArticle}
                            className="rounded-md bg-[#8a7e66] hover:bg-[#5d5545] text-white border-none font-serif"
                        >
                            <BookPlus className="h-4 w-4 mr-2" />
                            New Book
                        </Button>

                        {/* <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#f5f1e6] border border-[#e8e1d1] overflow-hidden">
                                {profile.photo_url ? (
                                    <Image
                                        src={profile.photo_url}
                                        alt={profile.display_name}
                                        width={32}
                                        height={32}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#f5f1e6] text-[#8a7e66] font-serif">
                                        {profile?.display_name?.charAt(0) || ""}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium font-serif text-[#5d5545]">{profile.display_name}</span>
                        </div> */}
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
                        {/* Featured Book */}
                        {featuredArticle && (
                            <div className="mb-16">
                                <h2 className="text-2xl font-bold text-[#5d5545] mb-8 font-serif text-center">Featured Book</h2>
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-[#d3c7a7] relative">
                                    {/* Book spine effect */}
                                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#8a7e66] to-[#d3c7a7]"></div>

                                    <div className="md:flex">
                                        <div className="md:flex-shrink-0 bg-[#f5f1e6] flex items-center justify-center p-8 md:w-48 ml-6">
                                            <BookOpen className="h-16 w-16 text-[#8a7e66]" />
                                        </div>
                                        <div className="p-8 w-full">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-sm text-[#8a7e66] font-serif italic">
                                                        {new Date(featuredArticle.updated_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    <Link
                                                        href={`/article/${featuredArticle.id}`}
                                                        className="block mt-1 text-2xl font-semibold text-[#5d5545] hover:text-[#8a7e66] transition font-serif"
                                                    >
                                                        {featuredArticle.title}
                                                    </Link>
                                                </div>
                                                <Link
                                                    href={`/article/${featuredArticle.id}`}
                                                    className="flex items-center text-[#8a7e66] hover:text-[#5d5545] font-serif"
                                                >
                                                    <Feather className="h-4 w-4 mr-1" />
                                                    <span>Continue Writing</span>
                                                </Link>
                                            </div>
                                            <p className="mt-4 text-[#5d5545] text-lg font-serif leading-relaxed">
                                                {featuredArticle.preview_text || "No preview available."}
                                            </p>
                                            <div className="mt-6">
                                                <Link
                                                    href={`/article/${featuredArticle.id}`}
                                                    className="inline-flex items-center px-4 py-2 border border-[#e8e1d1] text-sm font-medium rounded-md shadow-sm text-[#5d5545] bg-[#f5f1e6] hover:bg-[#e8e1d1] focus:outline-none font-serif"
                                                >
                                                    Open Book
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Book Collection */}
                        <div className="mb-16">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-[#5d5545] font-serif">Your Library</h2>
                                <Link
                                    href="/article"
                                    className="text-[#8a7e66] hover:text-[#5d5545] flex items-center font-serif"
                                >
                                    <span>Write New Book</span>
                                    <BookPlus className="ml-1 h-4 w-4" />
                                </Link>
                            </div>

                            {filteredArticles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredArticles.map((article) => (
                                        <Card key={article.id} className="hover:shadow-xl transition-shadow bg-white border border-[#d3c7a7] overflow-hidden relative">
                                            {/* Book spine effect */}
                                            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#8a7e66] to-[#d3c7a7]"></div>

                                            <div className="ml-3">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start">
                                                        <CardTitle className="text-lg font-semibold line-clamp-2 font-serif text-[#5d5545]">
                                                            {article.title}
                                                        </CardTitle>
                                                        <div className="flex items-center text-[#8a7e66] text-sm font-serif italic">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            <span>{new Date(article.updated_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                    <CardDescription className="text-[#8a7e66] line-clamp-2 mt-1 font-serif">
                                                        {article.topic}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="pb-3">
                                                    <p className="text-[#5d5545] line-clamp-3 font-serif">
                                                        {article.preview_text || "No preview available."}
                                                    </p>
                                                </CardContent>
                                                <CardFooter className="pt-0 flex justify-between">
                                                    <Link
                                                        href={`/article/${article.id}`}
                                                        className="text-[#8a7e66] hover:text-[#5d5545] text-sm font-medium flex items-center font-serif"
                                                    >
                                                        Open Book
                                                        <ArrowRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                    <Link
                                                        href={`/article/${article.id}`}
                                                        className="text-[#8a7e66] hover:text-[#5d5545] text-sm flex items-center font-serif"
                                                    >
                                                        <Feather className="h-3 w-3 mr-1" />
                                                        Write
                                                    </Link>
                                                </CardFooter>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg p-8 text-center border border-[#e8e1d1] shadow-md">
                                    {searchQuery ? (
                                        <div>
                                            <p className="text-[#5d5545] mb-4 font-serif">{`No books found matching "{searchQuery}"`}</p>
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
                                            <p className="text-[#5d5545] mb-4 font-serif">Your library is empty. Write your first book!</p>
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

                        {/* Getting Started Section */}
                        <div className="bg-[#f5f1e6] rounded-lg p-8 mb-12 border border-[#e8e1d1] shadow-md">
                            <h2 className="text-2xl font-bold text-[#5d5545] mb-4 font-serif text-center">{`The Writer's Journey`}</h2>
                            <p className="text-[#5d5545] mb-6 font-serif text-center max-w-2xl mx-auto">
                                {`    Create beautiful books with AI assistance. Start with a topic, and our system will craft
                                a well-structured manuscript that you can refine and edit to perfection.`}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e8e1d1]">
                                    <div className="w-12 h-12 bg-[#fcf9f2] rounded-full flex items-center justify-center mb-4 border border-[#e8e1d1] mx-auto">
                                        <span className="text-[#8a7e66] font-bold text-lg font-serif">1</span>
                                    </div>
                                    <h3 className="font-semibold text-[#5d5545] mb-2 font-serif text-center">Choose Your Topic</h3>
                                    <p className="text-[#8a7e66] text-sm font-serif text-center">
                                        Begin by selecting a topic or question you'd like to explore in your book.
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e8e1d1]">
                                    <div className="w-12 h-12 bg-[#fcf9f2] rounded-full flex items-center justify-center mb-4 border border-[#e8e1d1] mx-auto">
                                        <span className="text-[#8a7e66] font-bold text-lg font-serif">2</span>
                                    </div>
                                    <h3 className="font-semibold text-[#5d5545] mb-2 font-serif text-center">Craft Your Manuscript</h3>
                                    <p className="text-[#8a7e66] text-sm font-serif text-center">
                                        {` Our AI will generate a comprehensive manuscript based on your chosen topic.`}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e8e1d1]">
                                    <div className="w-12 h-12 bg-[#fcf9f2] rounded-full flex items-center justify-center mb-4 border border-[#e8e1d1] mx-auto">
                                        <span className="text-[#8a7e66] font-bold text-lg font-serif">3</span>
                                    </div>
                                    <h3 className="font-semibold text-[#5d5545] mb-2 font-serif text-center">Refine & Perfect</h3>
                                    <p className="text-[#8a7e66] text-sm font-serif text-center">
                                        {`   Refine your book with follow-up prompts until it matches your vision perfectly.`}
                                    </p>
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
                                {` Expand your foresight about the future of faith with AI-powered book creation.`}
                            </p>
                        </div>
                        <div className="flex space-x-8">
                            <div>
                                <h3 className="font-semibold mb-3 font-serif">Navigation</h3>
                                <ul className="space-y-2 text-[#e8e1d1] font-serif">
                                    <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                                    <li><Link href="/article" className="hover:text-white transition">New Book</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-3 font-serif">Account</h3>
                                <ul className="space-y-2 text-[#e8e1d1] font-serif">
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
                    <div className="border-t border-[#8a7e66] mt-8 pt-8 text-center text-[#e8e1d1] text-sm font-serif">
                        &copy; {new Date().getFullYear()} EpiForesight. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
