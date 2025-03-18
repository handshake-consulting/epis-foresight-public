"use client"

import { useFeedBackChat } from "@/hook/use-feedback";
import Image from "next/image";
import { memo, useCallback, useEffect, useState } from "react";
import { useSettingsStore } from "../../store/settingsStore";
import { FeedbackModal } from "./FeedbackModal";
import MarkdownRender from "./MarkdownRender";
import { ChatMessage } from "./types";

// Component to render images - moved outside and memoized
const ImageRenderer = memo(({ imageId }: { imageId: string }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImageUrls = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/images/${imageId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.image_urls && data.image_urls.length > 0) {
                    setImageUrls(data.image_urls);
                } else {
                    throw new Error('No image URLs returned');
                }
            } catch (err) {
                console.error('Error fetching image URLs:', err);
                setError(err instanceof Error ? err.message : 'Failed to load image');
            } finally {
                setLoading(false);
            }
        };

        fetchImageUrls();
    }, [imageId]); // Only re-run if imageId changes

    if (loading) {
        return <div className="w-full h-32 bg-gray-200 animate-pulse rounded"></div>;
    }

    if (error) {
        return <div className="text-red-500 text-sm">{error}</div>;
    }

    return (
        <div className="flex flex-col gap-2">
            {imageUrls.map((url, index) => (
                <Image
                    key={index}
                    src={url}
                    alt={`Chat image ${index + 1}`}
                    className="max-w-full rounded"
                    onError={() => setError('Failed to load image')}
                    loading="lazy"
                    width={400}
                    height={400}
                />
            ))}
        </div>
    );
});

// Add display name for debugging
ImageRenderer.displayName = 'ImageRenderer';

// Loading message component with animated dots
const LoadingMessage = () => {
    return (
        <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" fill="#E6F0FF" />
                    <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" stroke="#4F46E5" strokeWidth="2" />
                </svg>
            </div>
            <div className="max-w-[85%] sm:max-w-[80%] bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 break-words text-sm sm:text-base">
                <div className="flex items-center">
                    <span>Generating message</span>
                    <span className="loading-dots ml-1">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

interface ChatMessagesProps {
    messages: ChatMessage[];
    error: string | null;
    userId?: string | null;
    sessionId?: string | null;
    isStreaming?: boolean;
}

export function ChatMessages({ messages, error, userId, sessionId, isStreaming = false }: ChatMessagesProps) {
    const { settings } = useSettingsStore();
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);

    const { submitFeedback, isLoading } = useFeedBackChat({
        graphId: process.env.NEXT_PUBLIC_GRAPH_ID
    });

    const handleFeedbackClick = useCallback((index: number) => {
        setSelectedMessageIndex(index);
        setFeedbackModalOpen(true);
    }, []);

    const handleFeedbackSubmit = useCallback(async (feedbackText: string, rating: number) => {
        if (selectedMessageIndex === null || !userId || !sessionId) return;

        const assistantMessage = messages[selectedMessageIndex];
        // Find the user message that preceded this assistant message
        let userQuery = "";
        if (selectedMessageIndex > 0) {
            const userMessage = messages[selectedMessageIndex - 1];
            if ('text' in userMessage) {
                userQuery = userMessage.text;
            }
        }

        let assistantResponse = "";
        if ('text' in assistantMessage) {
            assistantResponse = assistantMessage.text;
        }

        try {
            await submitFeedback({
                user: userId,
                session: sessionId,
                query: userQuery,
                response: assistantResponse,
                feedback: feedbackText,
                feedback_value: rating
            });
            setFeedbackModalOpen(false);
        } catch (error) {
            console.error("Error submitting feedback:", error);
        }
    }, [selectedMessageIndex, userId, sessionId, messages, submitFeedback]);

    const renderMessage = useCallback((message: ChatMessage, index: number) => {
        const isUser = message.sender === "user";
        const isAssistant = message.sender === "assistant";
        const isSystem = message.sender === "system";
        const isError = message.sender === "error";

        // Determine message content based on type
        let messageContent;
        if ('text' in message) {
            messageContent = (
                <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? "bg-blue-100 text-blue-900" : isSystem ? "bg-yellow-50 text-yellow-800" : isError ? "bg-red-50 text-red-800" : "bg-gray-100"} rounded-2xl px-3 sm:px-4 py-2 break-words text-sm sm:text-base`}
                    style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}>
                    <MarkdownRender text={message.text} />
                </div>
            );
        } else if ('imageId' in message) {
            // Render image from external API
            messageContent = (
                <div className="max-w-[85%] sm:max-w-[80%] bg-gray-100 rounded-2xl p-2 overflow-hidden">
                    <ImageRenderer imageId={message.imageId} />
                </div>
            );
        }

        return (
            <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
            >
                {isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" fill="#E6F0FF" />
                            <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" stroke="#4F46E5" strokeWidth="2" />
                        </svg>
                    </div>
                )}

                {messageContent}

                {isUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}

                {isAssistant && 'text' in message && (
                    <div className="flex items-center ml-2">
                        <button
                            onClick={() => handleFeedbackClick(index)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                            title="Feedback"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        );
    }, [handleFeedbackClick, settings]);

    return (
        <div className="space-y-4" style={{ fontFamily: settings.fontFamily }}>
            {/* Messages */}
            <div className="space-y-4">
                {messages.map((message, index) => renderMessage(message, index))}

                {/* Show loading message when streaming */}
                {isStreaming && <LoadingMessage />}
            </div>

            {/* Error message */}
            {error && (
                <div className="p-2 text-xs sm:text-sm text-destructive bg-destructive/10 rounded mx-2 sm:mx-4">
                    {error}
                </div>
            )}

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={feedbackModalOpen}
                onClose={() => setFeedbackModalOpen(false)}
                onSubmit={handleFeedbackSubmit}
                isLoading={isLoading}
            />
        </div>
    );
}
