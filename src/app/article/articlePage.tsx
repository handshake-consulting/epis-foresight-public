"use client"

import {
    ArticleContent,
    ArticleHeader,
    EditInput,
    ImageSlider,
    VersionNavigation
} from "@/components/article";
import { SessionSidebar } from "@/components/chat/SessionSidebar";
import { ChatSession } from "@/components/chat/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useArticle } from "@/hook/use-article";
import { useAuthCheck } from "@/hook/use-auth-check";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { UserProfile } from "@/utils/profile";
import { createClient } from "@/utils/supabase/clients";
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
        <div className="flex h-screen relative overflow-hidden">
            {/* Background overlay when sidebar is open on mobile */}
            {isMobile && !sidebarCollapsed && (
                <div className="fixed inset-0 bg-black/30 z-10" onClick={toggleSidebar}></div>
            )}

            {/* Sessions sidebar */}
            <div className={`h-full ${sidebarCollapsed ? 'w-16' : 'w-64 md:w-72'} block transition-all duration-300 z-20`}>
                <SessionSidebar
                    sessions={sessions}
                    currentSession={currentSession}
                    onNewChat={startNewArticle}
                    onSwitchSession={switchSession}
                    onDeleteSession={deleteSession}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                    userEmail={userEmail}
                    userImage={profile.photo_url || userImage}
                />
            </div>

            {/* Article area */}
            <Card className="flex-1 flex flex-col h-full rounded-none border-l relative">
                <ArticleHeader
                    title={currentSession?.title || 'New Article'}
                    topic={article?.topic}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                />

                {isFirstGeneration ? (
                    <>
                        {/* Empty state with centered welcome message and input */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4">
                            <div className="text-center space-y-4 mb-8 max-w-md">
                                <div className="inline-block bg-blue-100 p-3 sm:p-4 rounded-full">
                                    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" fill="#E6F0FF" />
                                        <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" stroke="#4F46E5" strokeWidth="2" />
                                        <path d="M13.3334 23.3333C13.3334 23.3333 15.8334 26.6667 20 26.6667C24.1667 26.6667 26.6667 23.3333 26.6667 23.3333" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
                                        <circle cx="15" cy="15" r="1.66667" fill="#4F46E5" />
                                        <circle cx="25" cy="15" r="1.66667" fill="#4F46E5" />
                                    </svg>
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold">{`Create a new article`}</h2>
                                <p className="text-sm sm:text-base text-gray-600">{`Enter a topic or question to generate an article. You can then refine and edit it with follow-up prompts.`}</p>
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
            </Card>
        </div>
    );
}
