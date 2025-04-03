"use client"

import { Article, ArticleVersion, ImageMessage } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
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

    const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
    const currentUserIdRef = useRef<string | null>(null);
    const currentSessionIdRef = useRef<string | null>(null);

    // Get the current version
    const currentVersion = article?.versions.find(v => v.versionNumber === currentVersionNumber) || null;

    // Check if this is the first generation (no versions yet)
    const isFirstGeneration = !article || article.versions.length === 0;

    // Check if current version is the latest
    const isLatestVersion = currentVersionNumber === article?.versions.length;

    // Get the image slider toggle function from the store
    const { toggleImageSlider } = useSettingsStore();

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

    // Navigate to a specific version
    const goToSpecificVersion = useCallback((versionNumber: number) => {
        if (article && versionNumber >= 1 && versionNumber <= article.versions.length) {
            setCurrentVersionNumber(versionNumber);
        }
    }, [article]);

    // Handle UI changes with loading messages
    const handleUiChanges = async (content: string, versionNumber: number) => {
        try {
            // Initial loading header
            setArticle(prev => {
                if (!prev) return prev;

                const updatedVersions = prev.versions.map(v => {
                    if (v.versionNumber === versionNumber) {
                        let updatedContent = v.content;
                        updatedContent += `\n\n## Article Processing\n\n`;
                        updatedContent += `Starting to analyze your article...\n\n`;
                        return {
                            ...v,
                            content: updatedContent
                        };
                    }
                    return v;
                });

                return {
                    ...prev,
                    versions: updatedVersions
                };
            });

            // Get Firebase ID token for authentication
            const token = await getIdToken();

            // Call the loading text generator API
            const response = await fetch('/api/generate-loading-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: content }),
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`Failed to generate loading text: ${response.status}`);
            }

            const data = await response.json();
            const loadingMessages = data.loadingMessages || [
                "Analyzing your article content...",
                "Extracting key concepts and themes...",
                "Organizing information into a coherent structure...",
                "Refining arguments and supporting evidence...",
                "Finalizing your article for presentation...",
                "Almost ready to display your complete article..."
            ];

            // Display loading messages with progress indicators
            for (let i = 0; i < loadingMessages.length; i++) {
                const message = loadingMessages[i];
                const progress = Math.round((i + 1) / loadingMessages.length * 100);

                // Update article with loading message and progress
                setArticle(prev => {
                    if (!prev) return prev;

                    const updatedVersions = prev.versions.map(v => {
                        if (v.versionNumber === versionNumber) {
                            // Find the last occurrence of "## Article Processing" and everything after it
                            const processingIndex = v.content.lastIndexOf("## Article Processing");

                            // If found, replace everything after it with new content
                            let updatedContent = v.content;
                            if (processingIndex !== -1) {
                                updatedContent = v.content.substring(0, processingIndex);
                                updatedContent += "## Article Processing\n\n";

                                // Add all messages up to current index with progress
                                for (let j = 0; j <= i; j++) {
                                    updatedContent += `${loadingMessages[j]}\n\n`;
                                    if (j === i) {
                                        updatedContent += `Progress: ${progress}%\n\n`;
                                    }
                                }
                            } else {
                                // Fallback if header not found
                                updatedContent += `\n\n${message}\n\n`;
                                updatedContent += `Progress: ${progress}%\n\n`;
                            }

                            return {
                                ...v,
                                content: updatedContent
                            };
                        }
                        return v;
                    });

                    return {
                        ...prev,
                        versions: updatedVersions
                    };
                });

                // Add delay between messages to simulate processing
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            return loadingMessages;
        } catch (error: any) {
            console.error("Error in handleUiChanges:", error);

            // Fallback to basic loading message if there's an error
            setArticle(prev => {
                if (!prev) return prev;

                const updatedVersions = prev.versions.map(v => {
                    if (v.versionNumber === versionNumber) {
                        let updatedContent = v.content;
                        updatedContent += `\n\nProcessing your article...\n\n`;
                        return {
                            ...v,
                            content: updatedContent
                        };
                    }
                    return v;
                });

                return {
                    ...prev,
                    versions: updatedVersions
                };
            });

            return ["Processing your article..."];
        }
    };

    // Process QueryNode data to extract image information and generate title
    const processQueryNodeData = useCallback(async (data: any, versionNumber: number) => {
        let capturedImageUrl = '';

        if (data.node_type === LoreNodeOutputTypes.PROMPT && data.node_id === "first-draft") {

            // console.log("Processing PromptNode data for article:", data);
            try {
                // Extract content from the data
                const content = data?.node_result?.llm_output || "";

                //  console.log("Content ", content);

                // Get Firebase ID token for authentication
                const token = await getIdToken();

                // Run title generation and image prompt generation in parallel
                try {
                    // Create promises for both API calls
                    const titlePromise = fetch('/api/generate-title', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ message: content }),
                        redirect: 'follow'
                    });

                    const imagePromptPromise = fetch('/api/generate-image-prompt', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ message: content }),
                        redirect: 'follow'
                    });

                    // Start handleUiChanges in parallel with other API calls
                    const uiChangesPromise = handleUiChanges(content, versionNumber);

                    // Wait for title and image prompt API calls to resolve
                    const [titleResponse, imagePromptResponse] = await Promise.all([
                        titlePromise,
                        imagePromptPromise
                    ]);

                    // Don't wait for UI changes to complete - let it run in parallel
                    uiChangesPromise.catch(error => {
                        console.error("Error in parallel UI changes:", error);
                    });

                    // Process title response
                    let generatedTitle = '';
                    if (titleResponse.ok) {
                        const titleData = await titleResponse.json();
                        generatedTitle = titleData.title;

                        // Update article title
                        setArticle(prev => {
                            if (!prev) return prev;

                            return {
                                ...prev,
                                title: generatedTitle
                            };
                        });

                        // Update title in database if we have session ID
                        if (currentUserIdRef.current && currentSessionIdRef.current) {
                            const supabase = createClient();
                            await supabase
                                .from('chat_sessions')
                                .update({ title: generatedTitle })
                                .eq('id', currentSessionIdRef.current);
                        }

                        //  console.log("Generated title:", generatedTitle);
                    } else {
                        console.error(`Failed to generate title: ${titleResponse.status} ${titleResponse.statusText}`);
                        if (titleResponse.status === 307) {
                            console.error("Received 307 redirect. This may indicate an authentication or session issue.");
                        }
                        console.error("Response text:", await titleResponse.text());
                    }

                    // Process image prompt response
                    let imagePrompt = '';
                    if (imagePromptResponse.ok) {
                        const imagePromptData = await imagePromptResponse.json();
                        imagePrompt = imagePromptData.prompt;
                        // console.log("Generated image prompt:", imagePrompt);
                    } else {
                        console.error(`Failed to generate image prompt: ${imagePromptResponse.status} ${imagePromptResponse.statusText}`);
                        if (imagePromptResponse.status === 307) {
                            console.error("Received 307 redirect. This may indicate an authentication or session issue.");
                        }
                        console.error("Response text:", await imagePromptResponse.text());

                        // Fallback image prompt
                        imagePrompt = `Create an illustrative image for an article about: ${content.slice(0, 1000)}`;
                    }

                    // Generate and upload the image using the generated prompt
                    try {
                        // Call our API to generate and upload the image
                        const response = await fetch('/api/generate-image', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ prompt: imagePrompt }),
                            redirect: 'follow'
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to generate image: ${response.status} ${response.statusText}`);
                        }

                        const imageData = await response.json();
                        //console.log("Generated image data:", imageData);

                        // Store the image URL for later use
                        capturedImageUrl = imageData.imageUrl || '';

                        // Create image message
                        const newImage: any = {
                            id: uuidv4(),
                            imageId: imageData.uuid,
                            storageType: imageData.storage_type,
                            sender: "assistant",
                            timestamp: new Date(),
                            imageUrl: capturedImageUrl,
                            version: versionNumber
                        };

                        // Update article with new image
                        setArticle(prev => {
                            if (!prev) return prev;

                            const updatedVersions = prev.versions.map(v => {
                                if (v.versionNumber === versionNumber) {
                                    return {
                                        ...v,
                                        images: [...(v.images || []), newImage]
                                    };
                                }
                                return v;
                            });

                            return {
                                ...prev,
                                versions: updatedVersions
                            };
                        });
                    } catch (error) {
                        console.error("Error generating image:", error);
                    }
                } catch (apiError) {
                    console.error("Error in API calls:", apiError);
                }
            } catch (error) {
                console.error("Error processing PromptNode data:", error);
            }
        }

        return capturedImageUrl;
    }, []);  // Note: You might need to add dependencies here based on your linting rules

    // Process the article stream
    const processArticleStream = useCallback(async (stream: ReadableStream, versionNumber: number) => {
        const reader = stream.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';
        let imageUrl = ''; // Track the image URL

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (buffer.trim()) {
                        try {
                            const event = JSON.parse(buffer.trim()) as StreamEvent;
                            //  console.log('event', event);
                            if (event.event_type === EventType.TextStreamOutput) {
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
                            //  console.log("event", event);

                            // Process batch data for images - ensure we fully await this operation
                            if (event.event_type === EventType.TextBatchOutput && event.event_data) {
                                // Start the processing but don't wait for it
                                const processPromise = processQueryNodeData(event.event_data, versionNumber);

                                // Optionally handle the result when it's ready
                                processPromise.then(capturedUrl => {
                                    if (capturedUrl) {
                                        imageUrl = capturedUrl;
                                    }
                                }).catch(error => {
                                    console.error("Error in parallel processQueryNodeData:", error);
                                });
                                // const capturedUrl = await processQueryNodeData(event.event_data, versionNumber);
                                // if (capturedUrl) {
                                //     imageUrl = capturedUrl;
                                // }
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
                            versionNumber,
                            false,
                            false,
                            imageUrl
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
                            //   console.log("event", event);
                            // Process batch data for images - ensure we fully await this operation
                            if (event.event_type === EventType.TextBatchOutput && event.event_data) {
                                const capturedUrl = await processQueryNodeData(event.event_data, versionNumber);
                                if (capturedUrl) {
                                    imageUrl = capturedUrl;
                                }
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
        isEdit: boolean = false,
        imageUrl?: string
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
                    is_edit: isEdit,
                    image: imageUrl
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
                image: newSession.imageUrl,
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
            // First try to get from IndexedDB cache
            const cachedArticle = await import('@/utils/indexedDB/articleCache').then(
                module => module.getCachedArticle(sessionId, userId)
            ).catch(() => null);

            if (cachedArticle) {
                console.log('Using cached article data');
                // Set article state from cache
                setArticle(cachedArticle);
                // Set to latest version
                setCurrentVersionNumber(cachedArticle.versions.length);
                return sessionId;
            } else {
                console.log('Article not found in cache, checking if preload is needed');
                // Try to ensure articles are preloaded for next time
                import('@/utils/indexedDB/articleCache').then(module => {
                    // Check if we have any cached articles
                    module.hasCachedData().then(hasData => {
                        if (!hasData) {
                            console.log('No cached data found, triggering preload');
                            module.preloadAllArticles(userId)
                                .then(() => console.log('Preload complete'))
                                .catch(err => console.error('Error in preload:', err));
                        }
                    });
                });
            }

            // If not in cache, fetch from server
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
                            // Check if message has an image field
                            if (msg.image) {
                                imageMessages.push({
                                    id: msg.id || uuidv4(),
                                    sender: 'assistant',
                                    imageId: msg.id || uuidv4(),
                                    storageType: 'supabase',
                                    imageUrl: msg.image,
                                    timestamp: new Date(msg.created_at),
                                    version: v
                                });
                            } else {
                                // Check if it's an image message (JSON format) - for backward compatibility
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

            // Create the article object
            const articleData = {
                id: session.id,
                title: session.title,
                topic: topic || session.topic || '',
                currentVersion: versions.length,
                versions,
                created_at: session.created_at,
                updated_at: session.updated_at
            };

            // Set article state
            setArticle(articleData);

            // Set to latest version
            setCurrentVersionNumber(versions.length);

            // Cache the article data
            import('@/utils/indexedDB/articleCache').then(
                module => module.cacheArticle(articleData)
            ).catch(err => console.error('Error caching article:', err));

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

            // Now that we have a successful response, store the user prompt in Supabase
            if (isNewArticle || !sessionId) {
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
            } else {
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
        goToPreviousVersion,
        goToNextVersion,
        goToSpecificVersion,
        generateArticle,
        stopGeneration,
        resetArticle,
        loadArticleSession
    };
}
