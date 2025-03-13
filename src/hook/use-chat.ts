"use client"

import { ChatMessage, ChatSession, ImageMessage, TextMessage } from "@/components/chat/types"
import { getIdToken } from "@/utils/firebase/client"
import { createClient } from "@/utils/supabase/clients"
import { useCallback, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

export interface StreamData {
    text?: string
    status?: string
    error?: string
}

// For backward compatibility
export interface Message {
    role: "user" | "assistant"
    content: string
}

// Image data structure from QueryNode
export interface ImageData {
    [key: string]: {
        image_name: string;
        storage_type: string;
        url: string;
        uuid: string;
    }
}


export enum EventType {
    BatchDataIntermediate = 'batch_data_intermediate',
    TextBatchIntermediate = 'text_batch_intermediate',
    TextStreamIntermediate = 'text_stream_intermediate',
    BatchDataOutput = 'batch_data_output',
    TextBatchOutput = 'text_batch_output',
    TextStreamOutput = 'text_stream_output',
    End = 'end'
}

export enum LoreNodeOutputTypes {
    HYDE_PROMPT = 'HydePromptNode',
    PROMPT = 'PromptNode',
    BOOL_PROMPT = 'BoolPromptNode',
    DEFAULT_RESPONSE = 'DefaultResponseNode',
    QUERY = 'QueryNode',
    ROUTER = 'RouterNode',
    REACT = 'ReactNode',
    CONDITIONAL = 'ConditionalNode',
    SEARCH = 'SearchNode',
}

interface EventMetadata {
    timestamp: string;
}

export interface StreamEvent<T = any> {
    event_type: EventType;
    event_data: T | null;
    metadata: EventMetadata;
}

export interface ChatRequest {
    user: string;
    session: string;
    query: string;
}

interface ChatStreamCallbacks {
    graphId?: string;
    onTextStream?: (text: string) => void;
    onBatchData?: (data: any) => void;
    onTextBatch?: (data: any) => void;
    onData?: (data: StreamData) => void;
    onEnd?: () => void;
    onFinish?: () => void;
    onError?: (error: Error) => void;
    onSystemMessage?: (text: string) => void;
    onEvent?: (event: StreamEvent) => void;
}

export interface ChatStreamOptions {
    callbacks?: ChatStreamCallbacks
    initialMessages?: Message[]
}

const getOrCreateSession = async (userId: string, sessionId?: string): Promise<string> => {
    try {
        const supabase = createClient();

        // If sessionId is provided and is a valid UUID, verify it exists and belongs to the user
        if (sessionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
            const { data: existingSession } = await supabase
                .from('chat_sessions')
                .select('id')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .single();

            if (existingSession) {
                return existingSession.id; // Return the UUID from the database
            }
        }

        // Create new session
        const { data: newSession, error } = await supabase
            .from('chat_sessions')
            .insert({
                user_id: userId,
                title: 'New Chat',
                is_active: true
            })
            .select('id')
            .single();

        if (error) {
            throw error;
        }

        if (!newSession) {
            throw new Error('Failed to create new session');
        }

        return newSession.id;
    } catch (error) {
        console.error('Error in getOrCreateSession:', error);
        throw error;
    }
};

// Store text message in Supabase
const storeMessageInSupabase = async (
    userId: string,
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    onTitleGenerated?: (sessionId: string, title: string) => void,
    onSessionsUpdate?: () => void
) => {
    try {
        const supabase = createClient();

        // Ensure we have a valid session
        const actualSessionId = await getOrCreateSession(userId, sessionId);

        // Store the message
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: userId,
                session_id: actualSessionId,
                role: role,
                content: content
            });

        if (error) {
            console.error('Error storing message in Supabase:', error);
        }

        // If this is the first user message, update the session title using Claude Haliku
        if (role === 'user') {
            // Check if this is the first message for this session
            const { data: existingMessages } = await supabase
                .from('chat_messages')
                .select('id')
                .eq('session_id', actualSessionId)
                .limit(2);

            // If this is the first message (only 1 message in the session, which is the one we just added)
            if (existingMessages?.length === 1) {
                try {
                    // Get Firebase ID token for authentication
                    const token = await getIdToken();

                    // Call our API to generate a title using Claude Haliku
                    const response = await fetch('/api/generate-title', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ message: content })
                    });

                    let title = '';
                    if (response.ok) {
                        const data = await response.json();
                        title = data.title;
                        console.log('Generated title:', title);

                        // Update the session title with the generated title
                        await supabase
                            .from('chat_sessions')
                            .update({ title })
                            .eq('id', actualSessionId);

                        // Call the callbacks to update the frontend
                        if (onTitleGenerated) {
                            onTitleGenerated(actualSessionId, title);
                        }
                        if (onSessionsUpdate) {
                            onSessionsUpdate();
                        }
                    } else {
                        // Fallback to truncated content if API call fails
                        title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
                        await supabase
                            .from('chat_sessions')
                            .update({ title })
                            .eq('id', actualSessionId);

                        // Call the callbacks to update the frontend
                        if (onTitleGenerated) {
                            onTitleGenerated(actualSessionId, title);
                        }
                        if (onSessionsUpdate) {
                            onSessionsUpdate();
                        }
                    }
                } catch (error) {
                    console.error('Error generating title:', error);
                    // Fallback to truncated content if API call fails
                    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
                    await supabase
                        .from('chat_sessions')
                        .update({ title })
                        .eq('id', actualSessionId);

                    // Call the callbacks to update the frontend
                    if (onTitleGenerated) {
                        onTitleGenerated(actualSessionId, title);
                    }
                    if (onSessionsUpdate) {
                        onSessionsUpdate();
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in storeMessageInSupabase:', error);
    }
};

