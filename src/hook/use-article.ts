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
        onTitleGenerated?: (title: string, sessionid: string) => void;
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

    // Add an article cache to prevent redundant loading
    const articleCacheRef = useRef<Map<string, { article: Article, timestamp: number }>>(new Map());

    // Cache expiration time (10 minutes)
    const CACHE_EXPIRATION = 10 * 60 * 1000;

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
            const newVersionNumber = currentVersionNumber - 1;
            setCurrentVersionNumber(newVersionNumber);

            // Synchronize article.currentVersion with the new currentVersionNumber
            if (article && currentSessionIdRef.current) {
                const updatedArticle = {
                    ...article,
                    currentVersion: newVersionNumber
                };

                // Update article state
                setArticle(updatedArticle);

                // Update cache with the synchronized article
                articleCacheRef.current.set(currentSessionIdRef.current, {
                    article: updatedArticle,
                    timestamp: Date.now()
                });

                console.log(`[Version Navigation] Updated to previous version: ${newVersionNumber}, cached for session: ${currentSessionIdRef.current}`);
            }
        }
    }, [article, currentVersionNumber]);

    // Navigate to next version
    const goToNextVersion = useCallback(() => {
        if (article && currentVersionNumber < article.versions.length) {
            const newVersionNumber = currentVersionNumber + 1;
            setCurrentVersionNumber(newVersionNumber);

            // Synchronize article.currentVersion with the new currentVersionNumber
            if (currentSessionIdRef.current) {
                const updatedArticle = {
                    ...article,
                    currentVersion: newVersionNumber
                };

                // Update article state
                setArticle(updatedArticle);

                // Update cache with the synchronized article
                articleCacheRef.current.set(currentSessionIdRef.current, {
                    article: updatedArticle,
                    timestamp: Date.now()
                });

                console.log(`[Version Navigation] Updated to next version: ${newVersionNumber}, cached for session: ${currentSessionIdRef.current}`);
            }
        }
    }, [article, currentVersionNumber]);

    // Navigate to a specific version
    const goToSpecificVersion = useCallback((versionNumber: number) => {
        if (article && versionNumber >= 1 && versionNumber <= article.versions.length) {
            setCurrentVersionNumber(versionNumber);

            // Synchronize article.currentVersion with the new currentVersionNumber
            if (currentSessionIdRef.current) {
                const updatedArticle = {
                    ...article,
                    currentVersion: versionNumber
                };

                // Update article state
                setArticle(updatedArticle);

                // Update cache with the synchronized article
                articleCacheRef.current.set(currentSessionIdRef.current, {
                    article: updatedArticle,
                    timestamp: Date.now()
                });

                console.log(`[Version Navigation] Updated to specific version: ${versionNumber}, cached for session: ${currentSessionIdRef.current}`);
            }
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

                                // Only add current message with progress instead of all previous messages
                                updatedContent += `${message}\n\n`;
                                updatedContent += `Progress: ${progress}%\n\n`;
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
        console.log(`[IMAGE PROCESSING] Processing QueryNode data for node_type: ${data.node_type}, node_id: ${data.node_id}`);
        let capturedImageUrl = '';

        if (data.node_type === LoreNodeOutputTypes.PROMPT && data.node_id === "first-draft") {
            try {
                // Extract content from the data
                const content = data?.node_result?.llm_output || "";
                console.log(`[IMAGE PROCESSING] Extracted content length: ${content.length} chars`);

                // Get Firebase ID token for authentication
                console.log(`[IMAGE PROCESSING] Getting Firebase token for image generation`);
                let token;
                try {
                    token = await getIdToken();
                    console.log(`[IMAGE PROCESSING] Firebase token obtained: ${token ? 'Yes' : 'No'}`);
                } catch (tokenError) {
                    console.error(`[IMAGE PROCESSING ERROR] Failed to get Firebase token:`, tokenError);
                    throw new Error(`Authentication error for image: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`);
                }

                // Run title generation and image prompt generation in parallel
                try {
                    console.log(`[IMAGE PROCESSING] Starting parallel API calls for title and image`);
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
                    console.log(`[IMAGE PROCESSING] Starting UI changes for loading state`);
                    const uiChangesPromise = handleUiChanges(content, versionNumber);

                    // Wait for all promises to resolve
                    console.log(`[IMAGE PROCESSING] Awaiting parallel API responses`);
                    const [titleResponse, imagePromptResponse] = await Promise.all([
                        titlePromise,
                        imagePromptPromise
                    ]);
                    console.log(`[IMAGE PROCESSING] Received API responses - Title: ${titleResponse.status}, Image Prompt: ${imagePromptResponse.status}`);

                    // Handle UI changes separately
                    await uiChangesPromise;
                    console.log(`[IMAGE PROCESSING] UI changes for loading state completed`);

                    // Process title response
                    if (titleResponse.ok) {
                        try {
                            const titleData = await titleResponse.json();
                            const title = titleData.title;
                            console.log(`[IMAGE PROCESSING] Title generated: "${title}"`);

                            // Update the title
                            if (title) {
                                setArticle(prev => {
                                    if (!prev) return prev;

                                    return {
                                        ...prev,
                                        title: title
                                    };
                                });
                                if (callbacks?.onTitleGenerated && currentSessionIdRef.current) {
                                    callbacks.onTitleGenerated(title, currentSessionIdRef.current);
                                    console.log(`[IMAGE PROCESSING] Title callback triggered with: "${title}"`);
                                }
                            }
                        } catch (titleParseError) {
                            console.error(`[IMAGE PROCESSING ERROR] Failed to parse title response:`, titleParseError);
                        }
                    } else {
                        console.error(`[IMAGE PROCESSING ERROR] Failed to generate title: ${titleResponse.status} ${titleResponse.statusText}`);
                        if (titleResponse.status === 307) {
                            console.error("[IMAGE PROCESSING ERROR] Received 307 redirect. This may indicate an authentication or session issue.");
                        }
                        try {
                            const errorText = await titleResponse.text();
                            console.error("[IMAGE PROCESSING ERROR] Response text:", errorText);
                        } catch (textError) {
                            console.error("[IMAGE PROCESSING ERROR] Couldn't read response text:", textError);
                        }
                    }

                    // Process image prompt response
                    let imagePrompt = '';
                    if (imagePromptResponse.ok) {
                        try {
                            const imagePromptData = await imagePromptResponse.json();
                            imagePrompt = imagePromptData.prompt;
                            console.log(`[IMAGE PROCESSING] Image prompt generated: "${imagePrompt.substring(0, 100)}..."`);
                        } catch (promptParseError) {
                            console.error(`[IMAGE PROCESSING ERROR] Failed to parse image prompt response:`, promptParseError);
                            // Continue with fallback
                        }
                    } else {
                        console.error(`[IMAGE PROCESSING ERROR] Failed to generate image prompt: ${imagePromptResponse.status} ${imagePromptResponse.statusText}`);
                        if (imagePromptResponse.status === 307) {
                            console.error("[IMAGE PROCESSING ERROR] Received 307 redirect. This may indicate an authentication or session issue.");
                        }
                        try {
                            const errorText = await imagePromptResponse.text();
                            console.error("[IMAGE PROCESSING ERROR] Response text:", errorText);
                        } catch (textError) {
                            console.error("[IMAGE PROCESSING ERROR] Couldn't read response text:", textError);
                        }

                        // Fallback image prompt
                        imagePrompt = `Create an illustrative image for an article about: ${content.slice(0, 1000)}`;
                        console.log(`[IMAGE PROCESSING] Using fallback image prompt`);
                    }

                    // Generate and upload the image using the generated prompt
                    try {
                        console.log(`[IMAGE PROCESSING] Calling image generation API with prompt length: ${imagePrompt.length}`);
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
                            console.error(`[IMAGE PROCESSING ERROR] Failed to generate image: ${response.status} ${response.statusText}`);
                            try {
                                const errorText = await response.text();
                                console.error("[IMAGE PROCESSING ERROR] Response text:", errorText);
                            } catch (textError) {
                                console.error("[IMAGE PROCESSING ERROR] Couldn't read response text:", textError);
                            }
                            throw new Error(`Failed to generate image: ${response.status} ${response.statusText}`);
                        }

                        const imageData = await response.json();
                        console.log(`[IMAGE PROCESSING] Image generated successfully, UUID: ${imageData.uuid}`);

                        // Store the image URL for later use
                        capturedImageUrl = imageData.imageUrl || '';
                        console.log(`[IMAGE PROCESSING] Image URL: ${capturedImageUrl.substring(0, 50)}...`);

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
                        console.log(`[IMAGE PROCESSING] Article state updated with new image`);
                    } catch (imageGenError) {
                        console.error("[IMAGE PROCESSING ERROR] Error generating image:", imageGenError);
                    }
                } catch (apiError) {
                    console.error("[IMAGE PROCESSING ERROR] Error in API calls:", apiError);
                }
            } catch (error) {
                console.error("[IMAGE PROCESSING ERROR] Error processing PromptNode data:", error);
            }
        } else {
            console.log(`[IMAGE PROCESSING] Skipping node type: ${data.node_type}, node_id: ${data.node_id}`);
        }

        return capturedImageUrl;
    }, []);  // Note: You might need to add dependencies here based on your linting rules

    // Process the article stream
    const processArticleStream = useCallback(async (stream: ReadableStream, versionNumber: number) => {
        console.log("========== PROCESSING STREAM RESPONSE ==========");
        console.log("Processing stream for version:", versionNumber);

        const reader = stream.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';
        let imageUrl = ''; // Track the image URL
        const streamStartTime = Date.now();

        console.log("[STREAM PROCESSING] Stream processing started");

        try {
            let chunkCount = 0;
            let lastEventTime = Date.now();

            while (true) {
                try {
                    const { done, value } = await reader.read();
                    const currentTime = Date.now();
                    const timeSinceLastEvent = currentTime - lastEventTime;
                    lastEventTime = currentTime;

                    chunkCount++;

                    if (done) {
                        console.log(`[STREAM PROCESSING] Stream completed after ${chunkCount} chunks`);
                        if (buffer.trim()) {
                            console.log(`[STREAM PROCESSING] Processing final buffer content (${buffer.length} bytes)`);
                            try {
                                const event = JSON.parse(buffer.trim()) as StreamEvent;
                                if (event.event_type === EventType.TextStreamOutput) {
                                    console.log(`[STREAM PROCESSING] Final text chunk received (${event.event_data.text.length} chars)`);
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

                                        // Update both the versions and the currentVersion field
                                        // Ensure currentVersion is explicitly set to this version number
                                        const updatedArticle = {
                                            ...prev,
                                            versions: updatedVersions,
                                            currentVersion: versionNumber // Ensure currentVersion is synchronized
                                        };

                                        // Update the cache if we have a session ID
                                        if (currentSessionIdRef.current) {
                                            articleCacheRef.current.set(currentSessionIdRef.current, {
                                                article: updatedArticle,
                                                timestamp: Date.now()
                                            });
                                        }

                                        return updatedArticle;
                                    });

                                    callbacks?.onData?.({ text: event.event_data.text });
                                }

                                // Process batch data for images - ensure we fully await this operation
                                if (event.event_type === EventType.TextBatchOutput && event.event_data) {
                                    console.log(`[STREAM PROCESSING] Processing batch data from final buffer`);
                                    // Start the processing but don't wait for it
                                    const processPromise = processQueryNodeData(event.event_data, versionNumber);

                                    // Optionally handle the result when it's ready
                                    processPromise.then(capturedUrl => {
                                        if (capturedUrl) {
                                            console.log(`[STREAM PROCESSING] Image URL captured from final batch: ${capturedUrl.substring(0, 50)}...`);
                                            imageUrl = capturedUrl;
                                        }
                                    }).catch(error => {
                                        console.error("[STREAM PROCESSING ERROR] Error in parallel processQueryNodeData:", error);
                                    });
                                }
                            } catch (e) {
                                console.error('[STREAM PROCESSING ERROR] Failed to parse final buffer:', buffer.substring(0, 100), e);
                            }
                        } else {
                            console.log(`[STREAM PROCESSING] Final buffer was empty`);
                        }

                        // Store assistant message in Supabase when stream is complete
                        if (accumulatedContent && currentUserIdRef.current && currentSessionIdRef.current) {
                            console.log(`[STREAM PROCESSING] Storing completed article in Supabase (${accumulatedContent.length} chars)`);
                            try {
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
                                console.log(`[STREAM PROCESSING] Successfully stored article in Supabase`);
                            } catch (dbError) {
                                console.error('[STREAM PROCESSING ERROR] Failed to store article in Supabase:', dbError);
                            }
                        } else {
                            console.warn(`[STREAM PROCESSING WARNING] Could not store completed article: content=${!!accumulatedContent}, userId=${!!currentUserIdRef.current}, sessionId=${!!currentSessionIdRef.current}`);
                        }

                        // Final update of article state to ensure correct version info
                        setArticle(prev => {
                            if (!prev) return prev;

                            const updatedArticle = {
                                ...prev,
                                // Explicitly set currentVersion to this version number
                                currentVersion: versionNumber
                            };

                            // Update cache
                            if (currentSessionIdRef.current) {
                                articleCacheRef.current.set(currentSessionIdRef.current, {
                                    article: updatedArticle,
                                    timestamp: Date.now()
                                });
                            }

                            return updatedArticle;
                        });

                        callbacks?.onFinish?.();
                        break;
                    }

                    console.log(`[STREAM PROCESSING] Chunk #${chunkCount} received (${value ? value.length : 0} bytes), ${timeSinceLastEvent}ms since last chunk`);

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

                                    // Log the event type and a sample of the text for debugging
                                    if (event.event_type) {
                                        console.log(`[STREAM PROCESSING] Received event type: ${event.event_type}, text length: ${event.event_data.text.length}`);
                                    }

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

                                        // Update both the versions and the currentVersion field
                                        // Ensure currentVersion is explicitly set to this version number
                                        const updatedArticle = {
                                            ...prev,
                                            versions: updatedVersions,
                                            currentVersion: versionNumber // Ensure currentVersion is synchronized
                                        };

                                        // Update the cache if we have a session ID
                                        if (currentSessionIdRef.current) {
                                            articleCacheRef.current.set(currentSessionIdRef.current, {
                                                article: updatedArticle,
                                                timestamp: Date.now()
                                            });
                                        }

                                        return updatedArticle;
                                    });

                                    callbacks?.onData?.({ text: event.event_data.text });
                                }
                                //   console.log("event", event);
                                // Process batch data for images - ensure we fully await this operation
                                if (event.event_type === EventType.TextBatchOutput && event.event_data) {
                                    console.log(`[STREAM PROCESSING] Processing batch data for node type: ${event.event_data.node_type || 'unknown'}`);
                                    try {
                                        const capturedUrl = await processQueryNodeData(event.event_data, versionNumber);
                                        if (capturedUrl) {
                                            console.log(`[STREAM PROCESSING] Image URL captured: ${capturedUrl.substring(0, 50)}...`);
                                            imageUrl = capturedUrl;
                                        }
                                    } catch (batchError) {
                                        console.error('[STREAM PROCESSING ERROR] Error processing batch data:', batchError);
                                    }
                                }
                            } catch (e) {
                                console.warn('[STREAM PROCESSING WARNING] Failed to parse event:', eventJson.substring(0, 100), e);
                                continue;
                            }
                        }
                    }
                } catch (readError) {
                    console.error('[STREAM PROCESSING ERROR] Error reading from stream:', readError);
                    throw new Error(`Stream read error: ${readError instanceof Error ? readError.message : String(readError)}`);
                }
            }
        } catch (error) {
            console.error('[STREAM PROCESSING ERROR] Stream processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Stream processing error';
            setError(errorMessage);
            callbacks?.onError?.(new Error(errorMessage));
        } finally {
            const processingTime = Date.now() - streamStartTime;
            console.log("========== STREAM PROCESSING FINISHED ==========");
            console.log("Total processing time:", processingTime, "ms");
            console.log("Total content length:", accumulatedContent.length, "characters");
            console.log("Image URL generated:", imageUrl ? "Yes" : "No");
            console.log("Current version set to:", versionNumber);
            console.log("===============================================");

            try {
                reader.cancel();
            } catch (cancelError) {
                console.error('[STREAM PROCESSING ERROR] Error canceling stream reader:', cancelError);
            }
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
        console.log(`[SUPABASE] Storing message: role=${role}, version=${version}, isTopic=${isTopic}, isEdit=${isEdit}, contentLength=${content.length}`);
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
                console.error('[SUPABASE ERROR] Error storing message in Supabase:', error);
            } else {
                console.log(`[SUPABASE] Successfully stored message in chat_messages table`);
            }

            // If this is a topic message, update the session with the topic
            if (isTopic) {
                console.log(`[SUPABASE] Updating chat_sessions with topic: "${content.substring(0, 50)}..."`);
                const { error: sessionError } = await supabase
                    .from('chat_sessions')
                    .update({
                        topic: content,
                        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                        type: 'article'
                    })
                    .eq('id', sessionId);

                if (sessionError) {
                    console.error('[SUPABASE ERROR] Error updating session topic:', sessionError);
                } else {
                    console.log(`[SUPABASE] Successfully updated session topic`);
                }
            }
        } catch (error) {
            console.error('[SUPABASE ERROR] Error in storeMessageInSupabase:', error);
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
    const loadArticleSession = useCallback(async (sessionId: string, userId: string, preloadOnly: boolean = false) => {
        try {
            // Check if we have a valid cached version
            const cachedEntry = articleCacheRef.current.get(sessionId);
            const now = Date.now();

            if (cachedEntry && (now - cachedEntry.timestamp < CACHE_EXPIRATION)) {
                // Use cached article data
                if (!preloadOnly) {
                    setArticle(cachedEntry.article);

                    // Ensure we set the correct version number from the cached article
                    const versionToSet = cachedEntry.article.currentVersion || cachedEntry.article.versions.length;
                    setCurrentVersionNumber(versionToSet);

                    // Store the session ID for future cache updates
                    currentSessionIdRef.current = sessionId;

                    console.log(`[Load Session] Using cached article for session ${sessionId}, setting version to ${versionToSet}`);
                }
                return sessionId;
            }

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

            // Log previous messages to see what context might be available
            console.log("========== PREVIOUS SESSION MESSAGES ==========");
            console.log("SessionId:", sessionId);
            console.log("Total Messages:", messages.length);
            console.log("Messages By Version:");

            const messagesByVersion: Record<number, Array<{
                role: string;
                is_topic: boolean;
                is_edit: boolean;
                content_preview: string;
                created_at: string;
            }>> = {};
            messages.forEach(msg => {
                if (!messagesByVersion[msg.version]) {
                    messagesByVersion[msg.version] = [];
                }
                messagesByVersion[msg.version].push({
                    role: msg.role,
                    is_topic: msg.is_topic,
                    is_edit: msg.is_edit,
                    content_preview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
                    created_at: msg.created_at
                });
            });

            console.log(JSON.stringify(messagesByVersion, null, 2));
            console.log("==============================================");

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

            // Create article data object
            const articleData = {
                id: session.id,
                title: session.title,
                topic: topic || session.topic || '',
                currentVersion: versions.length,
                versions,
                created_at: session.created_at,
                updated_at: session.updated_at
            };

            // Cache the article data
            articleCacheRef.current.set(sessionId, {
                article: articleData,
                timestamp: Date.now()
            });

            // If this is just preloading, don't update UI state
            if (!preloadOnly) {
                // Set article state
                setArticle(articleData);

                // Set to latest version or stored current version
                setCurrentVersionNumber(articleData.currentVersion);

                // Store the session ID for future cache updates
                currentSessionIdRef.current = sessionId;

                console.log(`[Load Session] Loaded article for session ${sessionId}, setting version to ${articleData.currentVersion}`);
            }

            return session.id;
        } catch (error) {
            console.error('Error loading article session:', error);
            throw error;
        }
    }, []);

    // New function to get only the content of the most recent article's latest version
    const getPrecedingPageContent = async (userId: string, currentSessionId: string) => {
        try {
            console.log("========== FETCHING PRECEDING PAGE ==========");
            console.log("User ID:", userId);
            console.log("Current Session ID to exclude:", currentSessionId);

            const supabase = createClient();

            // Get the most recent article session EXCLUDING the current one being created
            const { data: sessions } = await supabase
                .from("chat_sessions")
                .select("id, title, created_at")
                .eq("user_id", userId)
                .eq("type", "article")
                .neq("id", currentSessionId) // Explicitly exclude the current session
                .order("created_at", { ascending: false })
                .limit(1); // Only need one result now

            // No previous sessions found
            if (!sessions || sessions.length === 0) {
                console.log("No previous sessions found");
                return null;
            }

            // The most recent session (excluding current one)
            const precedingSessionId = sessions[0].id;
            console.log("Found preceding session:", {
                id: precedingSessionId,
                title: sessions[0].title,
                created_at: sessions[0].created_at
            });

            // Get the latest version number for this session
            const { data: versionData } = await supabase
                .from("chat_messages")
                .select("version")
                .eq("session_id", precedingSessionId)
                .eq("role", "assistant")
                .not("is_topic", "is", true)
                .order("version", { ascending: false })
                .limit(1);

            if (!versionData || versionData.length === 0) {
                console.log("No version data found for preceding session");
                return null;
            }

            const latestVersion = versionData[0].version;
            console.log("Latest version found:", latestVersion);

            // Get the actual content of the latest version
            const { data: contentData } = await supabase
                .from("chat_messages")
                .select("content")
                .eq("session_id", precedingSessionId)
                .eq("version", latestVersion)
                .eq("role", "assistant")
                .not("is_topic", "is", true)
                .not("is_edit", "is", true)
                .single();

            if (contentData && contentData.content) {
                console.log("Found content with length:", contentData.content.length);
                console.log("Content preview:", contentData.content.substring(0, 100) + "...");
            } else {
                console.log("No content found");
            }

            console.log("=========================================");

            return contentData?.content || null;
        } catch (error) {
            console.error("Error fetching preceding page content:", error);
            return null;
        }
    };

    // Generate or update article
    const generateArticle = useCallback(async (
        prompt: string,
        userId: string,
        sessionId?: string,
        isNewArticle: boolean = false
    ) => {
        console.log(`[ARTICLE GENERATION] Starting article generation process`, {
            isNewArticle,
            hasExistingSessionId: !!sessionId,
            promptLength: prompt.length
        });

        if (!prompt.trim()) {
            console.error("[ARTICLE GENERATION ERROR] Empty prompt provided");
            return;
        }

        setError(null);
        setIsStreaming(true);

        try {
            // Store current user and session IDs for later use
            currentUserIdRef.current = userId;
            console.log(`[ARTICLE GENERATION] Using user ID: ${userId}`);

            // Create new session or use existing one
            let actualSessionId: string;
            let nextVersionNumber: number;

            if (isNewArticle || !sessionId) {
                console.log(`[ARTICLE GENERATION] Creating new article session`);
                // Create new article session
                try {
                    actualSessionId = await createArticleSession(userId);
                    console.log(`[ARTICLE GENERATION] Successfully created new session ID: ${actualSessionId}`);
                } catch (createSessionError) {
                    console.error(`[ARTICLE GENERATION ERROR] Failed to create session:`, createSessionError);
                    throw createSessionError;
                }

                nextVersionNumber = 1;

                // Update article state with topic and an initial version placeholder
                setArticle(prev => {
                    // Create a placeholder version
                    const initialVersion: ArticleVersion = {
                        versionNumber: nextVersionNumber,
                        content: "Generating...this will take 30-60 seconds while we thoroughly research your topic.",
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
                        currentVersion: nextVersionNumber, // Ensure currentVersion is set correctly
                        versions: [initialVersion]
                    };
                });
                console.log(`[ARTICLE GENERATION] Initialized article state with placeholder for new article`);
            } else {
                // Use existing session
                actualSessionId = sessionId;
                console.log(`[ARTICLE GENERATION] Using existing session ID: ${actualSessionId}`);

                nextVersionNumber = article?.versions.length ? article.versions.length + 1 : 1;
                console.log(`[ARTICLE GENERATION] Creating version #${nextVersionNumber} for existing article`);

                // Add new version placeholder
                setArticle(prev => {
                    if (!prev) return prev;

                    const newVersion: ArticleVersion = {
                        versionNumber: nextVersionNumber,
                        content: "Generating...this will take 30-60 seconds while we thoroughly research your topic.",
                        editPrompt: prompt,
                        timestamp: new Date(),
                        images: []
                    };

                    const updatedArticle = {
                        ...prev,
                        currentVersion: nextVersionNumber, // Ensure currentVersion is set correctly
                        versions: [...prev.versions, newVersion]
                    };

                    return updatedArticle;
                });
                console.log(`[ARTICLE GENERATION] Updated article state with new version placeholder`);
            }

            // Update current session ID ref
            currentSessionIdRef.current = actualSessionId;
            console.log(`[ARTICLE GENERATION] Set currentSessionIdRef to: ${actualSessionId}`);

            // Update current version number
            setCurrentVersionNumber(nextVersionNumber);
            console.log(`[ARTICLE GENERATION] Set currentVersionNumber to: ${nextVersionNumber}`);

            // Get Firebase ID token for authentication
            console.log(`[ARTICLE GENERATION] Requesting Firebase ID token`);
            let token;
            try {
                token = await getIdToken();
                console.log(`[ARTICLE GENERATION] Successfully obtained Firebase token: ${token ? 'Token received' : 'No token received'}`);
            } catch (tokenError) {
                console.error(`[ARTICLE GENERATION ERROR] Failed to get Firebase token:`, tokenError);
                throw new Error(`Authentication error: Failed to get Firebase token - ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`);
            }

            // Format the prompt differently for new articles
            let formattedPrompt = prompt;

            if (isNewArticle || !sessionId) {
                console.log(`[ARTICLE GENERATION] Fetching preceding content for new article`);
                // Get preceding content for new articles
                let precedingContent;
                try {
                    precedingContent = await getPrecedingPageContent(userId, actualSessionId);
                    console.log(`[ARTICLE GENERATION] Preceding content ${precedingContent ? 'found' : 'not found'}`);
                } catch (precedingError) {
                    console.error(`[ARTICLE GENERATION ERROR] Error fetching preceding content:`, precedingError);
                    // Continue without preceding content
                    precedingContent = null;
                }

                // Format with preceding content if available
                if (precedingContent) {
                    formattedPrompt = `<preceding_page>\n${precedingContent}\n</preceding_page>\n\n<user_input>\n${prompt}\n</user_input>`;
                    console.log(`[ARTICLE GENERATION] Added preceding content to prompt (${precedingContent.length} chars)`);
                } else {
                    formattedPrompt = `<user_input>\n${prompt}\n</user_input>`;
                    console.log(`[ARTICLE GENERATION] No preceding content available, using basic prompt format`);
                }
            }

            // Add detailed logging for the API request
            console.log("========== LORE API REQUEST ==========");
            console.log("URL:", process.env.NEXT_PUBLIC_API_URL + 'chat_stream');
            console.log("Headers:", {
                'firebase-id-token': token ? '[TOKEN PRESENT]' : '[NO TOKEN]',
                'client-id': process.env.NEXT_PUBLIC_CLIENT_ID ? '[CLIENT ID PRESENT]' : '[NO CLIENT ID]',
                'graph-id': process.env.NEXT_PUBLIC_GRAPH_ID ? '[GRAPH ID PRESENT]' : '[NO GRAPH ID]',
                'Content-Type': 'application/json',
            });
            console.log("Request Body:", {
                query: formattedPrompt.substring(0, 100) + '...',  // Only log a portion for privacy
                session: actualSessionId,
                user: userId
            });
            console.log("Is New Article:", isNewArticle || !sessionId);
            console.log("Version Number:", nextVersionNumber);
            console.log("Has Preceding Content:", formattedPrompt.includes("<preceding_page>"));
            console.log("=====================================");

            // Call API to generate content
            console.log(`[ARTICLE GENERATION] Sending API request to chat_stream endpoint`);
            let response;
            try {
                response = await fetch(process.env.NEXT_PUBLIC_API_URL + 'chat_stream', {
                    method: 'POST',
                    headers: {
                        'firebase-id-token': token!,
                        'client-id': process.env.NEXT_PUBLIC_CLIENT_ID!,
                        'graph-id': process.env.NEXT_PUBLIC_GRAPH_ID!,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: formattedPrompt,
                        session: actualSessionId,
                        user: userId
                    }),
                });

                console.log(`[ARTICLE GENERATION] API response received: status ${response.status}`);

                if (!response.ok) {
                    let responseText = '';
                    try {
                        responseText = await response.text();
                    } catch (textError) {
                        console.error('[ARTICLE GENERATION ERROR] Failed to read error response text:', textError);
                    }

                    console.error(`[ARTICLE GENERATION ERROR] API request failed with status ${response.status}:`, responseText);
                    throw new Error(`API request failed with status ${response.status}: ${responseText}`);
                }
            } catch (apiError) {
                console.error(`[ARTICLE GENERATION ERROR] Error calling API:`, apiError);
                throw new Error(`API call error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
            }

            // Now that we have a successful response, store the user prompt in Supabase
            console.log(`[ARTICLE GENERATION] Storing user prompt in Supabase`);
            try {
                if (isNewArticle || !sessionId) {
                    // Store topic
                    await storeMessageInSupabase(
                        userId,
                        actualSessionId,
                        "user",
                        prompt, // Store original prompt, not formatted
                        nextVersionNumber,
                        true, // is_topic
                        false // is_edit
                    );
                    console.log(`[ARTICLE GENERATION] Successfully stored topic message in Supabase`);
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
                    console.log(`[ARTICLE GENERATION] Successfully stored edit prompt in Supabase`);
                }
            } catch (dbError) {
                console.error(`[ARTICLE GENERATION ERROR] Failed to store message in Supabase:`, dbError);
                // Continue processing even if storage fails
            }

            if (response.body) {
                console.log(`[ARTICLE GENERATION] Stream body received, starting stream processing`);
                await processArticleStream(response.body, nextVersionNumber);
            } else {
                console.error(`[ARTICLE GENERATION ERROR] No response body received`);
                throw new Error("No response body received from API");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to generate article";
            console.error(`[ARTICLE GENERATION ERROR] Error in generateArticle:`, error);
            setError(errorMessage);
            callbacks?.onError?.(new Error(errorMessage));
        } finally {
            console.log(`[ARTICLE GENERATION] Generation process completed`);
            setIsStreaming(false);
            readerRef.current = null;
        }
    }, [article, callbacks, createArticleSession, processArticleStream, getPrecedingPageContent]);

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
        loadArticleSession,
        getPrecedingPageContent
    };
}
