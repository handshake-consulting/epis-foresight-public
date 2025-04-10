"use client"

import { ImageSlider, WelcomeModal } from "@/components/article";
import BookLoadingAnimation from "@/components/BookLoadingAnimation";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";

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
    const ref = useRef<LoadingBarRef>(null);

    const pathname = usePathname()
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [loadingdefault, setLoadingDefault] = useState(true)
    // State
    const [userId, setUserId] = useState<string | null>(null);
    const [theme, setTheme] = useState("light");
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    // Add a ref to track the latest session ID from articleGeneration
    const generatedSessionIdRef = useRef<string | null>(null);

    // URL parameters
    const isNewArticle = searchParams.get("new") === "true";
    const versionParam = searchParams.get("version");

    // Settings from store
    const { settings, setSettings, markWelcomeModalAsSeen, toggleSidebar, toggleImageSlider } = useSettingsStore();

    // Use the auth check hook to verify authentication on the client side
    useAuthCheck({ refreshInterval: 120000 });

    // Fetch all sessions using React Query
    const {
        data: sessionData,
        isLoading: isSessionsLoading,
        refetch: refetchSessions
    } = useSessions();

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
            onFinish: async () => {
                // If we have a generated session ID (for new articles), update the URL
                if (generatedSessionIdRef.current) {
                    const sessionId = generatedSessionIdRef.current;
                    const basePath = pathname.split('/').slice(0, -1).join('/') || '/article';

                    // Update URL
                    window.history.pushState(
                        null,
                        '',
                        `${basePath}/${sessionId}`
                    );
                    console.log(`[onFinish] Updated URL with session ID: ${sessionId}`);

                    // Clear the new=true parameter from searchParams since we now have an article ID
                    if (isNewArticle) {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('new');
                        // We don't need to update the URL again, just update the searchParams object 
                        // so future isNewArticle checks will return false
                        console.log(`[onFinish] Cleared 'new' parameter from URL`);
                    }

                    // Clear the ref after use
                    generatedSessionIdRef.current = null;
                }
            },
            onTitleGenerated: async (generatedTitle, sessionid) => {
                document.title = generatedTitle;

                const supabase = createClient();
                await supabase
                    .from('chat_sessions')
                    .update({ title: generatedTitle })
                    .eq('id', sessionid);
            }
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

    // Preload adjacent articles (next and previous)
    const preloadAdjacentArticles = useCallback(async (currentId: string) => {
        if (!userId || !sessionData || sessionData.length <= 1) return;

        // Find the current index in the session list
        const currentIndex = sessionData.findIndex(s => s.id === currentId);
        if (currentIndex === -1) return;

        // Determine prev and next article indices (with circular navigation)
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : sessionData.length - 1;
        const nextIndex = currentIndex < sessionData.length - 1 ? currentIndex + 1 : 0;

        // Load articles in the background without blocking
        const preloadArticles = async () => {
            try {
                // Load next article first (since it's more likely to be accessed)
                await loadArticleSession(sessionData[nextIndex].id, userId, true);
                console.log(`Preloaded next article: ${sessionData[nextIndex].title}`);

                // Then load previous article
                await loadArticleSession(sessionData[prevIndex].id, userId, true);
                console.log(`Preloaded previous article: ${sessionData[prevIndex].title}`);
            } catch (error) {
                // Silent failure for preloading - non-critical operation
                console.log("Background preloading error (non-critical):", error);
            }
        };

        // Start preloading but don't await it - let it run in the background
        preloadArticles();
    }, [userId, sessionData, loadArticleSession]);

    // Start new article
    const startNewArticle = async () => {
        if (!userId) return;

        stopGeneration();
        resetArticle();

        // Clear any existing session
        setCurrentSession(null);
        setLoadingDefault(false);
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
    //  console.log(sessionData);

    // Handle specific session loading when initialSessionId is provided
    useEffect(() => {
        const loadSpecificArticle = async () => {
            if (!userId || !specificSession || isNewArticle) return;

            setIsLoading(true);
            setCurrentSession(specificSession);

            // No need to update nextArticle and prevArticle state variables
            // as we're now calculating them directly in the navigation functions

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

            setSessions(prevSessions => {
                const existingIds = new Set(prevSessions.map(s => s.id));
                const newSessions = [specificSession];
                return [...prevSessions, ...newSessions];
            });

            setIsLoading(false);
            setLoadingDefault(false)
            // Preload adjacent articles in the background after loading the current one
            if (sessionData && sessionData.length > 1) {
                preloadAdjacentArticles(specificSession.id);
            }
        };
        // console.log('loadSpecificArticle');
        loadSpecificArticle();
    }, [userId, specificSession, sessionData, loadArticleSession, isNewArticle, preloadAdjacentArticles]);

    // Switch to a different article session
    const switchSession = async (session: ChatSession) => {
        if (!userId) return;

        // Start loading indicator
        ref.current?.continuousStart();

        // Explicitly set loading state to true
        setIsLoading(true);

        // Store the current session ID for comparison
        const prevSessionId = currentSession?.id;

        // Stop any ongoing generation
        stopGeneration();

        try {
            // Load the article data BEFORE changing the current session
            await loadArticleSession(session.id, userId);

            // Mark this article as last read
            localStorage.setItem("lastReadArticle", session.id);

            // Only after data is loaded, update the current session
            setCurrentSession(session);

            // Update URL without navigating
            const basePath = pathname.split('/').slice(0, -1).join('/') || '/article';
            useSettingsStore.getState().setUIOpenState(null);
            window.history.pushState(
                null,
                '',
                `${basePath}/${session.id}`
            );

            // Preload adjacent articles in the background
            preloadAdjacentArticles(session.id);
        } catch (error) {
            console.error("Error switching session:", error);
            // Don't change current session if loading failed
        } finally {
            // Complete loading indicators
            ref.current?.complete();
            setIsLoading(false);
        }
    };

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

        // No need to update nextArticle and prevArticle state variables
        // as we're now calculating them directly in the navigation functions
    }, [userId, refetchSessions]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        const prompt = inputRef.current?.value;
        if (!prompt) return;

        // For new articles, we need to track the generated session ID
        const originalSessionId = currentSession?.id;
        const wasFirstGeneration = isFirstGeneration;

        // Generate article
        await generateArticle(
            prompt,
            userId,
            currentSession?.id,
            isFirstGeneration
        );

        // If this was a new article generation, the article.id should now be available
        // Store it in our ref so the onFinish callback can use it
        if (wasFirstGeneration && (!originalSessionId || isNewArticle)) {
            // Query for the most recent session to get its ID
            const supabase = createClient();
            const { data } = await supabase
                .from('chat_sessions')
                .select('*')  // Select all fields, not just id
                .eq('user_id', userId)
                .eq('type', 'article')
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                // Store the session ID for URL updating
                generatedSessionIdRef.current = data[0].id;
                console.log(`[handleSubmit] Captured new session ID: ${generatedSessionIdRef.current}`);

                // Important: Update the currentSession state to ensure the app knows
                // we now have an existing article that should be revised, not a new one
                setCurrentSession(data[0] as ChatSession);

                // Force load the article content to ensure isFirstGeneration gets updated
                try {
                    await loadArticleSession(data[0].id, userId);
                    console.log(`[handleSubmit] Loaded article content for new session: ${data[0].id}`);
                } catch (err) {
                    console.error("Error loading new article session:", err);
                }
            }
        }

        // Clear input
        inputRef.current!.value = "";

        // Refresh sessions list after generation
        if (wasFirstGeneration) {
            await refreshSessions();
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

                    // Mark this article as last read
                    localStorage.setItem("lastReadArticle", newCurrentSession.id);
                }
            } else {
                // No more article sessions
                setSessions([]);
                setCurrentSession(null);
                resetArticle();
            }
        } catch (error) {
            console.error("Error in deleteSession:", error);
        }
    };


    // Navigate to next article
    const goToNextArticle = () => {
        // Use sessionData instead of nextArticle state
        if (!sessionData || sessionData.length === 0) return;

        const currentIndex = sessionData.findIndex(s => s.id === currentSession?.id);

        if (currentIndex !== -1) {
            // If not the last session, go to next
            if (currentIndex < sessionData.length - 1) {
                switchSession(sessionData[currentIndex + 1]);
            } else {
                // If last session, go to first (circular navigation)
                switchSession(sessionData[0]);
            }
        } else if (sessionData.length > 0) {
            // Fallback if current session not found
            switchSession(sessionData[0]);
        }


    };

    // Navigate to previous article
    const goToPreviousArticle = () => {
        // Use sessionData instead of prevArticle state
        if (!sessionData || sessionData.length === 0) return;

        const currentIndex = sessionData.findIndex(s => s.id === currentSession?.id);

        if (currentIndex !== -1) {
            // If not the first session, go to previous
            if (currentIndex > 0) {
                switchSession(sessionData[currentIndex - 1]);
            } else {
                // If first session, go to last (circular navigation)
                switchSession(sessionData[sessionData.length - 1]);
            }
        } else if (sessionData.length > 0) {
            // Fallback if current session not found
            switchSession(sessionData[sessionData.length - 1]);
        }
    };

    // Navigate to bookmarked content
    const navigateToBookmark = async (articleId: string, versionNumber: number) => {
        if (!userId) return;
        //  console.log(articleId, versionNumber, 'navigateToBookmark');

        // Find the session for this article
        const session = sessionData && sessionData.find(s => s.id === articleId);
        if (session) {
            console.log(session, 'session');
            // Set the current session

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

    // Handle default article loading when no initialSessionId is provided
    useEffect(() => {
        const loadDefaultArticle = async () => {
            //   console.log('trigger e', sessionData && sessionData[0]);
            if (!userId || !loadingdefault || isNewArticle || initialSessionId || !sessionData || isSessionsLoading) return;

            if (sessionData.length > 0) {
                // console.log('trigger me');

                // Get the most recent article (last item in the array)
                const mostRecentArticle = sessionData[sessionData.length - 1];

                // If no initialSessionId, use switchSession directly instead of router.push
                await switchSession(mostRecentArticle);
                setLoadingDefault(false)
                // Update URL without full navigation
                // router.push(`/article/${sessionData[0].id}`);
            } else {
                // No articles yet, start a new one
                startNewArticle();
            }
        };
        //  console.log('loadDefaultArticle');

        loadDefaultArticle();
    }, [sessionData, loadingdefault, userId, isNewArticle, initialSessionId, isSessionsLoading]);

    // Add keyboard navigation for left/right arrow keys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if streaming is active or user is typing in a text field
            if (
                isStreaming ||
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement ||
                (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable)
            ) {
                return;
            }

            switch (e.key) {
                case "ArrowLeft":
                    goToPreviousArticle();
                    break;
                case "ArrowRight":
                    goToNextArticle();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isStreaming, goToPreviousArticle, goToNextArticle]);

    if (loadingdefault) {
        return <BookLoadingAnimation />;
    }

    return (
        <div className={`min-h-screen ${theme === "dark"
            ? "bg-gray-900 text-gray-100"
            : theme === "sepia"
                ? "bg-amber-50 text-amber-900"
                : "bg-gray-50 text-gray-800"
            }`}>
            <LoadingBar color="#f11946" ref={ref} shadow={true} />
            {/* <button onClick={() => ref.current?.continuousStart()}>
                Start Continuous Loading Bar
            </button> */}
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
                <div className={`fixed top-0 left-0 w-full h-1 z-50`}>
                    <div className="w-full h-full bg-blue-500 animate-pulse"></div>
                </div>
            )}

            {/* Main content */}
            {!isFirstGeneration ? (
                currentVersion ? (
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
                        images={article && article.versions ? article.versions.flatMap(v => v.images || []).filter(img => img.imageUrl) : []}
                    />
                ) : (
                    <div className={`w-full max-w-4xl mx-auto px-4 py-8 ${theme === "dark" ? "text-gray-100" :
                        theme === "sepia" ? "text-amber-900" :
                            "text-gray-800"
                        }`}>
                        <div className="text-center mb-4">Loading article content...</div>
                        <ProgressBar isLoading={true} className="mb-8" />
                    </div>
                )
            ) : (
                <EmptyStateContent theme={theme} />
            )}

            {/* Footer with input */}
            <EbookFooter
                inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
                isStreaming={isStreaming}
                isFirstGeneration={isFirstGeneration}
                onSubmit={handleSubmit}
                onStop={stopGeneration}
                onNewArticle={startNewArticle}
                prevArticle={null} // No longer using state variables for navigation
                nextArticle={null} // No longer using state variables for navigation
                onPrevArticle={goToPreviousArticle}
                onNextArticle={goToNextArticle}
                theme={theme}
                isNewArticle={isNewArticle}
            />

            {/* Desktop Image slider - collect images from all versions */}
            {article && article.versions && article.versions.length > 0 && (
                <>
                    {/* Desktop version with modal */}
                    <div className="hidden md:block">
                        <ImageSlider
                            initialImages={(article && article.versions ? article.versions.flatMap(v => v.images || []).filter(img => img.imageUrl) : [])}
                        />
                    </div>
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
