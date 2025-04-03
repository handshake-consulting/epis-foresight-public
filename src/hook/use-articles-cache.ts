'use client'

import { Article, ArticleVersion, ImageMessage } from "@/components/chat/types";
import { getArticleDB } from "@/utils/indexedDB";
import { createClient } from "@/utils/supabase/clients";
import { useCallback, useEffect, useState } from "react";

interface ArticlesCacheOptions {
    maxCacheAge?: number; // Maximum age of cached articles in milliseconds (default: 24 hours)
    autoRefresh?: boolean; // Whether to automatically refresh the cache periodically
    refreshInterval?: number; // Refresh interval in milliseconds (default: 30 minutes)
}

export function useArticlesCache(options: ArticlesCacheOptions = {}) {
    const {
        maxCacheAge = 24 * 60 * 60 * 1000, // Default: 24 hours
        autoRefresh = true,
        refreshInterval = 30 * 60 * 1000 // Default: 30 minutes
    } = options;

    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize the IndexedDB on component mount
    useEffect(() => {
        const initDB = async () => {
            const db = getArticleDB();
            const success = await db.init();
            setIsInitialized(success);

            if (success) {
                // Clean up old cached articles
                await cleanupOldCache();
            }
        };

        initDB();
    }, []);

    // Auto-refresh cache if enabled
    useEffect(() => {
        if (!autoRefresh || !isInitialized) return;

        // Initial refresh
        refreshCache();

        // Set up interval for periodic refresh
        const intervalId = setInterval(() => {
            refreshCache();
        }, refreshInterval);

        return () => clearInterval(intervalId);
    }, [autoRefresh, isInitialized, refreshInterval]);

    // Clean up old cached articles
    const cleanupOldCache = useCallback(async () => {
        try {
            const db = getArticleDB();
            const articles = await db.getAll<Article & { cachedAt: number }>();

            const now = Date.now();
            const expiredArticles = articles.filter(article =>
                (now - article.cachedAt) > maxCacheAge
            );

            // Delete expired articles
            for (const article of expiredArticles) {
                await db.delete(article.id);
            }

            console.log(`Cleaned up ${expiredArticles.length} expired articles from cache`);
        } catch (error) {
            console.error("Error cleaning up cache:", error);
            setError(`Error cleaning up cache: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [maxCacheAge]);

    // Fetch all articles from Supabase and cache them
    const refreshCache = useCallback(async (userId?: string) => {
        if (!isInitialized) return;

        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Query to get all article sessions
            let query = supabase
                .from('chat_sessions')
                .select('*')
                .eq('type', 'article')
                .order('updated_at', { ascending: false });

            // Filter by user ID if provided
            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data: sessions, error: sessionsError } = await query;

            if (sessionsError) {
                throw new Error(`Failed to fetch article sessions: ${sessionsError.message}`);
            }

            if (!sessions || sessions.length === 0) {
                console.log('No article sessions found');
                setLastRefreshed(new Date());
                return;
            }

            console.log(`Found ${sessions.length} article sessions`);

            // Process each session to build article objects
            for (const session of sessions) {
                // Get all messages for this session
                const { data: messages, error: messagesError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('session_id', session.id)
                    .order('created_at', { ascending: true });

                if (messagesError) {
                    console.error(`Error fetching messages for session ${session.id}:`, messagesError);
                    continue;
                }

                if (!messages || messages.length === 0) {
                    console.log(`No messages found for session ${session.id}`);
                    continue;
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
                            if (msg.role === 'assistant' && msg.image) {
                                imageMessages.push({
                                    id: msg.id,
                                    sender: 'assistant',
                                    imageId: msg.id,
                                    storageType: 'supabase',
                                    imageUrl: msg.image,
                                    timestamp: new Date(msg.created_at),
                                    version: v
                                });
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

                if (versions.length > 0) {
                    // Create article object
                    const article: Article & { cachedAt: number } = {
                        id: session.id,
                        title: session.title,
                        topic: topic || session.topic || '',
                        currentVersion: versions.length,
                        versions,
                        created_at: session.created_at,
                        updated_at: session.updated_at,
                        cachedAt: Date.now()
                    };

                    // Cache the article
                    const db = getArticleDB();
                    await db.set(article);
                    console.log(`Cached article: ${session.id}`);
                }
            }

            setLastRefreshed(new Date());
        } catch (error) {
            console.error('Error refreshing cache:', error);
            setError(`Error refreshing cache: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    // Get all cached articles
    const getAllCachedArticles = useCallback(async () => {
        if (!isInitialized) return [];

        try {
            const db = getArticleDB();
            const articles = await db.getAll<Article & { cachedAt: number }>();

            // Sort by updated_at (newest first)
            return articles.sort((a, b) => {
                const dateA = new Date(a.updated_at).getTime();
                const dateB = new Date(b.updated_at).getTime();
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Error getting all cached articles:', error);
            setError(`Error getting all cached articles: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }, [isInitialized]);

    // Search for articles in cache
    const searchCachedArticles = useCallback(async (query: string) => {
        if (!isInitialized) return [];

        try {
            const allArticles = await getAllCachedArticles();

            if (!query.trim()) return allArticles;

            const lowerQuery = query.toLowerCase();

            // Search by ID, title, or content
            return allArticles.filter(article => {
                // Match by ID
                if (article.id.toLowerCase().includes(lowerQuery)) return true;

                // Match by title
                if (article.title.toLowerCase().includes(lowerQuery)) return true;

                // Match by topic
                if (article.topic.toLowerCase().includes(lowerQuery)) return true;

                // Match by content in any version
                return article.versions.some(version =>
                    version.content.toLowerCase().includes(lowerQuery)
                );
            });
        } catch (error) {
            console.error('Error searching cached articles:', error);
            setError(`Error searching cached articles: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }, [isInitialized, getAllCachedArticles]);

    // Find article by session ID
    const findArticleById = useCallback(async (sessionId: string) => {
        if (!isInitialized || !sessionId) return null;

        try {
            const db = getArticleDB();
            const article = await db.get<Article & { cachedAt: number }>(sessionId);

            if (!article) return null;

            // Check if article is expired
            const now = Date.now();
            if ((now - article.cachedAt) > maxCacheAge) {
                // Delete expired article
                await db.delete(sessionId);
                return null;
            }

            // Return article without the cachedAt property
            const { cachedAt, ...cachedArticle } = article;
            return cachedArticle;
        } catch (error) {
            console.error('Error finding article by ID:', error);
            setError(`Error finding article by ID: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }, [isInitialized, maxCacheAge]);

    return {
        isInitialized,
        isLoading,
        lastRefreshed,
        error,
        refreshCache,
        getAllCachedArticles,
        searchCachedArticles,
        findArticleById,
        cleanupOldCache
    };
}
