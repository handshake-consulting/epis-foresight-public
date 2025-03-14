"use client"

import { Article, ArticleVersion, ImageMessage } from "@/components/chat/types";
import { getIdToken } from "@/utils/firebase/client";
import { createClient } from "@/utils/supabase/clients";
import { useCallback, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { EventType, LoreNodeOutputTypes, StreamEvent } from "./use-chat";

interface ArticleStreamOptions {
    callbacks?: {
        onData?: (data: any) => void;
        onError?: (error: Error) => void;
        onFinish?: () => void;
    };
}

export function useArticle(options: ArticleStreamOptions = {}) {
    const { callbacks } = options;

    const [article, setArticle] = useState<Article | null>(null);
    const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(1);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sliderOpen, setSliderOpen] = useState<boolean>(false);

    const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
    const currentUserIdRef = useRef<string | null>(null);
    const currentSessionIdRef = useRef<string | null>(null);

    // Get the current version
    const currentVersion = article?.versions.find(v => v.versionNumber === currentVersionNumber) || null;

    // Check if this is the first generation (no versions yet)
    const isFirstGeneration = !article || article.versions.length === 0;

    // Check if current version is the latest
    const isLatestVersion = currentVersionNumber === article?.versions.length;

    // Toggle image slider
    const toggleSlider = useCallback(() => {
        setSliderOpen(prev => !prev);
    }, []);

    // Navigate to previous version
    const goToPreviousVersion = useCallback(() => {
        if (currentVersionNumber > 1) {
            setCurrentVersionNumber(prev => prev - 1);
        }
    }, [currentVersionNumber]);

    // Navigate to next version
    const goToNextVersion = useCallback(() => {
        if (article && currentVersionNumber < article.versions.length) {
            setCurrentVersionNumber(prev => prev + 1);
        }
    }, [article, currentVersionNumber]);

    // Process QueryNode data to extract image information
    const processQueryNodeData = useCallback((data: any, versionNumber: number) => {
        if (data.node_type === LoreNodeOutputTypes.QUERY) {
            console.log("Processing QueryNode data for article:", data);

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

            // Create image messages
            const newImages: ImageMessage[] = imageData
                .filter(image => image.storage_type === "bucket" && image.uuid)
                .map(image => ({
                    id: uuidv4(),
                    imageId: image.uuid,
                    storageType: image.storage_type,
                    sender: "assistant",
                    timestamp: new Date(),
                    version: versionNumber
                }));

            if (newImages.length > 0) {
                // Update article with new images
                setArticle(prev => {
                    if (!prev) return prev;

                    const updatedVersions = prev.versions.map(v => {
                        if (v.versionNumber === versionNumber) {
                            return {
                                ...v,
                                images: [...(v.images || []), ...newImages]
                            };
                        }
                        return v;
                    });

                    return {
                        ...prev,
                        versions: updatedVersions
                    };
                });

                // Store image messages in database
                if (currentUserIdRef.current && currentSessionIdRef.current) {
                    newImages.forEach(image => {
                        storeImageMessageInSupabase(
                            currentUserIdRef.current!,
                            currentSessionIdRef.current!,
                            image.imageId,
                            image.storageType,
                            versionNumber
                        );
                    });
                }
            }
        }
    }, []);

    // Process the article stream
    const processArticleStream = useCallback(async (stream: ReadableStream, versionNumber: number) => {
        const reader = stream.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (buffer.trim()) {
                        try {
                            const event = JSON.parse(buffer.trim()) as StreamEvent;
                            console.log('event', event);
                            if (event.event_data?.text) {
                                accumulatedContent += event.event_data.text;

                                // Update the current version content
                                setArticle(prev => {
                                    if (!prev) return prev;

                                    const updatedVersions = prev.versions.map(v => {
                                        if (v.versionNumber === versionNumber) {
                                            return {
                                                ...v,
                                                content: accumulatedContent
                                            };
                                        }
                                        return v;
                                    });

                                    return {
                                        ...prev,
                                        versions: updatedVersions
                                    };
                                });

                                callbacks?.onData?.({ text: event.event_data.text });
                            }

                            // Process batch data for images
                            if (event.event_type === EventType.BatchDataOutput && event.event_data) {
                                processQueryNodeData(event.event_data, versionNumber);
                            }
                        } catch (e) {
                            console.warn('Failed to parse final buffer:', buffer, e);
                        }
                    }

                    // Store assistant message in Supabase when stream is complete
                    if (accumulatedContent && currentUserIdRef.current && currentSessionIdRef.current) {
                        await storeMessageInSupabase(
                            currentUserIdRef.current,
                            currentSessionIdRef.current,
                            "assistant",
                            accumulatedContent,
                            versionNumber
                        );
                    }

                    callbacks?.onFinish?.();
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                while (true) {
                    const newlineIndex = buffer.indexOf('\n');
                    if (newlineIndex === -1) break;

                    const eventJson = buffer.slice(0, newlineIndex).trim();
                    buffer = buffer.slice(newlineIndex + 1);

                    if (eventJson) {
                        try {
                            const event = JSON.parse(eventJson) as StreamEvent;
                            if (event.event_data?.text) {
                                accumulatedContent += event.event_data.text;

                                // Update the current version content
                                setArticle(prev => {
                                    if (!prev) return prev;

                                    const updatedVersions = prev.versions.map(v => {
                                        if (v.versionNumber === versionNumber) {
                                            return {
                                                ...v,
                                                content: accumulatedContent
                                            };
                                        }
                                        return v;
                                    });

                                    return {
                                        ...prev,
                                        versions: updatedVersions
                                    };
                                });

                                callbacks?.onData?.({ text: event.event_data.text });
                            }

                            // Process batch data for images
                            if (event.event_type === EventType.BatchDataOutput && event.event_data) {
                                processQueryNodeData(event.event_data, versionNumber);
                            }
                        } catch (e) {
                            console.warn('Failed to parse event:', eventJson, e);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Stream processing error';
            setError(errorMessage);
            callbacks?.onError?.(new Error(errorMessage));
        } finally {
            reader.cancel();
            setIsStreaming(false);
        }
    }, [callbacks, processQueryNodeData]);

    // Store text message in Supabase
    const storeMessageInSupabase = async (
        userId: string,
        sessionId: string,
        role: "user" | "assistant",
        content: string,
        version: number = 1,
        isTopic: boolean = false,
        isEdit: boolean = false
    ) => {
        try {
            const supabase = createClient();

            // Store the message
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    user_id: userId,
                    session_id: sessionId,
                    role: role,
                    content: content,
                    version: version,
                    is_topic: isTopic,
                    is_edit: isEdit
                });

            if (error) {
                console.error('Error storing message in Supabase:', error);
            }

            // If this is a topic message, update the session with the topic
            if (isTopic) {
                await supabase
                    .from('chat_sessions')
                    .update({
                        topic: content,
                        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                        type: 'article'
                    })
                    .eq('id', sessionId);
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
        storageType: string,
        version: number = 1
    ) => {
        try {
            const supabase = createClient();

            // Store the image message with a special format to distinguish it from text messages
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    user_id: userId,
                    session_id: sessionId,
                    role: "assistant",
                    content: JSON.stringify({ message_type: "image", imageId, storageType }),
                    version: version
                });

            if (error) {
                console.error('Error storing image message in Supabase:', error);
            }
        } catch (error) {
            console.error('Error in storeImageMessageInSupabase:', error);
        }
    };

    // Create a new article session
    const createArticleSession = useCallback(async (userId: string) => {
        try {
            const supabase = createClient();

            // Create new session
            const { data: newSession, error } = await supabase
                .from('chat_sessions')
                .insert({
                    user_id: userId,
                    title: 'New Article',
                    type: 'article',
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            if (!newSession) {
                throw new Error('Failed to create new article session');
            }

            // Initialize empty article
            setArticle({
                id: newSession.id,
                title: newSession.title,
                topic: '',
                currentVersion: 0,
                versions: [],
                created_at: newSession.created_at,
                updated_at: newSession.updated_at
            });

            setCurrentVersionNumber(1);
            return newSession.id;
        } catch (error) {
            console.error('Error creating article session:', error);
            throw error;
        }
    }, []);

    // Load an existing article session
    const loadArticleSession = useCallback(async (sessionId: string, userId: string) => {
        try {
            const supabase = createClient();

            // Get session details
            const { data: session, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .single();

            if (sessionError || !session) {
                throw new Error('Failed to load article session');
            }

            // Get all messages for this session
            const { data: messages, error: messagesError } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (messagesError) {
                throw new Error('Failed to load article messages');
            }

            // Process messages to build article versions
            const versions: ArticleVersion[] = [];
            let topic = '';
            let maxVersion = 0;

            // First pass: find topic and max version
            messages.forEach(msg => {
                if (msg.is_topic && msg.role === 'user') {
                    topic = msg.content;
                }

                if (msg.version && msg.version > maxVersion) {
                    maxVersion = msg.version;
                }
            });

            // Second pass: build versions
            for (let v = 1; v <= maxVersion; v++) {
                const versionMessages = messages.filter(msg => msg.version === v);

                // Find edit prompt (if any)
                const editPrompt = versionMessages.find(msg => msg.is_edit && msg.role === 'user')?.content;

                // Find article content
                const contentMsg = versionMessages.find(msg => !msg.is_topic && !msg.is_edit && msg.role === 'assistant');

                if (contentMsg) {
                    // Process image messages
                    const imageMessages: ImageMessage[] = [];

                    versionMessages.forEach(msg => {
                        if (msg.role === 'assistant') {
                            // Check if it's an image message (JSON format)
                            try {
                                if (msg.content.trim().startsWith('{') && msg.content.trim().endsWith('}')) {
                                    const contentData = JSON.parse(msg.content);

                                    if (contentData.message_type === 'image' && contentData.imageId) {
                                        imageMessages.push({
                                            id: msg.id || uuidv4(),
                                            sender: 'assistant',
                                            imageId: contentData.imageId,
                                            storageType: contentData.storageType || 'bucket',
                                            timestamp: new Date(msg.created_at),
                                            version: v
                                        });
                                    }
                                }
                            } catch (e) {
                                // Not a valid JSON, ignore
                            }
                        }
                    });

                    // Add version
                    versions.push({
                        versionNumber: v,
                        content: contentMsg.content,
                        editPrompt,
                        timestamp: new Date(contentMsg.created_at),
                        images: imageMessages
                    });
                }
            }

            // Set article state
            setArticle({
                id: session.id,
                title: session.title,
                topic: topic || session.topic || '',
                currentVersion: versions.length,
                versions,
                created_at: session.created_at,
                updated_at: session.updated_at
            });

            // Set to latest version
            setCurrentVersionNumber(versions.length);

            return session.id;
        } catch (error) {
            console.error('Error loading article session:', error);
            throw error;
        }
    }, []);

    // Generate or update article
    const generateArticle = useCallback(async (
        prompt: string,
        userId: string,
        sessionId?: string,
        isNewArticle: boolean = false
    ) => {
        if (!prompt.trim()) return;

        setError(null);
        setIsStreaming(true);

        try {
            // Store current user and session IDs for later use
            currentUserIdRef.current = userId;

            // Create new session or use existing one
            let actualSessionId: string;
            let nextVersionNumber: number;

            if (isNewArticle || !sessionId) {
                // Create new article session
                actualSessionId = await createArticleSession(userId);
                nextVersionNumber = 1;

                // Store topic
                await storeMessageInSupabase(
                    userId,
                    actualSessionId,
                    "user",
                    prompt,
                    nextVersionNumber,
                    true, // is_topic
                    false // is_edit
                );

                // Update article state with topic and an initial version placeholder
                setArticle(prev => {
                    // Create a placeholder version
                    const initialVersion: ArticleVersion = {
                        versionNumber: nextVersionNumber,
                        content: "Generating...",
                        timestamp: new Date(),
                        images: []
                    };

                    if (!prev) {
                        return {
                            id: actualSessionId,
                            title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
                            topic: prompt,
                            currentVersion: nextVersionNumber,
                            versions: [initialVersion],
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                    }

                    return {
                        ...prev,
                        topic: prompt,
                        versions: [initialVersion]
                    };
                });
            } else {
                // Use existing session
                actualSessionId = sessionId;
                nextVersionNumber = article?.versions.length ? article.versions.length + 1 : 1;

                // Store edit prompt
                await storeMessageInSupabase(
                    userId,
                    actualSessionId,
                    "user",
                    prompt,
                    nextVersionNumber,
                    false, // is_topic
                    true // is_edit
                );

                // Add new version placeholder
                setArticle(prev => {
                    if (!prev) return prev;

                    const newVersion: ArticleVersion = {
                        versionNumber: nextVersionNumber,
                        content: "Generating...",
                        editPrompt: prompt,
                        timestamp: new Date(),
                        images: []
                    };

                    return {
                        ...prev,
                        currentVersion: nextVersionNumber,
                        versions: [...prev.versions, newVersion]
                    };
                });
            }

            // Update current session ID ref
            currentSessionIdRef.current = actualSessionId;

            // Update current version number
            setCurrentVersionNumber(nextVersionNumber);

            // Get Firebase ID token for authentication
            const token = await getIdToken();

            // Call API to generate content
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + 'chat_stream', {
                method: 'POST',
                headers: {
                    'firebase-id-token': token!,
                    'client-id': process.env.NEXT_PUBLIC_CLIENT_ID!,
                    'graph-id': process.env.NEXT_PUBLIC_GRAPH_ID!,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: prompt,
                    session: actualSessionId,
                    user: userId
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            if (response.body) {
                await processArticleStream(response.body, nextVersionNumber);
            } else {
                throw new Error("No response body received");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to generate article";
            setError(errorMessage);
            callbacks?.onError?.(new Error(errorMessage));
        } finally {
            setIsStreaming(false);
            readerRef.current = null;
        }
    }, [article, callbacks, createArticleSession, processArticleStream]);

    // Stop generation
    const stopGeneration = useCallback(() => {
        if (readerRef.current) {
            readerRef.current.cancel();
            readerRef.current = null;
            setIsStreaming(false);
        }
    }, []);

    // Reset article state
    const resetArticle = useCallback(() => {
        setArticle(null);
        setCurrentVersionNumber(1);
        setError(null);
        setIsStreaming(false);
        stopGeneration();
    }, [stopGeneration]);

    return {
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
        generateArticle,
        stopGeneration,
        resetArticle,
        loadArticleSession
    };
}
