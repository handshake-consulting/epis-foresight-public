"use client"

import { ChatSession } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settingsStore";
import { ArrowLeft, ArrowRight, BookPlus, ChevronDown, ChevronUp, Feather, StopCircle } from "lucide-react";
import { FormEvent, RefObject, useEffect } from "react";

interface EbookFooterProps {
    inputRef: RefObject<HTMLTextAreaElement>;
    isStreaming: boolean;
    isFirstGeneration: boolean;
    onSubmit: (e: FormEvent) => Promise<void>;
    onStop: () => void;
    onNewArticle: () => void;
    prevArticle: ChatSession | null;
    nextArticle: ChatSession | null;
    onPrevArticle: () => void;
    onNextArticle: () => void;
    theme: string;
}

export function EbookFooter({
    inputRef,
    isStreaming,
    isFirstGeneration,
    onSubmit,
    onStop,
    onNewArticle,
    prevArticle,
    nextArticle,
    onPrevArticle,
    onNextArticle,
    theme
}: EbookFooterProps) {
    // Use the store for footer open state
    const { isFooterOpen, toggleFooter } = useSettingsStore();

    // Auto-expand the input area when it's a new document
    useEffect(() => {
        if (isFirstGeneration && !isFooterOpen) {
            toggleFooter();
        }
    }, [isFirstGeneration, toggleFooter]);

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${theme === "dark"
            ? "bg-gray-800 border-t border-gray-700"
            : theme === "sepia"
                ? "bg-amber-100 border-t border-amber-200"
                : "bg-white border-t border-gray-200"
            } shadow-md transition-all duration-300`}>
            {/* Toggle button */}
            <div className="absolute -top-10 right-4">
                <button
                    onClick={toggleFooter}
                    className={`p-2 rounded-t-lg ${theme === "dark"
                        ? "bg-gray-800 text-gray-300 border-t border-l border-r border-gray-700"
                        : theme === "sepia"
                            ? "bg-amber-100 text-amber-900 border-t border-l border-r border-amber-200"
                            : "bg-white text-gray-700 border-t border-l border-r border-gray-200"
                        } shadow-md transition-colors duration-200`}
                    aria-label={isFooterOpen ? "Hide editor" : "Show editor"}
                >
                    {isFooterOpen ? (
                        <ChevronDown className="h-5 w-5" />
                    ) : (
                        <ChevronUp className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Document navigation bar - always visible */}
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onPrevArticle}
                        disabled={!prevArticle}
                        className={`rounded-md ${!prevArticle
                            ? theme === "dark"
                                ? "text-gray-600 cursor-not-allowed"
                                : "text-gray-300 cursor-not-allowed"
                            : theme === "dark"
                                ? "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            } transition-colors duration-200`}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Previous Document</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onNextArticle}
                        disabled={!nextArticle}
                        className={`rounded-md ${!nextArticle
                            ? theme === "dark"
                                ? "text-gray-600 cursor-not-allowed"
                                : "text-gray-300 cursor-not-allowed"
                            : theme === "dark"
                                ? "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            } transition-colors duration-200`}
                    >
                        <span className="hidden sm:inline">Next Document</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onNewArticle}
                    className={`rounded-md ${theme === "dark"
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300"
                        } transition-colors duration-200`}
                >
                    <BookPlus className="h-4 w-4 mr-1" />
                    <span>New Document</span>
                </Button>
            </div>

            {/* Input area - collapsible */}
            <div className={`overflow-hidden transition-all duration-300 ${isFooterOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="container mx-auto px-4 py-3">
                    <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto">
                        <div className="mb-2">
                            <label
                                htmlFor="edit-input"
                                className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                                    } mb-2 italic`}
                            >
                                {isFirstGeneration
                                    ? "What would you like to write about?"
                                    : "How would you like to revise this document?"}
                            </label>
                            <div className={`relative ${theme === "dark"
                                ? "bg-gray-700 border-gray-600 focus-within:border-gray-500 focus-within:ring-gray-500"
                                : "bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500"
                                } rounded-lg border shadow-sm focus-within:ring-1 transition-colors duration-200`}>
                                <textarea
                                    id="edit-input"
                                    ref={inputRef}
                                    placeholder={isFirstGeneration
                                        ? "Enter a topic or question for your new document..."
                                        : "Provide instructions for revising this document..."}
                                    className={`w-full bg-transparent border-none focus:outline-none py-3 px-4 text-sm sm:text-base resize-none min-h-[80px] ${theme === "dark" ? "text-gray-100" : "text-gray-800"
                                        } transition-colors duration-200`}
                                    disabled={isStreaming}
                                />
                                <div className="absolute bottom-3 right-3">
                                    {isStreaming ? (
                                        <Button
                                            type="button"
                                            onClick={onStop}
                                            variant="outline"
                                            size="sm"
                                            className={`rounded-md ${theme === "dark"
                                                ? "bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                                                } transition-colors duration-200`}
                                        >
                                            <StopCircle className="h-4 w-4 mr-1" />
                                            Stop Writing
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            variant="default"
                                            size="sm"
                                            className={`rounded-md ${theme === "dark"
                                                ? "bg-blue-600 hover:bg-blue-700 text-white border-none"
                                                : "bg-blue-500 hover:bg-blue-600 text-white border-none"
                                                } transition-colors duration-200`}
                                        >
                                            <Feather className="h-4 w-4 mr-1" />
                                            {isFirstGeneration ? "Begin Writing" : "Continue Writing"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
