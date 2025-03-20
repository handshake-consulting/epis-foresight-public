"use client"

import { ImageSlider } from "@/components/article";
import { ChatSession } from "@/components/chat/types";
import { EbookContent, EbookFooter, EbookHeader, EbookSidebar, EmptyStateContent } from "@/components/ebook";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useArticle } from "@/hook/use-article";
import { useAuthCheck } from "@/hook/use-auth-check";
import { useSessions } from "@/hook/use-sessions";
import { useSettingsStore } from "@/store/settingsStore";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { createClient } from "@/utils/supabase/clients";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
export default function EbookArticlePage({

    initialSessionId
}: {

    initialSessionId?: string;
}) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [theme, setTheme] = useState("light");
    const [nextArticle, setNextArticle] = useState<ChatSession | null>(null);
    const [prevArticle, setPrevArticle] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMoreSessions, setHasMoreSessions] = useState(true);
    const PAGE_SIZE = 10; // Number of sessions to load per page
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter()
    // Use the auth check hook to verify authentication on the client side
    useAuthCheck({ refreshInterval: 120000 });

    // Get settings from the store
    const { settings, setSettings } = useSettingsStore();

    // Initialize theme from settings
    useEffect(() => {
        // Set theme based on settings
        setTheme(settings.theme === 'sepia' ? 'sepia' : settings.theme);
    }, [settings.theme]);

    // Using the store for UI toggles
    const { toggleSidebar, toggleImageSlider } = useSettingsStore();

    // Toggle theme
    const toggleTheme = () => {
        const currentTheme = theme;
        let newTheme: 'light' | 'dark' | 'sepia';

        // Cycle through themes: light -> sepia -> dark -> light
        if (currentTheme === 'light') {
            newTheme = 'sepia';
        } else if (currentTheme === 'sepia') {
            newTheme = 'dark';
        } else {
            newTheme = 'light';
        }

        // Update the settings store
        setSettings({ theme: newTheme });
        setTheme(newTheme);
    };

    // Callback to handle stream finish and redirect to article page
    const handleStreamFinish = useCallback(() => {
        console.log("Stream finished, redirecting to article page");
        router.push('/article/' + article?.id);
        // if (currentSession?.id) {
        //     console.log("Stream finished, redirecting to article page");
        //     router.push(`/article/${currentSession.id}`);
        // }
    }, [currentSession?.id, router]);

    // Use the article hook
    const {
        article,
        currentVersion,
        currentVersionNumber,
        isStreaming,
        error,
        isFirstGeneration,
        isLatestVersion,
        goToPreviousVersion,
        goToNextVersion,
        goToSpecificVersion,
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
            onFinish: handleStreamFinish,
        }
    });

    // Get URL search params
    const searchParams = useSearchParams();
    const isNewArticle = searchParams.get("new") === "true";
    const versionParam = searchParams.get("version");


    // Start new article
    const startNewArticle = async () => {
        if (!userId) return;

        stopGeneration();
        resetArticle();

        // Clear any existing session
        setCurrentSession(null);

        // Navigate to /article?new=true to ensure we get a fresh article
        router.push("/article?new=true");
    };

    // Fetch sessions using React Query
    const { data: sessionData, isLoading: isSessionsLoading, error: sessionsError, refetch: refetchSessions } = useSessions(currentPage === 0 ? 1 : currentPage, PAGE_SIZE);

    // Update sessions state when sessionData changes
    useEffect(() => {
        if (sessionData) {
            setSessions(prevSessions => {
                // If we're on the first page, replace all sessions
                if (currentPage === 1) {
                    return [...sessionData];
                }
                // Otherwise, append new sessions to existing ones
                const existingIds = new Set(prevSessions.map(s => s.id));
                const newSessions = sessionData.filter(s => !existingIds.has(s.id));
                return [...prevSessions, ...newSessions];
            });
        }
    }, [sessionData, currentPage]);
    //  console.log(sessionData);

    // Load user sessions and user info
    useEffect(() => {
        const loadUserAndSessions = async () => {
            setIsLoading(true);
            const { user } = await getCurrentAuthState();
            if (user) {
                setUserId(user.uid);

                // If the new=true parameter is present, start a new article
                if (isNewArticle) {
                    startNewArticle();
                    setIsLoading(false);
                    return;
                }

                const supabase = createClient();

                // If initialSessionId is provided, first try to directly fetch that specific session
                if (initialSessionId) {
                    const { data: specificSession, error: specificError } = await supabase
                        .from("chat_sessions")
                        .select("*")
                        .eq("id", initialSessionId)
                        .eq("user_id", user.uid)
                        .single();

                    if (specificError) {
                        console.error("Error loading specific session:", specificError);
                    } else if (specificSession) {
                        // Get the position of this session in the overall list to determine pagination
                        const { data: positionData } = await supabase
                            .from("chat_sessions")
                            .select("id")
                            .eq("user_id", user.uid)
                            .eq("type", "article")
                            .order("updated_at", { ascending: false });

                        const sessionPosition = positionData ? positionData.findIndex(s => s.id === initialSessionId) : -1;

                        if (sessionPosition !== -1) {
                            // Calculate which page this session is on
                            const sessionPage = Math.floor(sessionPosition / PAGE_SIZE);
                            setCurrentPage(sessionPage + 1); // +1 because pages are 0-indexed in the calculation

                            // Find the session in the loaded page
                            if (sessionData && sessionData.length > 0) {
                                const currentSessionIndex = sessionData.findIndex(s => s.id === initialSessionId);

                                if (currentSessionIndex !== -1) {
                                    setCurrentSession(specificSession);

                                    // Set next and previous articles for navigation
                                    if (currentSessionIndex > 0) {
                                        setPrevArticle(sessionData[currentSessionIndex - 1]);
                                    } else {
                                        setPrevArticle(null);
                                    }

                                    if (currentSessionIndex < sessionData.length - 1) {
                                        setNextArticle(sessionData[currentSessionIndex + 1]);
                                    } else {
                                        setNextArticle(null);
                                    }

                                    await loadArticleSession(specificSession.id, user.uid);

                                    // Mark this article as last read
                                    localStorage.setItem("lastReadArticle", specificSession.id);

                                    // Check if there are more sessions
                                    const { count } = await supabase
                                        .from("chat_sessions")
                                        .select("*", { count: "exact", head: true })
                                        .eq("user_id", user.uid)
                                        .eq("type", "article");

                                    setHasMoreSessions(count !== null && count > (sessionPage + 1) * PAGE_SIZE);
                                    setIsLoading(false);
                                    return;
                                }
                            }
                        }
                    }
                }

                // If sessionData is available from React Query
                if (sessionData && sessionData.length > 0) {
                    router.push(`/article/${sessionData[0].id}`);
                    // setSessions(sessionData);
                    // setCurrentSession(sessionData[0]);

                    // // Set next and previous articles for navigation
                    // setPrevArticle(null);
                    // if (sessionData.length > 1) {
                    //     setNextArticle(sessionData[1]);
                    // } else {
                    //     setNextArticle(null);
                    // }

                    // await loadArticleSession(sessionData[0].id, user.uid);

                    // // Mark this article as last read
                    // localStorage.setItem("lastReadArticle", sessionData[0].id);
                } else {
                    // No article sessions yet
                    resetArticle();
                }
            }
            // setIsLoading(false);
        };

        if (!isSessionsLoading) {
            loadUserAndSessions();
        }
    }, [initialSessionId, isNewArticle, loadArticleSession, resetArticle, sessionData, isSessionsLoading]);
    //  console.log(initialSessionId);
    // console.log(currentSession);


    // Handle version parameter from URL
    useEffect(() => {
        if (versionParam && article) {
            const version = parseInt(versionParam, 10);
            if (!isNaN(version) && version >= 1 && version <= article.versions.length) {
                goToSpecificVersion(version);
            }
        }
    }, [article, versionParam, goToSpecificVersion]);

    // Refresh sessions list - now using React Query's refetch
    const refreshSessions = useCallback(async () => {
        if (!userId) return;

        // Reset pagination to first page
        setCurrentPage(1);

        // Explicitly refetch sessions
        await refetchSessions();

        // Update next and previous articles if we have session data
        if (sessionData && currentSession) {
            const currentIndex = sessionData.findIndex(s => s.id === currentSession.id);
            if (currentIndex > 0) {
                setPrevArticle(sessionData[currentIndex - 1]);
            } else {
                setPrevArticle(null);
            }

            if (currentIndex < sessionData.length - 1) {
                setNextArticle(sessionData[currentIndex + 1]);
            } else {
                setNextArticle(null);
            }
        }
    }, [userId, currentSession, sessionData, refetchSessions]);

    // Load more sessions - now incrementing page for React Query
    const loadMoreSessions = useCallback(async () => {
        if (!userId || !hasMoreSessions) return false;

        // Increment the page to trigger React Query to fetch the next page
        setCurrentPage(prevPage => prevPage + 1);

        // We'll determine if there are more sessions based on the data length
        if (sessionData && sessionData.length > 0) {
            const supabase = createClient();
            // Check if there are more sessions
            const { count } = await supabase
                .from("chat_sessions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("type", "article");

            const hasMore = count !== null && count > (currentPage + 1) * PAGE_SIZE;
            setHasMoreSessions(hasMore);
            return hasMore;
        }

        setHasMoreSessions(false);
        return false;
    }, [userId, currentPage, hasMoreSessions, sessionData]);

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

        setIsLoading(true);
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
        localStorage.setItem("lastReadArticle", session.id);

        setIsLoading(false);

        // Close sidebar after selection on mobile
        if (window.innerWidth < 768) {
            // Use the store's function to close the sidebar
            useSettingsStore.getState().setUIOpenState(null);
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
                .from("chat_sessions")
                .delete()
                .eq("id", sessionId)
                .eq("user_id", userId);

            if (error) {
                console.error("Error deleting session:", error);
                return;
            }

            // Refetch sessions using React Query
            await refetchSessions();

            // Get the updated sessions
            if (sessions.length > 0) {
                // If we deleted current session, switch to the most recent one
                if (currentSession?.id === sessionId) {
                    setIsLoading(true);
                    const newCurrentSession = sessions[0];
                    setCurrentSession(newCurrentSession);
                    await loadArticleSession(newCurrentSession.id, userId);
                    setIsLoading(false);

                    // Update next and previous articles
                    setPrevArticle(null);
                    if (sessions.length > 1) {
                        setNextArticle(sessions[1]);
                    } else {
                        setNextArticle(null);
                    }

                    // Mark this article as last read
                    localStorage.setItem("lastReadArticle", newCurrentSession.id);
                } else {
                    // Update next and previous articles if needed
                    const currentIndex = sessions.findIndex(s => s.id === currentSession?.id);
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
            console.error("Error in deleteSession:", error);
        }
    };

    // Navigate to next article
    const goToNextArticle = () => {
        if (nextArticle) {
            router.push('/article/' + nextArticle.id)
            // switchSession(nextArticle);
        }
    };

    // Navigate to previous article
    const goToPreviousArticle = () => {
        if (prevArticle) {
            router.push('/article/' + prevArticle.id)
            //  switchSession(prevArticle);
        }
    };

    // Navigate to bookmarked content
    const navigateToBookmark = async (articleId: string, versionNumber: number) => {
        if (!userId) return;

        // Find the session for this article
        const session = sessions.find(s => s.id === articleId);
        if (session) {
            // Switch to the session
            await switchSession(session);

            // Close sidebar
            useSettingsStore.getState().setUIOpenState(null);

            // Use a timeout to ensure article is fully loaded
            setTimeout(() => {
                // Use the new direct navigation function
                goToSpecificVersion(versionNumber);
            }, 500);
        }
    };



    return (
        <div className={`min-h-screen ${theme === "dark"
            ? "bg-gray-900 text-gray-100"
            : theme === "sepia"
                ? "bg-amber-50 text-amber-900"
                : "bg-gray-50 text-gray-800"
            }`}>
            {/* Header */}
            <EbookHeader
                title={currentSession?.title || "New Document"}
                theme={theme}
                toggleTheme={toggleTheme}
                toggleSidebar={toggleSidebar}
                currentSession={currentSession}
            />

            {/* Sidebar */}
            <EbookSidebar
                sessions={sessions}
                currentSession={currentSession}
                onSessionSelect={switchSession}
                onNewArticle={startNewArticle}
                onDeleteSession={deleteSession}
                theme={theme}
                onBookmarkSelect={navigateToBookmark}
                onLoadMoreSessions={loadMoreSessions}
            />

            {/* Loading indicator */}
            {isLoading && (
                <div className={`w-full max-w-4xl mx-auto px-4 py-8 ${theme === "dark" ? "text-gray-100" :
                    theme === "sepia" ? "text-amber-900" :
                        "text-gray-800"
                    }`}>
                    <div className="text-center mb-4">Loading article...</div>
                    <ProgressBar isLoading={true} className="mb-8" />
                </div>
            )}

            {/* Main content */}
            {!isLoading && isFirstGeneration ? (
                <EmptyStateContent theme={theme} />
            ) : !isLoading && currentVersion && (
                <EbookContent
                    version={currentVersion}
                    isLatestVersion={isLatestVersion}
                    isStreaming={isStreaming}
                    theme={theme}
                    onPreviousVersion={goToPreviousVersion}
                    onNextVersion={goToNextVersion}
                    currentVersionNumber={currentVersionNumber}
                    totalVersions={article?.versions.length || 1}
                    articleId={currentSession?.id}
                    articleTitle={currentSession?.title}
                />
            )}

            {/* Footer with input */}
            <EbookFooter
                inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
                isStreaming={isStreaming}
                isFirstGeneration={isFirstGeneration}
                onSubmit={handleSubmit}
                onStop={stopGeneration}
                onNewArticle={startNewArticle}
                prevArticle={prevArticle}
                nextArticle={nextArticle}
                onPrevArticle={goToPreviousArticle}
                onNextArticle={goToNextArticle}
                theme={theme}
            />

            {/* Image slider - collect images from all versions */}
            {article && article.versions && article.versions.length > 0 && (
                <>
                    <ImageSlider
                        initialImages={(article && article.versions.flatMap(v => v.images || []).filter(img => img.imageUrl))}
                    />
                </>
            )}

            {/* Error message */}
            {error && (
                <div className={`fixed bottom-20 left-0 right-0 mx-auto w-max p-2 text-xs sm:text-sm ${theme === "dark" ? "bg-red-900 text-red-100" : "bg-red-100 text-red-800"} rounded`}>
                    {error}
                </div>
            )}

            {/* Settings Dialog */}
            <SettingsDialog />
        </div>
    );
}
