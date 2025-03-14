"use client"

import {
    ArticleContent,
    ArticleHeader,
    EditInput,
    ImageSlider,
    VersionNavigation
} from "@/components/article";
import { ChatSession } from "@/components/chat/types";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useArticle } from "@/hook/use-article";
import { useAuthCheck } from "@/hook/use-auth-check";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { UserProfile } from "@/utils/profile";
import { createClient } from "@/utils/supabase/clients";
import { BookOpen, ChevronDown, PlusCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ArticlePage({
    profile,
    initialSessionId
}: {
    profile: UserProfile;
    initialSessionId?: string;
}) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Use the auth check hook to verify authentication on the client side
    useAuthCheck({ refreshInterval: 120000 });

    // Initialize sidebar state from localStorage on component mount
    useEffect(() => {
        const storedState = localStorage.getItem('sidebarCollapsed');
        if (storedState !== null) {
            setSidebarCollapsed(storedState === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        // Store the new state in localStorage
        localStorage.setItem('sidebarCollapsed', String(newState));
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

    // Load user sessions and user info
    useEffect(() => {
        const loadUserAndSessions = async () => {
            const { user } = await getCurrentAuthState();
            if (user) {
                setUserId(user.uid);
                setUserEmail(user.email || null);
                setUserImage(user.photoURL || null);

                const supabase = createClient();

                // If initialSessionId is provided, try to load that specific session
                if (initialSessionId) {
                    const { data: sessionData } = await supabase
                        .from('chat_sessions')
                        .select('*')
                        .eq('id', initialSessionId)
                        .eq('user_id', user.uid)
                        .single();

                    if (sessionData) {
                        // Load all sessions for the sidebar
                        const { data: allSessions } = await supabase
                            .from('chat_sessions')
                            .select('*')
                            .eq('user_id', user.uid)
                            .eq('type', 'article')
                            .order('updated_at', { ascending: false });

                        if (allSessions) {
                            setSessions(allSessions);
                        }

                        setCurrentSession(sessionData);
                        await loadArticleSession(sessionData.id, user.uid);
                        return;
                    }
                }

                // If no initialSessionId or session not found, load all sessions
                const { data } = await supabase
                    .from('chat_sessions')
                    .select('*')
                    .eq('user_id', user.uid)
                    .eq('type', 'article')
                    .order('updated_at', { ascending: false });

                if (data && data.length > 0) {
                    setSessions(data);
                    setCurrentSession(data[0]); // Set most recent session as current

                    // Load the article data
                    await loadArticleSession(data[0].id, user.uid);
                } else {
                    // No article sessions yet
                    resetArticle();
                }
            }
        };
        loadUserAndSessions();
    }, [initialSessionId, loadArticleSession, resetArticle]);

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
        }
    }, [userId]);

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

    // Start new article
    const startNewArticle = async () => {
        if (!userId) return;

        stopGeneration();
        resetArticle();

        // Clear any existing session
        setCurrentSession(null);
    };

    // Switch to a different article session
    const switchSession = async (session: ChatSession) => {
        if (!userId) return;

        setCurrentSession(session);
        stopGeneration();

        // Load the article data
        await loadArticleSession(session.id, userId);
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
                }
            } else {
                // No more article sessions
                setSessions([]);
                setCurrentSession(null);
                resetArticle();
            }
        } catch (error) {
            console.error('Error in deleteSession:', error);
        }
    };

    // State to track screen size
    const [isMobile, setIsMobile] = useState(false);

    // Effect to handle window resize and set mobile state
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="min-h-screen bg-[#f0e6d2] p-4 sm:p-8 md:p-12 flex flex-col items-center">
            {/* Book container */}
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden border border-[#d3c7a7] relative">
                {/* Book spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#8a7e66] to-[#d3c7a7]"></div>

                {/* Book content area */}
                <div className="ml-6 flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)]">
                    {/* Article dropdown menu for session switching */}
                    <div className="absolute top-4 right-4 z-10">
                        <div className="relative">
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="flex items-center gap-2 px-3 py-2 bg-[#fcf9f2] text-[#5d5545] rounded-md border border-[#e8e1d1] font-serif text-sm shadow-sm hover:bg-[#f5f1e6]"
                            >
                                <BookOpen className="h-4 w-4" />
                                <span>{currentSession?.title || 'Articles'}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {!sidebarCollapsed && (
                                <div className="absolute right-0 mt-1 w-64 bg-[#fcf9f2] border border-[#e8e1d1] rounded-md shadow-lg z-20 overflow-y-auto max-h-96">
                                    <div className="p-2">
                                        <button
                                            onClick={startNewArticle}
                                            className="w-full flex items-center gap-2 p-2 text-[#8a7e66] hover:bg-[#f5f1e6] rounded-md font-serif text-sm"
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                            <span>New article</span>
                                        </button>

                                        {sessions.length > 0 && <div className="border-t border-[#e8e1d1] my-2"></div>}

                                        {sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className={`flex items-center p-2 rounded-md cursor-pointer font-serif text-sm ${currentSession?.id === session.id ? 'bg-[#f5f1e6] text-[#5d5545]' : 'text-[#8a7e66] hover:bg-[#f5f1e6]'}`}
                                                onClick={() => {
                                                    switchSession(session);
                                                    setSidebarCollapsed(true);
                                                }}
                                            >
                                                <div className="flex-1 truncate">{session.title}</div>
                                                <button
                                                    className="text-[#8a7e66] hover:text-[#5d5545] p-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSession(session.id, e);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <ArticleHeader
                        title={currentSession?.title || 'New Article'}
                        topic={article?.topic}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={toggleSidebar}
                    />

                    {isFirstGeneration ? (
                        <>
                            {/* Empty state with centered welcome message and input */}
                            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#fcf9f2]">
                                <div className="text-center space-y-4 mb-8 max-w-md">
                                    <div className="inline-block bg-[#f5f1e6] p-3 sm:p-4 rounded-full border border-[#e8e1d1]">
                                        <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 8C10 6.89543 10.8954 6 12 6H28C29.1046 6 30 6.89543 30 8V32C30 33.1046 29.1046 34 28 34H12C10.8954 34 10 33.1046 10 32V8Z" fill="#fcf9f2" stroke="#8a7e66" strokeWidth="2" />
                                            <path d="M15 14H25M15 20H25M15 26H21" stroke="#8a7e66" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-semibold font-serif text-[#5d5545]">{`Create a new article`}</h2>
                                    <p className="text-sm sm:text-base text-[#8a7e66] font-serif">{`Enter a topic or question to generate an article. You can then refine and edit it with follow-up prompts.`}</p>
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
                        </>
                    ) : (
                        <>
                            {/* Article content when there is an article */}
                            <CardContent className="flex-1 overflow-y-auto p-0 flex flex-col">
                                {currentVersion && (
                                    <ArticleContent
                                        version={currentVersion}
                                        isLatestVersion={isLatestVersion}
                                    />
                                )}

                                {/* Version navigation */}
                                {article && article.versions.length > 1 && (
                                    <VersionNavigation
                                        currentVersion={currentVersionNumber}
                                        totalVersions={article.versions.length}
                                        onPrevious={goToPreviousVersion}
                                        onNext={goToNextVersion}
                                    />
                                )}

                                {/* Image slider */}
                                {currentVersion && currentVersion.images && currentVersion.images.length > 0 && (
                                    <ImageSlider
                                        images={currentVersion.images}
                                        isOpen={sliderOpen}
                                        onToggle={toggleSlider}
                                    />
                                )}
                            </CardContent>

                            {/* Edit input at the bottom */}
                            <CardFooter className="mt-auto p-0">
                                <EditInput
                                    inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
                                    isStreaming={isStreaming}
                                    isFirstGeneration={isFirstGeneration}
                                    onSubmit={handleSubmit}
                                    onStop={stopGeneration}
                                    onNewArticle={startNewArticle}
                                />
                            </CardFooter>
                        </>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="absolute bottom-20 left-0 right-0 mx-auto w-max p-2 text-xs sm:text-sm text-destructive bg-destructive/10 rounded">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
