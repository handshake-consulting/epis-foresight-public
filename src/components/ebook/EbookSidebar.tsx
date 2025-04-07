"use client"

import { ChatSession } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
import {
    BookMarked,
    BookPlus,
    ChevronLeft,
    FileText,
    Search,
    Trash2,
    X
} from "lucide-react";
import { useState } from "react";

interface EbookSidebarProps {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    onSessionSelect: (session: ChatSession) => void;
    onNewArticle: () => void;
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
    theme: string;
    onBookmarkSelect?: (articleId: string, versionNumber: number) => void;
    hasMoreSessions: boolean;
}

export function EbookSidebar({
    sessions,
    currentSession,
    onSessionSelect,
    onNewArticle,
    onDeleteSession,
    theme,
    onBookmarkSelect,
    hasMoreSessions
}: EbookSidebarProps) {
    const { isSidebarOpen, toggleSidebar } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<"toc" | "bookmarks">("toc");
    const { bookmarks, removeBookmark } = useSettingsStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Filter sessions based on search query
    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`fixed inset-0 z-60 ${isSidebarOpen ? "block" : "hidden"}`}>
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/30 transition-opacity duration-300"
                onClick={toggleSidebar}
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
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`p-1 rounded-md mr-2 ${theme === "dark"
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-200"
                                    } transition-colors`}
                                aria-label="Search documents"
                            >
                                <Search className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                                    }`} />
                            </button>
                            <button
                                onClick={toggleSidebar}
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
                    </div>

                    {/* Search input */}
                    {isSearchOpen && (
                        <div className="mb-4">
                            <div className={`flex items-center p-2 rounded-md ${theme === "dark"
                                ? "bg-gray-700"
                                : theme === "sepia"
                                    ? "bg-amber-100"
                                    : "bg-gray-100"
                                }`}>
                                <Search className={`h-4 w-4 mr-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`} />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full bg-transparent border-none focus:outline-none ${theme === "dark"
                                        ? "text-white placeholder-gray-400"
                                        : "text-gray-800 placeholder-gray-500"
                                        }`}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className={`p-1 rounded-full ${theme === "dark"
                                            ? "hover:bg-gray-600 text-gray-400"
                                            : "hover:bg-gray-200 text-gray-500"
                                            }`}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

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
                <div
                    className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-180px)] scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-transparent"
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
                        filteredSessions.length > 0 ? (
                            <div className="space-y-2 max-h-full overflow-y-auto">
                                {filteredSessions.map((session, index) => (
                                    <button
                                        // href={`/article/${session.id}`}
                                        key={session.id}
                                        // prefetch={false}
                                        onClick={() => onSessionSelect(session)}
                                        className="block"
                                    >
                                        <div
                                            className={`p-3 rounded-md cursor-pointer ${currentSession?.id === session.id
                                                ? theme === "dark"
                                                    ? "bg-gray-700 border border-gray-600"
                                                    : "bg-gray-100 border border-gray-200"
                                                : theme === "dark"
                                                    ? "hover:bg-gray-700"
                                                    : "hover:bg-gray-100"
                                                } transition-colors`}
                                        >
                                            <div className="flex items-center">
                                                <span className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"
                                                    } flex-1 truncate`}>
                                                    {session.title}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
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