// Store image message in Supabase
const storeImageMessageInSupabase = async (
    userId: string,
    sessionId: string,
    imageId: string,
    storageType: string
) => {
    try {
        const supabase = createClient();

        // Ensure we have a valid session
        const actualSessionId = await getOrCreateSession(userId, sessionId);

        // Store the image message with a special format to distinguish it from text messages
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: userId,
                session_id: actualSessionId,
                role: "assistant",
                content: JSON.stringify({ message_type: "image", imageId, storageType })
            });

        if (error) {
            console.error('Error storing image message in Supabase:', error);
        }
    } catch (error) {
        console.error('Error in storeImageMessageInSupabase:', error);
    }
};

export function useChatStream(options: ChatStreamOptions = {}) {
    const { callbacks, initialMessages = [] } = options
    const [messages, setMessages] = useState<Message[]>([])
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)

    // Function to add a message without sending to API
    const addStoredMessage = useCallback((role: "user" | "assistant", content: string) => {
        setMessages(prev => [...prev, { role, content }])

        // Also add to new message format
        setChatMessages(prev => [
            ...prev,
            {
                id: uuidv4(),
                sender: role,
                text: content,
                timestamp: new Date()
            } as TextMessage
        ])
    }, [])

    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
    const currentUserIdRef = useRef<string | null>(null)
    const currentSessionIdRef = useRef<string | null>(null)

    const addMessage = useCallback((role: "user" | "assistant", content: string) => {
        setMessages((prev) => [...prev, { role, content }])

        // Also add to new message format
        setChatMessages(prev => [
            ...prev,
            {
                id: uuidv4(),
                sender: role,
                text: content,
                timestamp: new Date()
            } as TextMessage
        ])
    }, [])

    const updateLastMessage = useCallback((content: string) => {
        setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.content = content
            } else {
                newMessages.push({ role: "assistant", content })
            }
            return newMessages
        })

        // Also update in new message format
        setChatMessages((prev) => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage && lastMessage.sender === "assistant" && 'text' in lastMessage) {
                return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, text: content } as TextMessage
                ]
            } else {
                return [
                    ...prev,
                    {
                        id: uuidv4(),
                        sender: "assistant",
                        text: content,
                        timestamp: new Date()
                    } as TextMessage
                ]
            }
        })
    }, [])


    // Process QueryNode data to extract image and file information
    const processQueryNodeData = useCallback((data: any) => {
        if (data.node_type === LoreNodeOutputTypes.QUERY) {
            console.log("Processing QueryNode data:", data);

            // Handle image data
            const imageData = Object.entries(
                Object.keys(data.query_result || {})
                    .filter((key) => key.startsWith("image."))
                    .reduce((acc, key) => {
                        const [, index, field] = key.split(".");
                        if (!acc[index]) {
                            acc[index] = {
                                image_name: "",
                                storage_type: "",
                                url: "",
                                uuid: "",
                            };
                        }
                        acc[index][field] = data.query_result[key][0];
                        return acc;
                    }, {} as Record<string, any>)
            ).map(([, value]) => value);

            // Add image messages
            imageData.forEach((image) => {
                if (image.storage_type === "bucket" && image.uuid) {
                    const newImageMessage = {
                        id: uuidv4(),
                        imageId: image.uuid,
                        storageType: image.storage_type,
                        sender: "assistant",
                        timestamp: new Date(),
                    } as ImageMessage;

                    setChatMessages((prev) => [...prev, newImageMessage]);

                    // Store image message in database
                    if (currentUserIdRef.current && currentSessionIdRef.current) {
                        storeImageMessageInSupabase(
                            currentUserIdRef.current,
                            currentSessionIdRef.current,
                            image.uuid,
                            image.storage_type
                        );
                    }
                }
            });

        }
    }, []);

    const processChatStream = useCallback(async (stream: ReadableStream) => {
        const reader = stream.getReader()
        readerRef.current = reader
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedContent = ''

        try {
            while (true) {
                const { done, value } = await reader.read()

                if (done) {
                    if (buffer.trim()) {
                        try {
                            const event = JSON.parse(buffer.trim()) as StreamEvent
                            console.log('event', event)
                            if (event.event_data?.text) {
                                accumulatedContent += event.event_data.text
                                updateLastMessage(accumulatedContent)
                                callbacks?.onData?.({ text: event.event_data.text })
                            }

                            // Process batch data for images and files
                            if (event.event_type === EventType.BatchDataOutput && event.event_data) {
                                processQueryNodeData(event.event_data);
                                callbacks?.onBatchData?.(event.event_data);
                            }

                            callbacks?.onEvent?.(event)
                        } catch (e) {
                            console.warn('Failed to parse final buffer:', buffer, e)
                        }
                    }
                    callbacks?.onEnd?.()

                    // Store assistant message in Supabase when stream is complete
                    if (accumulatedContent && currentUserIdRef.current && currentSessionIdRef.current) {
                        await storeMessageInSupabase(
                            currentUserIdRef.current,
                            currentSessionIdRef.current,
                            "assistant",
                            accumulatedContent
                        );
                    }

                    callbacks?.onFinish?.()
                    break
                }

                buffer += decoder.decode(value, { stream: true })

                while (true) {
                    const newlineIndex = buffer.indexOf('\n')
                    if (newlineIndex === -1) break

                    const eventJson = buffer.slice(0, newlineIndex).trim()
                    buffer = buffer.slice(newlineIndex + 1)

                    if (eventJson) {
                        try {
                            const event = JSON.parse(eventJson) as StreamEvent
                            if (event.event_data?.text) {
                                accumulatedContent += event.event_data.text
                                updateLastMessage(accumulatedContent)
                                callbacks?.onData?.({ text: event.event_data.text })
                            }

                            // Process batch data for images and files
                            if (event.event_type === EventType.BatchDataOutput && event.event_data) {
                                processQueryNodeData(event.event_data);
                                callbacks?.onBatchData?.(event.event_data);
                            }

                            callbacks?.onEvent?.(event)
                        } catch (e) {
                            console.warn('Failed to parse event:', eventJson, e)
                            continue
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream processing error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Stream processing error'
            setError(errorMessage)
            callbacks?.onError?.(new Error(errorMessage))
            callbacks?.onData?.({ status: "error", error: errorMessage })
        } finally {
            reader.cancel()
            setIsStreaming(false)
        }
    }, [callbacks, updateLastMessage, processQueryNodeData])

    // Callback to update the session title in the frontend
    const handleTitleGenerated = useCallback((sessionId: string, title: string) => {
        // Update the current session title if it matches the session ID
        if (currentSession && currentSession.id === sessionId) {
            setCurrentSession(prev => prev ? { ...prev, title } : null);
        }

        // Also update the session in the sessions list if needed
        // This would be implemented in the parent component that manages the sessions list
    }, [currentSession]);

    const sendMessage = useCallback(async (message: string, sessionId: string, userId: string, onSessionsUpdate?: () => void) => {
        if (!message.trim()) return

        setError(null)
        setIsStreaming(true)
        addMessage("user", message)

        // Store user message in Supabase with title generation callback
        await storeMessageInSupabase(
            userId,
            sessionId,
            "user",
            message,
            handleTitleGenerated,
            onSessionsUpdate
        )

        // Store current user and session IDs for later use in onFinish
        currentUserIdRef.current = userId
        currentSessionIdRef.current = sessionId

        const token = await getIdToken()

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + 'chat_stream', {
                method: 'POST',
                headers: {
                    'firebase-id-token': token!,
                    'client-id': process.env.NEXT_PUBLIC_CLIENT_ID!,
                    'graph-id': process.env.NEXT_PUBLIC_GRAPH_ID!,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: message,
                    session: sessionId,
                    user: userId
                }),
            })

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`)
            }

            if (response.body) {
                await processChatStream(response.body)
            } else {
                throw new Error("No response body received")
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to send message"
            setError(errorMessage)
            callbacks?.onError?.(new Error(errorMessage))
            callbacks?.onData?.({ status: "error", error: errorMessage })
        } finally {
            setIsStreaming(false)
            readerRef.current = null
        }
    }, [addMessage, callbacks, processChatStream, processQueryNodeData])

    const stop = useCallback(() => {
        if (readerRef.current) {
            readerRef.current.cancel()
            readerRef.current = null
            setIsStreaming(false)
        }
    }, [])

    const reset = useCallback(() => {
        setMessages([])
        setChatMessages([])
        setError(null)
        setIsStreaming(false)
        stop()
    }, [stop])

    return {
        messages,
        chatMessages,
        setChatMessages,
        isStreaming,
        error,
        sendMessage,
        stop,
        reset,
        startChatStream: sendMessage,
        cancelStream: stop,
        addStoredMessage,
        currentSession,
        setCurrentSession
    }
}
