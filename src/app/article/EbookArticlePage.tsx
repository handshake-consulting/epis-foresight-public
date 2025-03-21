"use client"

import { ImageSlider, WelcomeModal } from "@/components/article";
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
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Custom hook to fetch a specific article session
const useArticleSession = (sessionId: string | undefined, userId: string | null) => {
    return useQuery({
        queryKey: ['articleSession', sessionId, userId],
        queryFn: async () => {
            if (!sessionId || !userId) return null;

            const supabase = createClient();
            const { data, error } = await supabase
                .from("chat_sessions")
                .select("*")
                .eq("id", sessionId)
                .eq("user_id", userId)
                .single();

            if (error) {
                console.error("Error loading specific session:", error);
                return null;
            }

            return data as ChatSession;
        },
        enabled: !!sessionId && !!userId,
    });
};

export default function EbookArticlePage({
    initialSessionId
}: {
    initialSessionId?: string;
}) {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // State
    const [userId, setUserId] = useState<string | null>(null);
    const [theme, setTheme] = useState("light");
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [nextArticle, setNextArticle] = useState<ChatSession | null>(null);
    const [prevArticle, setPrevArticle] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreSessions, setHasMoreSessions] = useState(true);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    const PAGE_SIZE = 10; // Number of sessions to load per page

    // URL parameters
    const isNewArticle = searchParams.get("new") === "true";
    const versionParam = searchParams.get("version");

    // Settings from store
    const { settings, setSettings, markWelcomeModalAsSeen, toggleSidebar, toggleImageSlider } = useSettingsStore();

    // Use the auth check hook to verify authentication on the client side
    useAuthCheck({ refreshInterval: 120000 });

    // Fetch sessions using React Query
    const {
        data: sessionData,
        isLoading: isSessionsLoading,
        refetch: refetchSessions
    } = useSessions(currentPage, PAGE_SIZE);

    // Fetch specific article session if initialSessionId is provided
    const {
        data: specificSession,
        isLoading: isSpecificSessionLoading
    } = useArticleSession(initialSessionId, userId);

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
            onFinish: () => {
                createQueryString('new', 'false');
            },
        }
    });

    // Initialize theme from settings
    useEffect(() => {
        setTheme(settings.theme === 'sepia' ? 'sepia' : settings.theme);
    }, [settings.theme]);

    // Check if we should show the welcome modal
    useEffect(() => {
        if (!settings.hasSeenWelcomeModal) {
            setShowWelcomeModal(true);
        }
    }, [settings.hasSeenWelcomeModal]);

    // Handle closing the welcome modal
    const handleCloseWelcomeModal = () => {
        setShowWelcomeModal(false);
        markWelcomeModalAsSeen();
    };

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

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

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

    // Initialize user and handle initial article loading
    useEffect(() => {
        const initializeUser = async () => {
            const { user } = await getCurrentAuthState();
            if (user) {
                setUserId(user.uid);
            }
        };

        initializeUser();
    }, []);

    // Handle new article creation
    useEffect(() => {
        if (userId && isNewArticle) {
            startNewArticle();
        }
    }, [userId, isNewArticle]);

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

    // Handle specific session loading when initialSessionId is provided
    useEffect(() => {
        const loadSpecificArticle = async () => {
            if (!userId || !specificSession || isNewArticle) return;

            setIsLoading(true);
            setCurrentSession(specificSession);

            // Find position in session list for navigation
            if (sessionData && sessionData.length > 0) {
                const currentSessionIndex = sessionData.findIndex(s => s.id === specificSession.id);

                if (currentSessionIndex !== -1) {
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
                }
            }

            // Load the article content
            await loadArticleSession(specificSession.id, userId);

            // Mark this article as last read
            localStorage.setItem("lastReadArticle", specificSession.id);

            // Check if there are more sessions
            const supabase = createClient();
            const { count } = await supabase
                .from("chat_sessions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("type", "article");

            setHasMoreSessions(count !== null && count > currentPage * PAGE_SIZE);
            setIsLoading(false);
        };
        console.log('loadSpecificArticle');
        loadSpecificArticle();
    }, [userId, specificSession, sessionData, loadArticleSession, isNewArticle, currentPage]);

    // Handle default article loading when no initialSessionId is provided
    useEffect(() => {
        const loadDefaultArticle = async () => {
            if (!userId || isNewArticle || initialSessionId || !sessionData || isSessionsLoading) return;

            if (sessionData.length > 0) {
                // Redirect to the first article
                router.push(`/article/${sessionData[0].id}`);
            } else {
                // No articles yet, start a new one
                startNewArticle();
            }
        };
        console.log('loadDefaultArticle');

        loadDefaultArticle();
    }, [userId, sessionData, isSessionsLoading, isNewArticle, initialSessionId, router, startNewArticle]);

    // Handle version parameter from URL
    useEffect(() => {
        if (versionParam && article) {
            const version = parseInt(versionParam, 10);
            if (!isNaN(version) && version >= 1 && version <= article.versions.length) {
                goToSpecificVersion(version);
            }
        }
    }, [article, versionParam, goToSpecificVersion]);

    // Refresh sessions list
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

        console.log("Loading more sessions, current page:", currentPage);

        // Increment the page to trigger React Query to fetch the next page
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);

        // We'll determine if there are more sessions based on the data length
        const supabase = createClient();
        // Check if there are more sessions
        const { count } = await supabase
            .from("chat_sessions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("type", "article");

        console.log("Total sessions count:", count, "Next page:", nextPage, "PAGE_SIZE:", PAGE_SIZE);

        // Check if there are more sessions to load
        const hasMore = count !== null && count > nextPage * PAGE_SIZE;
        console.log("Has more sessions:", hasMore);

        setHasMoreSessions(hasMore);
        return hasMore;
    }, [userId, currentPage, hasMoreSessions]);

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
        } else if (sessions.length > 0) {
            // If there's no next article (we're at the last one),
            // navigate to the first document in the sessions array (circular navigation)
            router.push('/article/' + sessions[0].id);
        }
    };

    // Navigate to previous article
    const goToPreviousArticle = () => {
        if (prevArticle) {
            router.push('/article/' + prevArticle.id);
        } else if (sessions.length > 0) {
            // If there's no previous article (we're at the first one), 
            // navigate to the last document in the sessions array (circular navigation)
            router.push('/article/' + sessions[sessions.length - 1].id);
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
                title={currentSession?.title || article?.title || "New Document"}
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
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                hasMoreSessions={hasMoreSessions}
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

            {/* Welcome Modal */}
            <WelcomeModal
                isOpen={showWelcomeModal}
                onClose={handleCloseWelcomeModal}
            />
        </div>
    );
}
