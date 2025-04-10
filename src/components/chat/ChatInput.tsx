"use client"

import { Button } from "@/components/ui/button";
import { Search, Send, StopCircle } from "lucide-react";
import { FormEvent, RefObject } from "react";

interface ChatInputProps {
    inputRef: RefObject<HTMLTextAreaElement>;
    isStreaming: boolean;
    onSubmit: (e: FormEvent) => Promise<void>;
    onStop: () => void;
    onNewChat: () => void;
    messages?: any[];
}

export function ChatInput({
    inputRef,
    isStreaming,
    onSubmit,
    onStop,
    onNewChat,
    messages = []
}: ChatInputProps) {
    return (
        <form onSubmit={onSubmit} className="w-full max-w-full px-2 sm:px-4">
            {/* Message input styled to match the image */}
            <div className="relative bg-gray-100 rounded-2xl">
                <div className="flex items-center p-2">
                    {/* Left side icons - hidden on small screens */}
                    <div className="hidden sm:flex items-center space-x-2 text-gray-500">
                        <button type="button" className="p-1 rounded hover:bg-gray-200">
                            <Search className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Input field */}
                    <div className="flex-1 mx-2">
                        <input
                            ref={inputRef as any}
                            type="text"
                            placeholder="Message Leaders Make the Future: Infinite Edition"
                            className="w-full bg-transparent border-none focus:outline-none py-2 px-1 text-sm sm:text-base"
                            disabled={isStreaming}
                        />
                    </div>

                    {/* Right side icons */}
                    <div className="flex items-center space-x-2 text-gray-500">
                        {isStreaming ? (
                            <button
                                type="button"
                                onClick={onStop}
                                className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-500"
                                aria-label="Stop generating"
                            >
                                <StopCircle className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                                aria-label="Send message"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* New Chat button - shown at the bottom of the page when there are messages */}
            {messages && messages.length > 0 && (
                <div className="flex justify-center mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onNewChat}
                        className="rounded-full text-sm px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                        size="sm"
                    >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        New chat
                    </Button>
                </div>
            )}
        </form>
    );
}
