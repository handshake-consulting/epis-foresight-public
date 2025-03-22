"use client"

import { ImageSlider, WelcomeModal } from "@/components/article";
import { ChatSession } from "@/components/chat/types";
import { EbookContent, EbookFooter, EbookHeader, EbookSidebar, EmptyStateContent } from "@/components/ebook";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useArticle } from "@/hook/use-article";
import { useAuthCheck } from "@/hook/use-auth-check";
import { useSettingsStore } from "@/store/settingsStore";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { createClient } from "@/utils/supabase/clients";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// This hook is no longer needed as we're getting the data from the server

export default function EbookArticlePage({
    initialSessionId,
    sessionList,
    articleData
}: {
    sessionList?: any;
    initialSessionId?: string;
    articleData?: {
        session: any;
        messages: any[];
    } | null;
}) {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    console.log('articleData ', articleData);

    // State
    const [userId, setUserId] = useState<string | null>(null);
    const [theme, setTheme] = useState("light");
    const [sessions, setSessions] = useState<ChatSession[]>(sessionList);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [nextArticle, setNextArticle] = useState<ChatSession | null>(null);
    const [prevArticle, setPrevArticle] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    // URL parameters
    const isNewArticle = searchParams.get("new") === "true";
    const versionParam = searchParams.get("version");

    // Settings from store
    const { settings, setSettings, markWelcomeModalAsSeen, toggleSidebar, toggleImageSlider } = useSettingsStore();

    // Use the auth check hook to verify authentication on the client side
    useAuthCheck({ refreshInterval: 120000 });

    // Use server-provided session list instead of fetching client-side
    const sessionData = sessionList || [];
    const refetchSessions = useCallback(async () => {
        // This is now a no-op as we're using server-fetched data
        // We'll only refresh the page if needed
        if (initialSessionId) {
            router.refresh();
        }
    }, [initialSessionId, router]);

    // Use server-provided specific session
    const specificSession = articleData?.session as ChatSession || null;

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

    // Initialize with server data when component mounts
    useEffect(() => {
        const initializeFromServerData = async () => {
            if (!userId || !specificSession || isNewArticle) return;

            setIsLoading(true);
            setCurrentSession(specificSession);

            // Find position in session list for navigation
            if (sessionData && sessionData.length > 0) {
                const currentSessionIndex = sessionData.findIndex((s: ChatSession) => s.id === specificSession.id);

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

            // If we have article data from the server, use it to initialize the article state
            if (articleData?.messages && articleData.messages.length > 0) {
                // Process the messages to build the article
                await loadArticleSession(specificSession.id, userId);
            }

            // Mark this article as last read
            localStorage.setItem("lastReadArticle", specificSession.id);

            setSessions(prevSessions => {
                const existingIds = new Set(prevSessions.map((s: ChatSession) => s.id));
                if (!existingIds.has(specificSession.id)) {
                    return [...prevSessions, specificSession];
                }
                return prevSessions;
            });

            setIsLoading(false);
        };

        initializeFromServerData();
    }, [userId, specificSession, sessionData, loadArticleSession, isNewArticle, articleData]);

    // Handle default article loading when no initialSessionId is provided
    useEffect(() => {
        const loadDefaultArticle = async () => {
            if (!userId || isNewArticle || initialSessionId || !sessionData) return;

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
    }, [userId, sessionData, isNewArticle, initialSessionId, router, startNewArticle]);

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

        // Explicitly refetch sessions
        await refetchSessions();

        // Update next and previous articles if we have session data
        if (sessionData && currentSession) {
            const currentIndex = sessionData.findIndex((s: ChatSession) => s.id === currentSession.id);
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
        const currentIndex = sessions.findIndex((s: ChatSession) => s.id === session.id);
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
                    const currentIndex = sessions.findIndex((s: ChatSession) => s.id === currentSession?.id);
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
        const session = sessions.find((s: ChatSession) => s.id === articleId);
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
                sessions={sessionData || []}
                currentSession={currentSession}
                onSessionSelect={switchSession}
                onNewArticle={startNewArticle}
                onDeleteSession={deleteSession}
                theme={theme}
                onBookmarkSelect={navigateToBookmark}
                hasMoreSessions={false}
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
