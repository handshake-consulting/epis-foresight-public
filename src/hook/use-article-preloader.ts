"use client"

import { Article } from "@/components/chat/types";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { createClient } from "@/utils/supabase/clients";
import { useCallback, useEffect, useRef } from "react";

console.log('[ArticlePreloader] Module loaded');

// Create a global cache for article data
const articleCache = new Map<string, Article>();
console.log('[ArticlePreloader] Global article cache initialized');

export function useArticlePreloader() {
    console.log('[ArticlePreloader] Hook instantiated');

    const userId = useRef<string | null>(null);
    const preloadingRef = useRef<Set<string>>(new Set());

    // Initialize user ID
    useEffect(() => {
        console.log('[ArticlePreloader] Running init user effect');

        const initUser = async () => {
            console.log('[ArticlePreloader] Initializing user');
            const { user } = await getCurrentAuthState();
            if (user) {
                userId.current = user.uid;
                console.log('[ArticlePreloader] User ID set:', user.uid);
            } else {
                console.log('[ArticlePreloader] No user found');
            }
        };

        initUser();
    }, []);

    // Check if an article is in the cache
    const isArticleCached = useCallback((articleId: string): boolean => {
        const isCached = articleCache.has(articleId);
        console.log(`[ArticlePreloader] Cache check for ${articleId}: ${isCached ? 'HIT' : 'MISS'}`);
        return isCached;
    }, []);

    // Get article from the cache
    const getCachedArticle = useCallback((articleId: string): Article | undefined => {
        const article = articleCache.get(articleId);
        console.log(`[ArticlePreloader] Getting article ${articleId} from cache: ${article ? 'Found' : 'Not found'}`);
        return article;
    }, []);

    // Load article data from the database
    const loadArticleData = useCallback(async (sessionId: string): Promise<Article | null> => {
        console.log(`[ArticlePreloader] loadArticleData called for ${sessionId}`);

        // Skip if already loading or no user ID
        if (preloadingRef.current.has(sessionId) || !userId.current) {
            console.log(`[ArticlePreloader] Skipping load for ${sessionId} - Already loading: ${preloadingRef.current.has(sessionId)}, User ID: ${!!userId.current}`);
            return null;
        }

        // Mark as loading
        preloadingRef.current.add(sessionId);
        console.log(`[ArticlePreloader] Marked ${sessionId} as loading, current loading count: ${preloadingRef.current.size}`);

        try {
            // If already cached, return from cache
            if (articleCache.has(sessionId)) {
                console.log(`[ArticlePreloader] ${sessionId} found in cache, returning cached version`);
                return articleCache.get(sessionId) || null;
            }

            console.log(`[ArticlePreloader] ${sessionId} not in cache, loading from database`);
            const loadStartTime = performance.now();

            const supabase = createClient();
            console.log(`[ArticlePreloader] Supabase client created for ${sessionId}`);

            // Get session details
            console.log(`[ArticlePreloader] Fetching session details for ${sessionId}`);
            const { data: session, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .eq('user_id', userId.current)
                .single();

            if (sessionError || !session) {
                console.error(`[ArticlePreloader] Error fetching session for ${sessionId}:`, sessionError);
                throw new Error('Failed to load article session');
            }
            console.log(`[ArticlePreloader] Session details retrieved for ${sessionId} - Title: ${session.title}`);

            // Get all messages for this session
            console.log(`[ArticlePreloader] Fetching messages for ${sessionId}`);
            const { data: messages, error: messagesError } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (messagesError) {
                console.error(`[ArticlePreloader] Error fetching messages for ${sessionId}:`, messagesError);
                throw new Error('Failed to load article messages');
            }
            console.log(`[ArticlePreloader] Retrieved ${messages.length} messages for ${sessionId}`);

            // Process messages to build article versions
            console.log(`[ArticlePreloader] Processing messages into versions for ${sessionId}`);
            const versions = [];
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
            console.log(`[ArticlePreloader] Found topic "${topic}" and ${maxVersion} versions for ${sessionId}`);

            // Second pass: group messages by version
            for (let v = 1; v <= maxVersion; v++) {
                const versionMessages = messages.filter(msg => msg.version === v);
                const assistantMessage = versionMessages.find(msg => msg.role === 'assistant');

                if (assistantMessage) {
                    versions.push({
                        versionNumber: v,
                        content: assistantMessage.content,
                        timestamp: new Date(assistantMessage.created_at),
                        images: versionMessages
                            .filter(msg => msg.role === 'assistant' && msg.image)
                            .map(msg => msg.image)
                            .filter(Boolean)
                    });
                    console.log(`[ArticlePreloader] Processed version ${v} for ${sessionId} - Content length: ${assistantMessage.content.length}`);
                }
            }

            // Create article object
            const article: Article = {
                id: sessionId,
                topic,
                title: session.title || topic,
                currentVersion: versions.length,
                versions,
                created_at: session.created_at,
                updated_at: session.updated_at
            };
            console.log(`[ArticlePreloader] Created article object for ${sessionId} with ${versions.length} versions`);

            // Store in cache
            articleCache.set(sessionId, article);
            console.log(`[ArticlePreloader] Cached article ${sessionId}, cache size now: ${articleCache.size}`);

            const loadEndTime = performance.now();
            console.log(`[ArticlePreloader] Article ${sessionId} loaded and cached in ${(loadEndTime - loadStartTime).toFixed(2)}ms`);

            return article;
        } catch (error) {
            console.error(`[ArticlePreloader] Error in loadArticleData for ${sessionId}:`, error);
            return null;
        } finally {
            // Remove from loading set
            preloadingRef.current.delete(sessionId);
            console.log(`[ArticlePreloader] Removed ${sessionId} from loading set, current loading count: ${preloadingRef.current.size}`);
        }
    }, []);

    // Preload adjacent articles (5 before and 5 after the current article)
    const preloadAdjacentArticles = useCallback(async (currentArticleId: string, allArticleIds: string[]) => {
        console.log(`[ArticlePreloader] preloadAdjacentArticles called for ${currentArticleId}`);

        if (!userId.current || !currentArticleId || allArticleIds.length === 0) {
            console.log(`[ArticlePreloader] Skipping preload - User ID: ${!!userId.current}, Current Article: ${!!currentArticleId}, Articles count: ${allArticleIds.length}`);
            return;
        }

        const currentIndex = allArticleIds.indexOf(currentArticleId);
        if (currentIndex === -1) {
            console.log(`[ArticlePreloader] Current article ${currentArticleId} not found in article list`);
            return;
        }
        console.log(`[ArticlePreloader] Current article index: ${currentIndex} of ${allArticleIds.length}`);

        // Get articles to preload
        const articlesToPreload: string[] = [];

        // Add 5 articles before current
        for (let i = 1; i <= 5; i++) {
            const index = (currentIndex - i + allArticleIds.length) % allArticleIds.length;
            articlesToPreload.push(allArticleIds[index]);
        }

        // Add 5 articles after current
        for (let i = 1; i <= 5; i++) {
            const index = (currentIndex + i) % allArticleIds.length;
            articlesToPreload.push(allArticleIds[index]);
        }
        console.log(`[ArticlePreloader] Planning to preload ${articlesToPreload.length} adjacent articles`);

        // Filter out already cached articles and start preloading in background
        let preloadCount = 0;
        for (const id of articlesToPreload) {
            if (!articleCache.has(id) && !preloadingRef.current.has(id)) {
                // We don't await these - let them load in background
                console.log(`[ArticlePreloader] Starting background preload of ${id}`);
                loadArticleData(id);
                preloadCount++;
            }
        }
        console.log(`[ArticlePreloader] Started preloading ${preloadCount} articles in the background`);
    }, [loadArticleData]);

    // Clear the cache for specific article or all articles
    const clearCache = useCallback((articleId?: string) => {
        if (articleId) {
            console.log(`[ArticlePreloader] Clearing cache for specific article: ${articleId}`);
            articleCache.delete(articleId);
        } else {
            console.log(`[ArticlePreloader] Clearing entire article cache, previous size: ${articleCache.size}`);
            articleCache.clear();
        }
    }, []);

    return {
        isArticleCached,
        getCachedArticle,
        loadArticleData,
        preloadAdjacentArticles,
        clearCache,
    };
} 