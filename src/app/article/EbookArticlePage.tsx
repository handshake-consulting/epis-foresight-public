"use client"

import {
    ArticleContent,
    EditInput,
    ImageSlider,
    VersionNavigation
} from "@/components/article";
import { ChatSession } from "@/components/chat/types";
import SettingsDialog from "@/components/settings/SettingsDialog";
import SettingsToggler from "@/components/settings/SettingsToggler";
import { useArticle } from "@/hook/use-article";
import { useAuthCheck } from "@/hook/use-auth-check";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { UserProfile } from "@/utils/profile";
import { createClient } from "@/utils/supabase/clients";
import { ArrowLeft, ArrowRight, BookPlus, ChevronLeft, Home, Menu, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function EbookArticlePage({
    profile,
    initialSessionId
}: {
    profile: UserProfile;
    initialSessionId?: string;
}) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState("light");
    const [nextArticle, setNextArticle] = useState<ChatSession | null>(null);
    const [prevArticle, setPrevArticle] = useState<ChatSession | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Use the auth check hook to verify authentication on the client side
    useAuthCheck({ refreshInterval: 120000 });

    // Initialize theme preference from localStorage
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Use the article hook
    const {
        article,
        currentVersion,
        currentVersionNumber,
        isStreaming,
        error,
        isFirstGeneration,
        isLatestVersion,
        sliderOpen,
        toggleSlider,
        goToPreviousVersion,
        goToNextVersion,
        generateArticle,
        stopGeneration,
        resetArticle,
        loadArticleSession
    } = useArticle({
        callbacks: {
            onData: (data) => {
                if (data.status === "error") {
                    console.error("Stream error:", data.error);
                }
            },
            onError: (error) => console.error("Hook error:", error),
            onFinish: () => {
                console.log("Stream finished");
            },
        }
    });

    // Get URL search params to check for new article flag
    const searchParams = useSearchParams();
    const isNewArticle = searchParams.get('new') === 'true';
    const router = useRouter();

    // Start new article
    const startNewArticle = async () => {
        if (!userId) return;

        stopGeneration();
        resetArticle();

        // Clear any existing session
        setCurrentSession(null);

        // Navigate to /article?new=true to ensure we get a fresh article
        router.push('/article?new=true');
    };

    // Load user sessions and user info
    useEffect(() => {
        const loadUserAndSessions = async () => {
            const { user } = await getCurrentAuthState();
            if (user) {
                setUserId(user.uid);

                // If the new=true parameter is present, start a new article
                if (isNewArticle) {
                    startNewArticle();
                    return;
                }

                const supabase = createClient();

                // Load all sessions for navigation
                const { data: allSessions } = await supabase
                    .from('chat_sessions')
                    .select('*')
                    .eq('user_id', user.uid)
                    .eq('type', 'article')
                    .order('updated_at', { ascending: false });

                if (allSessions) {
                    setSessions(allSessions);

                    // If initialSessionId is provided, try to load that specific session
                    if (initialSessionId) {
                        const currentSessionIndex = allSessions.findIndex(s => s.id === initialSessionId);

                        if (currentSessionIndex !== -1) {
                            const sessionData = allSessions[currentSessionIndex];
                            setCurrentSession(sessionData);

                            // Set next and previous articles for navigation
                            if (currentSessionIndex > 0) {
                                setPrevArticle(allSessions[currentSessionIndex - 1]);
                            } else {
                                setPrevArticle(null);
                            }

                            if (currentSessionIndex < allSessions.length - 1) {
                                setNextArticle(allSessions[currentSessionIndex + 1]);
                            } else {
                                setNextArticle(null);
                            }

                            await loadArticleSession(sessionData.id, user.uid);

                            // Mark this article as last read
                            localStorage.setItem('lastReadArticle', sessionData.id);

                            return;
                        }
                    }

                    // If no initialSessionId or session not found, load most recent session
                    if (allSessions.length > 0) {
                        setCurrentSession(allSessions[0]);

                        // Set next and previous articles for navigation
                        setPrevArticle(null);
                        if (allSessions.length > 1) {
                            setNextArticle(allSessions[1]);
                        } else {
                            setNextArticle(null);
                        }

                        await loadArticleSession(allSessions[0].id, user.uid);

                        // Mark this article as last read
                        localStorage.setItem('lastReadArticle', allSessions[0].id);
                    } else {
                        // No article sessions yet
                        resetArticle();
                    }
                }
            }
        };
        loadUserAndSessions();
    }, [initialSessionId, isNewArticle, loadArticleSession, resetArticle]);

    // Refresh sessions list
    const refreshSessions = useCallback(async () => {
        if (!userId) return;

        const supabase = createClient();
        const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'article')
            .order('updated_at', { ascending: false });

        if (data) {
            setSessions(data);

            // Update next and previous articles
            if (currentSession) {
                const currentIndex = data.findIndex(s => s.id === currentSession.id);
                if (currentIndex > 0) {
                    setPrevArticle(data[currentIndex - 1]);
                } else {
                    setPrevArticle(null);
                }

                if (currentIndex < data.length - 1) {
                    setNextArticle(data[currentIndex + 1]);
                } else {
                    setNextArticle(null);
                }
            }
        }
    }, [userId, currentSession]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        const prompt = inputRef.current?.value;
        if (!prompt) return;

        // Generate article
        await generateArticle(
            prompt,
            userId,
            currentSession?.id,
            isFirstGeneration
        );

        // Clear input
        inputRef.current!.value = "";

        // Refresh sessions list after generation
        refreshSessions();
    };


    // Switch to a different article session
    const switchSession = async (session: ChatSession) => {
        if (!userId) return;

        setCurrentSession(session);
        stopGeneration();

        // Update next and previous articles
        const currentIndex = sessions.findIndex(s => s.id === session.id);
        if (currentIndex > 0) {
            setPrevArticle(sessions[currentIndex - 1]);
        } else {
            setPrevArticle(null);
        }

        if (currentIndex < sessions.length - 1) {
            setNextArticle(sessions[currentIndex + 1]);
        } else {
            setNextArticle(null);
        }

        // Load the article data
        await loadArticleSession(session.id, userId);

        // Mark this article as last read
        localStorage.setItem('lastReadArticle', session.id);

        // Close sidebar after selection on mobile
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    // Delete an article session
    const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering session switch
        if (!userId) return;

        try {
            const supabase = createClient();

            // Delete the session
            const { error } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error deleting session:', error);
                return;
            }

            // Get updated list of sessions
            const { data: updatedSessions } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId)
                .eq('type', 'article')
                .order('updated_at', { ascending: false });

            if (updatedSessions && updatedSessions.length > 0) {
                setSessions(updatedSessions);

                // If we deleted current session, switch to the most recent one
                if (currentSession?.id === sessionId) {
                    setCurrentSession(updatedSessions[0]);
                    await loadArticleSession(updatedSessions[0].id, userId);

                    // Update next and previous articles
                    setPrevArticle(null);
                    if (updatedSessions.length > 1) {
                        setNextArticle(updatedSessions[1]);
                    } else {
                        setNextArticle(null);
                    }

                    // Mark this article as last read
                    localStorage.setItem('lastReadArticle', updatedSessions[0].id);
                } else {
                    // Update next and previous articles if needed
                    const currentIndex = updatedSessions.findIndex(s => s.id === currentSession?.id);
                    if (currentIndex > 0) {
                        setPrevArticle(updatedSessions[currentIndex - 1]);
                    } else {
                        setPrevArticle(null);
                    }

                    if (currentIndex < updatedSessions.length - 1) {
                        setNextArticle(updatedSessions[currentIndex + 1]);
                    } else {
                        setNextArticle(null);
                    }
                }
            } else {
                // No more article sessions
                setSessions([]);
                setCurrentSession(null);
                resetArticle();
                setNextArticle(null);
                setPrevArticle(null);
            }
        } catch (error) {
            console.error('Error in deleteSession:', error);
        }
    };

    // Navigate to next article
    const goToNextArticle = () => {
        if (nextArticle) {
            switchSession(nextArticle);
        }
    };

    // Navigate to previous article
    const goToPreviousArticle = () => {
        if (prevArticle) {
            switchSession(prevArticle);
        }
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-[#f0e6d2]'}`}>
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#fcf9f2] border-[#e8e1d1]'} border-b shadow-sm`}>
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={toggleSidebar}
                            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-[#f5f1e6]'}`}
                        >
                            <Menu className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-[#8a7e66]'}`} />
                        </button>
                        <Link
                            href="/"
                            className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-[#8a7e66] hover:text-[#5d5545]'} font-serif`}
                        >
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Library</span>
                        </Link>
                    </div>

                    <div className="text-center flex-1 px-4">
                        <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#5d5545]'} font-serif truncate`}>
                            {currentSession?.title || 'New Page'}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-[#f5f1e6]'}`}
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-5 w-5 text-gray-300" />
                            ) : (
                                <Moon className="h-5 w-5 text-[#8a7e66]" />
                            )}
                        </button>

                        {/* Add SettingsToggler here */}
                        <SettingsToggler />
                    </div>
                </div>
            </header>

            {/* Table of Contents Sidebar */}
            <div className={`fixed inset-0 z-20 ${sidebarOpen ? 'block' : 'hidden'}`}>
                {/* Overlay */}
                <div
                    className="absolute inset-0 bg-black/30"
                    onClick={toggleSidebar}
                ></div>

                {/* Sidebar */}
                <div className={`absolute top-0 left-0 bottom-0 w-72 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e8e1d1]'} border-r shadow-xl overflow-y-auto`}>
                    <div className={`p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-[#fcf9f2]'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-[#e8e1d1]'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#5d5545]'} font-serif`}>Table of Contents</h2>
                            <button
                                onClick={toggleSidebar}
                                className={`p-1 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-[#f5f1e6]'}`}
                            >
                                <ChevronLeft className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-[#8a7e66]'}`} />
                            </button>
                        </div>

                        <button
                            onClick={startNewArticle}
                            className={`w-full flex items-center gap-2 p-2 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-[#8a7e66] hover:bg-[#5d5545] text-white'} rounded-md font-serif text-sm`}
                        >
                            <BookPlus className="h-4 w-4" />
                            <span>Create New Page</span>
                        </button>
                    </div>

                    <div className="p-4">
                        {sessions.length > 0 ? (
                            <div className="space-y-3">
                                {sessions.map((session, index) => (
                                    <div
                                        key={session.id}
                                        className={`p-3 rounded-md cursor-pointer font-serif text-sm ${currentSession?.id === session.id
                                            ? (theme === 'dark' ? 'bg-blue-900 bg-opacity-20 border border-blue-800' : 'bg-[#f5f1e6] border border-[#e8e1d1]')
                                            : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-[#fcf9f2]')
                                            }`}
                                        onClick={() => switchSession(session)}
                                    >
                                        <div className="flex items-center">
                                            <span className={`inline-block w-6 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-[#8a7e66]'} font-serif mr-2`}>
                                                {index + 1}.
                                            </span>
                                            <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-[#5d5545]'}`}>
                                                {session.title}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`text-center p-4 ${theme === 'dark' ? 'text-gray-400' : 'text-[#8a7e66]'} font-serif`}>
                                Your book is empty
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="pt-16 pb-20">
                <div className="container mx-auto px-4 py-8">
                    {isFirstGeneration ? (
                        <>
                            {/* Empty state with centered welcome message and input */}
                            <div className={`max-w-3xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-[#d3c7a7]'} relative`}>
                                {/* Book spine effect */}
                                <div className={`absolute left-0 top-0 bottom-0 w-3 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-900 to-gray-800' : 'bg-gradient-to-r from-[#8a7e66] to-[#d3c7a7]'}`}></div>

                                <div className="ml-3 p-8">
                                    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-transparent">
                                        <div className="text-center space-y-4 mb-8 max-w-md">
                                            <h2 className={`text-lg sm:text-xl font-semibold font-serif ${theme === 'dark' ? 'text-white' : 'text-[#5d5545]'}`}>{`Create a new page`}</h2>
                                            <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-[#8a7e66]'} font-serif`}>{`Enter a topic or question to generate content. You can then refine and edit it with follow-up prompts.`}</p>
                                        </div>

                                        {/* Input in the center when no article */}
                                        <div className="w-full max-w-2xl px-2 sm:px-4">
                                            <EditInput
                                                inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
                                                isStreaming={isStreaming}
                                                isFirstGeneration={isFirstGeneration}
                                                onSubmit={handleSubmit}
                                                onStop={stopGeneration}
                                                onNewArticle={startNewArticle}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Article content when there is an article */}
                            <div className={`max-w-3xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-[#d3c7a7]'} relative`}>
                                {/* Book spine effect */}
                                <div className={`absolute left-0 top-0 bottom-0 w-3 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-900 to-gray-800' : 'bg-gradient-to-r from-[#8a7e66] to-[#d3c7a7]'}`}></div>

                                <div className="ml-3 p-8">
                                    {/* Article metadata */}
                                    <div className={`mb-6 pb-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-[#e8e1d1]'}`}>
                                        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#5d5545]'} font-serif mb-2`}>
                                            {currentSession?.title || 'Untitled Page'}
                                        </h1>
                                        {article?.topic && (
                                            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-[#8a7e66]'} font-serif italic`}>
                                                {article.topic}
                                            </p>
                                        )}
                                    </div>

                                    {/* Article content */}
                                    {currentVersion && (
                                        <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''} font-serif`}>
                                            <ArticleContent
                                                version={currentVersion}
                                                isLatestVersion={isLatestVersion}
                                                isStreaming={isStreaming}
                                            />
                                        </div>
                                    )}

                                    {/* Navigation between articles */}
                                    <div className={`mt-8 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-[#e8e1d1]'} flex justify-between`}>
                                        {prevArticle ? (
                                            <button
                                                onClick={goToPreviousArticle}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-[#f5f1e6] text-[#8a7e66]'}`}
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                <span>Previous Page</span>
                                            </button>
                                        ) : (
                                            <div></div> // Empty div for spacing
                                        )}

                                        {nextArticle && (
                                            <button
                                                onClick={goToNextArticle}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-[#f5f1e6] text-[#8a7e66]'}`}
                                            >
                                                <span>Next Page</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Version navigation */}
                                    {article && article.versions.length > 1 && (
                                        <div className="mt-4">
                                            <VersionNavigation
                                                currentVersion={currentVersionNumber}
                                                totalVersions={article.versions.length}
                                                onPrevious={goToPreviousVersion}
                                                onNext={goToNextVersion}
                                            />
                                        </div>
                                    )}

                                    {/* Edit input at the bottom */}
                                    <div className="mt-8">
                                        <EditInput
                                            inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
                                            isStreaming={isStreaming}
                                            isFirstGeneration={isFirstGeneration}
                                            onSubmit={handleSubmit}
                                            onStop={stopGeneration}
                                            onNewArticle={startNewArticle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Image slider */}
            {currentVersion && currentVersion.images && currentVersion.images.length > 0 && (
                <ImageSlider
                    images={currentVersion.images}
                    isOpen={sliderOpen}
                    onToggle={toggleSlider}
                />
            )}

            {/* Error message */}
            {error && (
                <div className={`fixed bottom-20 left-0 right-0 mx-auto w-max p-2 text-xs sm:text-sm ${theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'} rounded`}>
                    {error}
                </div>
            )}

            {/* Settings Dialog */}
            <SettingsDialog />
        </div>
    );
}
