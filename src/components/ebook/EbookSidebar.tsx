"use client"

import { ChatSession } from "@/components/chat/types";
import { BookMarked, BookPlus, ChevronLeft, FileText } from "lucide-react";
import { useState } from "react";

interface EbookSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    onSessionSelect: (session: ChatSession) => void;
    onNewArticle: () => void;
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
    theme: string;
}

export function EbookSidebar({
    isOpen,
    onClose,
    sessions,
    currentSession,
    onSessionSelect,
    onNewArticle,
    onDeleteSession,
    theme
}: EbookSidebarProps) {
    const [activeTab, setActiveTab] = useState<"toc" | "bookmarks">("toc");

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
                    : "bg-white border-gray-200 text-gray-800"
                    } border-r shadow-xl overflow-hidden transition-transform duration-300 flex flex-col`}
            >
                {/* Header */}
                <div className={`p-4 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                    } border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"
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
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "toc" ? (
                        sessions.length > 0 ? (
                            <div className="space-y-2">
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
                        <div className={`text-center p-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}>
                            <div className="mb-2">
                                <BookMarked className="h-12 w-12 mx-auto opacity-30" />
                            </div>
                            <p>No bookmarks yet</p>
                            <p className="text-sm mt-2">Bookmarking feature coming soon</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
