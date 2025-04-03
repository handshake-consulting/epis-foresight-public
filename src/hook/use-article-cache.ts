'use client'

import { Article } from "@/components/chat/types";
import { getArticleDB } from "@/utils/indexedDB";
import { useCallback, useEffect, useState } from "react";

interface ArticleCacheOptions {
    maxCacheAge?: number; // Maximum age of cached articles in milliseconds (default: 24 hours)
}

export function useArticleCache(options: ArticleCacheOptions = {}) {
    const { maxCacheAge = 24 * 60 * 60 * 1000 } = options; // Default: 24 hours
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize the IndexedDB on component mount
    useEffect(() => {
        const initDB = async () => {
            const db = getArticleDB();
            const success = await db.init();
            setIsInitialized(success);

            if (success) {
                // Clean up old cached articles
                cleanupOldCache();
            }
        };

        initDB();
    }, []);

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
        }
    }, [maxCacheAge]);

    // Cache an article
    const cacheArticle = useCallback(async (article: Article): Promise<boolean> => {
        if (!isInitialized) return false;

        try {
            const db = getArticleDB();
            const cachedArticle = {
                ...article,
                cachedAt: Date.now()
            };

            return await db.set(cachedArticle);
        } catch (error) {
            console.error("Error caching article:", error);
            return false;
        }
    }, [isInitialized]);

    // Get an article from cache
    const getCachedArticle = useCallback(async (articleId: string): Promise<Article | null> => {
        if (!isInitialized) return null;

        try {
            const db = getArticleDB();
            const article = await db.get<Article & { cachedAt: number }>(articleId);

            if (!article) return null;

            // Check if article is expired
            const now = Date.now();
            if ((now - article.cachedAt) > maxCacheAge) {
                // Delete expired article
                await db.delete(articleId);
                return null;
            }

            // Return article without the cachedAt property
            const { cachedAt, ...cachedArticle } = article;
            return cachedArticle;
        } catch (error) {
            console.error("Error getting cached article:", error);
            return null;
        }
    }, [isInitialized, maxCacheAge]);

    // Delete an article from cache
    const deleteCachedArticle = useCallback(async (articleId: string): Promise<boolean> => {
        if (!isInitialized) return false;

        try {
            const db = getArticleDB();
            return await db.delete(articleId);
        } catch (error) {
            console.error("Error deleting cached article:", error);
            return false;
        }
    }, [isInitialized]);

    // Clear all cached articles
    const clearArticleCache = useCallback(async (): Promise<boolean> => {
        if (!isInitialized) return false;

        try {
            const db = getArticleDB();
            return await db.clear();
        } catch (error) {
            console.error("Error clearing article cache:", error);
            return false;
        }
    }, [isInitialized]);

    return {
        isInitialized,
        cacheArticle,
        getCachedArticle,
        deleteCachedArticle,
        clearArticleCache
    };
}
