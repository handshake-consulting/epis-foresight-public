"use client"

import { ImageSlider } from "@/components/article";
import { ChatSession } from "@/components/chat/types";
import { EbookContent, EbookFooter, EbookHeader, EbookSidebar, EmptyStateContent } from "@/components/ebook";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useArticle } from "@/hook/use-article";
import { useAuthCheck } from "@/hook/use-auth-check";
import { useSettingsStore } from "@/store/settingsStore";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { UserProfile } from "@/utils/profile";
import { createClient } from "@/utils/supabase/clients";
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

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
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

    // Callback to handle stream finish and redirect to article page
    const handleStreamFinish = useCallback(() => {
        console.log("Stream finished, redirecting to article page");
        router.push('/article');
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
        sliderOpen,
        toggleSlider,
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

    // Get URL search params to check for new article flag
    const searchParams = useSearchParams();
    const isNewArticle = searchParams.get("new") === "true";


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

                // Load first page of sessions for navigation
                const { data: allSessions, error } = await supabase
                    .from("chat_sessions")
                    .select("*")
                    .eq("user_id", user.uid)
                    .eq("type", "article")
                    .order("updated_at", { ascending: false })
                    .range(0, PAGE_SIZE - 1);

                if (error) {
                    console.error("Error loading sessions:", error);
                    setIsLoading(false);
                    return;
                }

                // Check if there are more sessions
                const { count } = await supabase
                    .from("chat_sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", user.uid)
                    .eq("type", "article");

                setHasMoreSessions(count !== null && count > PAGE_SIZE);
                setCurrentPage(1); // We've loaded the first page

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
                            localStorage.setItem("lastReadArticle", sessionData.id);

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
                        localStorage.setItem("lastReadArticle", allSessions[0].id);
                    } else {
                        // No article sessions yet
                        resetArticle();
                    }
                }
            }
            setIsLoading(false);
        };
        loadUserAndSessions();
    }, [initialSessionId, isNewArticle, loadArticleSession, resetArticle]);

    // Refresh sessions list
    const refreshSessions = useCallback(async () => {
        if (!userId) return;

        const supabase = createClient();

        // Reset pagination and load first page
        setCurrentPage(1);

        const { data } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", userId)
            .eq("type", "article")
            .order("updated_at", { ascending: false })
            .range(0, PAGE_SIZE - 1);

        if (data) {
            setSessions(data);

            // Check if there are more sessions
            const { count } = await supabase
                .from("chat_sessions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("type", "article");

            setHasMoreSessions(count !== null && count > PAGE_SIZE);

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

    // Load more sessions for infinite scroll
    const loadMoreSessions = useCallback(async () => {
        if (!userId || !hasMoreSessions) return false;

        const supabase = createClient();
        const start = currentPage * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", userId)
            .eq("type", "article")
            .order("updated_at", { ascending: false })
            .range(start, end);

        if (error) {
            console.error("Error loading more sessions:", error);
            return false;
        }

        if (data && data.length > 0) {
            // Append new sessions to existing ones
            setSessions(prevSessions => [...prevSessions, ...data]);
            setCurrentPage(prevPage => prevPage + 1);

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
                .from("chat_sessions")
                .delete()
                .eq("id", sessionId)
                .eq("user_id", userId);

            if (error) {
                console.error("Error deleting session:", error);
                return;
            }

            // Get updated list of sessions
            const { data: updatedSessions } = await supabase
                .from("chat_sessions")
                .select("*")
                .eq("user_id", userId)
                .eq("type", "article")
                .order("updated_at", { ascending: false });

            if (updatedSessions && updatedSessions.length > 0) {
                setSessions(updatedSessions);

                // If we deleted current session, switch to the most recent one
                if (currentSession?.id === sessionId) {
                    setIsLoading(true);
                    setCurrentSession(updatedSessions[0]);
                    await loadArticleSession(updatedSessions[0].id, userId);
                    setIsLoading(false);

                    // Update next and previous articles
                    setPrevArticle(null);
                    if (updatedSessions.length > 1) {
                        setNextArticle(updatedSessions[1]);
                    } else {
                        setNextArticle(null);
                    }

                    // Mark this article as last read
                    localStorage.setItem("lastReadArticle", updatedSessions[0].id);
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
            console.error("Error in deleteSession:", error);
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

    // Navigate to bookmarked content
    const navigateToBookmark = async (articleId: string, versionNumber: number) => {
        if (!userId) return;

        // Find the session for this article
        const session = sessions.find(s => s.id === articleId);
        if (session) {
            // Switch to the session
            await switchSession(session);

            // Close sidebar
            setSidebarOpen(false);

            // Use a timeout to ensure article is fully loaded
            setTimeout(() => {
                // Use the new direct navigation function
                goToSpecificVersion(versionNumber);
            }, 500);
        }
    };

    // console.log(sessions);

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
                isOpen={sidebarOpen}
                onClose={toggleSidebar}
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
                <ImageSlider
                    images={article.versions.flatMap(v => v.images || []).filter(img => img.imageUrl)}
                    isOpen={sliderOpen}
                    onToggle={toggleSlider}
                />
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
