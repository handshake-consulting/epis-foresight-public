"use client"

import { ChatSession } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
import { BookMarked, BookPlus, ChevronLeft, FileText, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EbookSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    onSessionSelect: (session: ChatSession) => void;
    onNewArticle: () => void;
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
    theme: string;
    onBookmarkSelect?: (articleId: string, versionNumber: number) => void;
    onLoadMoreSessions?: () => Promise<boolean>; // Returns whether there are more sessions to load
}

export function EbookSidebar({
    isOpen,
    onClose,
    sessions,
    currentSession,
    onSessionSelect,
    onNewArticle,
    onDeleteSession,
    theme,
    onBookmarkSelect,
    onLoadMoreSessions
}: EbookSidebarProps) {
    const [activeTab, setActiveTab] = useState<"toc" | "bookmarks">("toc");
    const { bookmarks, removeBookmark } = useSettingsStore();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreSessions, setHasMoreSessions] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Set up intersection observer for infinite scroll
    useEffect(() => {
        if (!observerTarget.current || !hasMoreSessions || activeTab !== "toc" || !onLoadMoreSessions) return;

        const observer = new IntersectionObserver(
            async (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore && hasMoreSessions) {
                    setIsLoadingMore(true);
                    const hasMore = await onLoadMoreSessions();
                    setHasMoreSessions(hasMore);
                    setIsLoadingMore(false);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(observerTarget.current);

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMoreSessions, isLoadingMore, onLoadMoreSessions, activeTab]);

    return (
        <div className={`fixed inset-0 z-20 ${isOpen ? "block" : "hidden"}`}>
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/30 transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Sidebar */}
            <div
                className={`absolute top-0 left-0 bottom-0 w-80 ${theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-gray-100"
                    : theme === "sepia"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-white border-gray-200 text-gray-800"
                    } border-r shadow-xl overflow-hidden transition-transform duration-300 flex flex-col`}
            >
                {/* Header */}
                <div className={`p-4 ${theme === "dark"
                    ? "bg-gray-900"
                    : theme === "sepia"
                        ? "bg-amber-100"
                        : "bg-gray-50"
                    } border-b ${theme === "dark"
                        ? "border-gray-700"
                        : theme === "sepia"
                            ? "border-amber-200"
                            : "border-gray-200"
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"
                            }`}>
                            Document Library
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-1 rounded-md ${theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-200"
                                } transition-colors`}
                            aria-label="Close sidebar"
                        >
                            <ChevronLeft className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                                }`} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b mb-4 pb-1">
                        <button
                            onClick={() => setActiveTab("toc")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-t-md transition-colors ${activeTab === "toc"
                                ? theme === "dark"
                                    ? "bg-gray-800 text-white border-b-2 border-blue-500"
                                    : "bg-white text-gray-900 border-b-2 border-blue-500"
                                : theme === "dark"
                                    ? "text-gray-400 hover:text-gray-200"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            <span>Contents</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("bookmarks")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-t-md transition-colors ${activeTab === "bookmarks"
                                ? theme === "dark"
                                    ? "bg-gray-800 text-white border-b-2 border-blue-500"
                                    : "bg-white text-gray-900 border-b-2 border-blue-500"
                                : theme === "dark"
                                    ? "text-gray-400 hover:text-gray-200"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <BookMarked className="h-4 w-4" />
                            <span>Bookmarks</span>
                        </button>
                    </div>

                    <button
                        onClick={onNewArticle}
                        className={`w-full flex items-center gap-2 p-2 ${theme === "dark"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                            } rounded-md text-sm transition-colors`}
                    >
                        <BookPlus className="h-4 w-4" />
                        <span>Create New Document</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-180px)] scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-transparent"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: theme === "dark"
                            ? '#4B5563 transparent'
                            : theme === "sepia"
                                ? '#D97706 transparent'
                                : '#9CA3AF transparent'
                    }}
                >
                    {activeTab === "toc" ? (
                        sessions.length > 0 ? (
                            <div className="space-y-2 max-h-full overflow-y-auto">
                                {sessions.map((session, index) => (
                                    <div
                                        key={session.id}
                                        className={`p-3 rounded-md cursor-pointer ${currentSession?.id === session.id
                                            ? theme === "dark"
                                                ? "bg-gray-700 border border-gray-600"
                                                : "bg-gray-100 border border-gray-200"
                                            : theme === "dark"
                                                ? "hover:bg-gray-700"
                                                : "hover:bg-gray-100"
                                            } transition-colors`}
                                        onClick={() => onSessionSelect(session)}
                                    >
                                        <div className="flex items-center">
                                            <span className={`inline-block w-6 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                                } mr-2`}>
                                                {index + 1}.
                                            </span>
                                            <span className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"
                                                } flex-1 truncate`}>
                                                {session.title}
                                            </span>
                                            {/* <button
                                                onClick={(e) => onDeleteSession(session.id, e)}
                                                className={`ml-2 p-1 rounded-full ${theme === "dark"
                                                        ? "hover:bg-gray-600 text-gray-400 hover:text-gray-200"
                                                        : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                                                    } transition-colors`}
                                                aria-label="Delete document"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button> */}
                                        </div>
                                        <div className={`mt-1 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                            }`}>
                                            {new Date(session.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}

                                {/* Loading indicator and observer target */}
                                {activeTab === "toc" && (
                                    <div
                                        ref={observerTarget}
                                        className="py-4 flex justify-center"
                                    >
                                        {isLoadingMore && (
                                            <div className="flex items-center justify-center">
                                                <Loader2 className={`h-5 w-5 animate-spin ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                                                <span className={`ml-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                                    Loading more...
                                                </span>
                                            </div>
                                        )}
                                        {!isLoadingMore && !hasMoreSessions && sessions.length > 0 && (
                                            <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                                No more documents
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`text-center p-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}>
                                <div className="mb-2">
                                    <FileText className="h-12 w-12 mx-auto opacity-30" />
                                </div>
                                <p>Your library is empty</p>
                                <p className="text-sm mt-2">Create a new document to get started</p>
                            </div>
                        )
                    ) : (
                        bookmarks.length > 0 ? (
                            <div className="space-y-2 max-h-full overflow-y-auto">
                                {bookmarks.map((bookmark, index) => (
                                    <div
                                        key={`${bookmark.articleId}-${bookmark.versionNumber}`}
                                        className={`p-3 rounded-md cursor-pointer ${theme === "dark"
                                            ? "hover:bg-gray-700 border border-gray-700"
                                            : "hover:bg-gray-100 border border-gray-200"
                                            } transition-colors`}
                                        onClick={() => onBookmarkSelect && onBookmarkSelect(bookmark.articleId, bookmark.versionNumber)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <BookMarked className={`h-4 w-4 mr-2 ${theme === "dark" ? "text-blue-400" : "text-blue-500"
                                                    }`} />
                                                <span className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"
                                                    } flex-1 truncate`}>
                                                    {bookmark.title.length > 20 ? bookmark.title.substring(0, 20) + '...' : bookmark.title}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeBookmark(bookmark.articleId, bookmark.versionNumber);
                                                }}
                                                className={`ml-2 p-1 rounded-full ${theme === "dark"
                                                    ? "hover:bg-gray-600 text-gray-400 hover:text-gray-200"
                                                    : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                                                    } transition-colors`}
                                                aria-label="Remove bookmark"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className={`mt-1 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                            }`}>
                                            Version {bookmark.versionNumber} • {new Date(bookmark.timestamp).toLocaleDateString()}
                                        </div>
                                        {bookmark.content && (
                                            <div className={`mt-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                                } line-clamp-2 italic`}>
                                                {bookmark.content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`text-center p-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}>
                                <div className="mb-2">
                                    <BookMarked className="h-12 w-12 mx-auto opacity-30" />
                                </div>
                                <p>No bookmarks yet</p>
                                <p className="text-sm mt-2">Click the bookmark icon on any page to add it here</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
