"use client"

import { ImageSlider, WelcomeModal } from "@/components/article";
import { ChatSession } from "@/components/chat/types";
import { EbookContent, EbookFooter, EbookHeader, EbookSidebar, EmptyStateContent } from "@/components/ebook";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useArticle } from "@/hook/use-article";
import { useAuthCheck } from "@/hook/use-auth-check";
import { useSettingsStore } from "@/store/settingsStore";
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

export interface ArticleNav {
    prevId: string | null;
    currentId: string;
    nextId: string | null
};

export interface ArticleSession {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_active: true,
    type: string;
    topic: string;
}

export interface SingleArticle {
    id: string;
    title: string;
    currentVersion: number;
    topic: string;
    versions: {
        versionNumber: number;
        content: string;
        timestamp: string;
        editPrompt?: string | undefined;
        images?: {
            id: string;
            sender: string;
            storageType: string;
            imageUrl: string | undefined;
            timestamp: string;
            version: number
        }[]
    }[];
    created_at: string;
    updated_at: string;
};

export default function EbookArticlePage({
    initialSessionId,
    initialSession,
    initialArticle,
    articlenav
}: {
    articlenav: ArticleNav
    initialSessionId?: string;
    initialSession: ArticleSession[]
    initialArticle: SingleArticle

}) {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // State
    const [userId, setUserId] = useState<string | null>(null);
    const [theme, setTheme] = useState("light");
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

    // Use the article hook for client-side functionality
    const {
        article: clientArticle,
        currentVersion: clientCurrentVersion,
        currentVersionNumber,
        isStreaming,
        error,
        isFirstGeneration: clientIsFirstGeneration,
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

    // Use server-provided data or client-side state
    const article = clientArticle || initialArticle;

    // Convert server timestamp (string) to Date for compatibility with ArticleVersion
    const currentVersion = clientCurrentVersion || (initialArticle?.versions.length ? {
        ...initialArticle.versions[initialArticle.versions.length - 1],
        timestamp: new Date(initialArticle.versions[initialArticle.versions.length - 1].timestamp),
        images: initialArticle.versions[initialArticle.versions.length - 1].images?.map(img => ({
            id: img.id,
            imageId: img.id, // Add imageId property required by ImageMessage
            timestamp: new Date(img.timestamp), // Convert string timestamp to Date
            sender: "assistant" as "assistant", // Force the correct type
            storageType: img.storageType,
            imageUrl: img.imageUrl,
            version: img.version
        }))
    } : null);

    const isFirstGeneration = clientIsFirstGeneration && !initialArticle;

    // Initialize theme and welcome modal on client side
    useEffect(() => {
        setTheme(settings.theme === 'sepia' ? 'sepia' : settings.theme);

        if (!settings.hasSeenWelcomeModal) {
            setShowWelcomeModal(true);
        }
    }, [settings.theme, settings.hasSeenWelcomeModal]);

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
    // useEffect(() => {
    //     const initializeUser = async () => {
    //         const { user } = await getCurrentAuthState();
    //         if (user) {
    //             setUserId(user.uid);
    //         }
    //     };

    //     initializeUser();
    // }, []);

    // Handle new article creation and version parameter from URL
    useEffect(() => {
        // Handle new article creation
        if (userId && isNewArticle) {
            startNewArticle();
        }

        // Handle version parameter from URL
        if (versionParam && article) {
            const version = parseInt(versionParam, 10);
            if (!isNaN(version) && version >= 1 && version <= article.versions.length) {
                goToSpecificVersion(version);
            }
        }
    }, [userId, isNewArticle, article, versionParam, goToSpecificVersion, startNewArticle]);

    // Convert ArticleSession[] to ChatSession[] for type compatibility
    const convertedSessions = initialSession.map(session => ({
        ...session,
        type: session.type as "article" | "chat" | undefined
    })) as ChatSession[];

    // Set current session from initialSessionId and initialSession
    useEffect(() => {
        if (initialSessionId && initialSession && initialSession.length > 0) {
            const session = initialSession.find(s => s.id === initialSessionId);
            if (session) {
                // Convert ArticleSession to ChatSession
                const chatSession: ChatSession = {
                    ...session,
                    type: session.type as "article" | "chat" | undefined
                };

                setCurrentSession(chatSession);

                // Find position in session list for navigation
                const currentSessionIndex = initialSession.findIndex(s => s.id === initialSessionId);

                if (currentSessionIndex > 0) {
                    const prevSession = initialSession[currentSessionIndex - 1];
                    setPrevArticle({
                        ...prevSession,
                        type: prevSession.type as "article" | "chat" | undefined
                    } as ChatSession);
                } else {
                    setPrevArticle(null);
                }

                if (currentSessionIndex < initialSession.length - 1) {
                    const nextSession = initialSession[currentSessionIndex + 1];
                    setNextArticle({
                        ...nextSession,
                        type: nextSession.type as "article" | "chat" | undefined
                    } as ChatSession);
                } else {
                    setNextArticle(null);
                }

                // Mark this article as last read
                if (typeof window !== 'undefined') {
                    localStorage.setItem("lastReadArticle", initialSessionId);
                }
            }
        }
    }, [initialSessionId, initialSession]);

    // Refresh sessions list
    const refreshSessions = useCallback(async () => {
        if (!userId) return;

        // Update next and previous articles if we have session data
        if (initialSession && currentSession) {
            const currentIndex = initialSession.findIndex(s => s.id === currentSession.id);
            if (currentIndex > 0) {
                const prevSession = initialSession[currentIndex - 1];
                setPrevArticle({
                    ...prevSession,
                    type: prevSession.type as "article" | "chat" | undefined
                } as ChatSession);
            } else {
                setPrevArticle(null);
            }

            if (currentIndex < initialSession.length - 1) {
                const nextSession = initialSession[currentIndex + 1];
                setNextArticle({
                    ...nextSession,
                    type: nextSession.type as "article" | "chat" | undefined
                } as ChatSession);
            } else {
                setNextArticle(null);
            }
        }
    }, [userId, currentSession, initialSession]);

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
        const currentIndex = initialSession.findIndex(s => s.id === session.id);
        if (currentIndex > 0) {
            const prevSession = initialSession[currentIndex - 1];
            setPrevArticle({
                ...prevSession,
                type: prevSession.type as "article" | "chat" | undefined
            } as ChatSession);
        } else {
            setPrevArticle(null);
        }

        if (currentIndex < initialSession.length - 1) {
            const nextSession = initialSession[currentIndex + 1];
            setNextArticle({
                ...nextSession,
                type: nextSession.type as "article" | "chat" | undefined
            } as ChatSession);
        } else {
            setNextArticle(null);
        }

        // Load the article data
        await loadArticleSession(session.id, userId);

        // Mark this article as last read
        localStorage.setItem("lastReadArticle", session.id);

        setIsLoading(false);

        // Close sidebar after selection on mobile
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
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

            // After deletion, redirect to another article or home
            if (currentSession?.id === sessionId) {
                // If we deleted the current session, find another one to navigate to
                if (initialSession.length > 1) {
                    // Find the first session that's not the one we just deleted
                    const newSession = initialSession.find(s => s.id !== sessionId);
                    if (newSession) {
                        router.push(`/article/${newSession.id}`);
                        return;
                    }
                }

                // If no other sessions or can't find one, go to home
                router.push('/');
            } else {
                // If we deleted a different session, just refresh the page
                router.refresh();
            }
        } catch (error) {
            console.error("Error in deleteSession:", error);
        }
    };

    // Navigate to next article using articlenav
    const goToNextArticle = () => {
        if (articlenav.nextId) {
            router.push('/article/' + articlenav.nextId);
        } else if (articlenav.prevId) {
            // If there's no next article, go to the previous one (circular navigation)
            router.push('/article/' + articlenav.prevId);
        } else if (initialSession.length > 0) {
            // Fallback to the first document in the sessions array
            router.push('/article/' + initialSession[0].id);
        }
    };

    // useEffect(() => {
    //     // Prefetch the dashboard page
    //     router.prefetch('/article/' + (articlenav.nextId || articlenav.prevId))
    //     // router.prefetch('/article/' + articlenav.prevId)
    // }, [router])

    // Navigate to previous article using articlenav
    const goToPreviousArticle = () => {
        if (articlenav.prevId) {
            router.push('/article/' + articlenav.prevId);
        } else if (articlenav.nextId) {
            // If there's no previous article, go to the next one (circular navigation)
            router.push('/article/' + articlenav.nextId);
        } else if (initialSession.length > 0) {
            // Fallback to the last document in the sessions array
            router.push('/article/' + initialSession[initialSession.length - 1].id);
        }
    };



    // Navigate to bookmarked content
    const navigateToBookmark = async (articleId: string, versionNumber: number) => {
        if (!userId) return;

        // Find the session for this article
        const session = initialSession.find(s => s.id === articleId);
        if (session) {
            // Convert to ChatSession and switch
            const chatSession: ChatSession = {
                ...session,
                type: session.type as "article" | "chat" | undefined
            };
            await switchSession(chatSession);

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
                title={initialArticle?.title || currentSession?.title || article?.title || "New Document"}
                theme={theme}
                toggleTheme={toggleTheme}
                toggleSidebar={toggleSidebar}
                currentSession={currentSession}
            />

            {/* Sidebar */}
            <EbookSidebar
                sessions={convertedSessions}
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
            {isFirstGeneration ? (
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
                    articleTitle={initialArticle?.title || currentSession?.title}
                    images={article && article.versions ? article.versions.flatMap(v => {
                        // Convert images to proper ImageMessage type with filtering
                        return (v.images || [])
                            .filter(img => !!img.imageUrl) // Filter before mapping
                            .map(img => ({
                                id: img.id || Math.random().toString(),
                                imageId: img.id, // Use id as imageId
                                timestamp: img.timestamp instanceof Date ? img.timestamp : new Date(img.timestamp),
                                sender: "assistant" as "assistant", // Force the correct type
                                storageType: img.storageType,
                                imageUrl: img.imageUrl,
                                version: img.version
                            }));
                    }) : []}
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
                articlenav={articlenav}
            />

            {/* Desktop Image slider - collect images from all versions */}
            {article && article.versions && article.versions.length > 0 && (
                <>
                    {/* Desktop version with modal */}
                    <div className="hidden md:block">
                        <ImageSlider
                            initialImages={(article && article.versions ? article.versions.flatMap(v => {
                                // Convert images to proper ImageMessage type with filtering
                                return (v.images || [])
                                    .filter(img => !!img.imageUrl) // Filter before mapping
                                    .map(img => ({
                                        id: img.id || Math.random().toString(),
                                        imageId: img.id, // Use id as imageId
                                        timestamp: img.timestamp instanceof Date ? img.timestamp : new Date(img.timestamp),
                                        sender: "assistant" as "assistant", // Force the correct type
                                        storageType: img.storageType,
                                        imageUrl: img.imageUrl,
                                        version: img.version
                                    }));
                            }) : [])}
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
