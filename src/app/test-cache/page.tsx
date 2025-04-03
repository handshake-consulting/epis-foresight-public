'use client'

import { useArticle } from "@/hook/use-article";
import { useArticleCache } from "@/hook/use-article-cache";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { useEffect, useState } from "react";

export default function TestCachePage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [cacheStatus, setCacheStatus] = useState<string>('');

    // Initialize article hook
    const {
        article,
        loadArticleSession,
        resetArticle
    } = useArticle();

    // Initialize cache hook
    const {
        isInitialized,
        cacheArticle,
        getCachedArticle,
        deleteCachedArticle,
        clearArticleCache
    } = useArticleCache();

    // Initialize user on component mount
    useEffect(() => {
        const initUser = async () => {
            const { user } = await getCurrentAuthState();
            if (user) {
                setUserId(user.uid);
            } else {
                setMessage('Please log in to use this feature');
            }
        };

        initUser();
    }, []);

    // Load article from database
    const handleLoadFromDB = async () => {
        if (!userId || !sessionId) {
            setMessage('Please enter a session ID and ensure you are logged in');
            return;
        }

        setLoading(true);
        setMessage('Loading article from database...');

        try {
            // Reset article state first
            resetArticle();

            // Force load from database by clearing cache first
            if (isInitialized) {
                await deleteCachedArticle(sessionId);
            }

            await loadArticleSession(sessionId, userId);
            setMessage('Article loaded from database successfully');
        } catch (error) {
            console.error('Error loading article:', error);
            setMessage(`Error loading article: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Load article from cache
    const handleLoadFromCache = async () => {
        if (!sessionId) {
            setMessage('Please enter a session ID');
            return;
        }

        setLoading(true);
        setMessage('Loading article from cache...');

        try {
            if (!isInitialized) {
                setMessage('Cache is not initialized yet');
                return;
            }

            const cachedArticle = await getCachedArticle(sessionId);
            if (cachedArticle) {
                setMessage('Article found in cache');
                setCacheStatus(JSON.stringify(cachedArticle, null, 2));
            } else {
                setMessage('Article not found in cache');
                setCacheStatus('');
            }
        } catch (error) {
            console.error('Error checking cache:', error);
            setMessage(`Error checking cache: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Clear article from cache
    const handleClearFromCache = async () => {
        if (!sessionId) {
            setMessage('Please enter a session ID');
            return;
        }

        setLoading(true);
        setMessage('Clearing article from cache...');

        try {
            if (!isInitialized) {
                setMessage('Cache is not initialized yet');
                return;
            }

            const success = await deleteCachedArticle(sessionId);
            if (success) {
                setMessage('Article cleared from cache successfully');
                setCacheStatus('');
            } else {
                setMessage('Failed to clear article from cache');
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
            setMessage(`Error clearing cache: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Clear all articles from cache
    const handleClearAllCache = async () => {
        setLoading(true);
        setMessage('Clearing all articles from cache...');

        try {
            if (!isInitialized) {
                setMessage('Cache is not initialized yet');
                return;
            }

            const success = await clearArticleCache();
            if (success) {
                setMessage('All articles cleared from cache successfully');
                setCacheStatus('');
            } else {
                setMessage('Failed to clear all articles from cache');
            }
        } catch (error) {
            console.error('Error clearing all cache:', error);
            setMessage(`Error clearing all cache: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Article Cache Test</h1>

            <div className="mb-4">
                <p>Cache Initialized: <span className="font-semibold">{isInitialized ? 'Yes' : 'No'}</span></p>
                <p>User ID: <span className="font-semibold">{userId || 'Not logged in'}</span></p>
            </div>

            <div className="mb-4">
                <label className="block mb-2">Session ID:</label>
                <input
                    type="text"
                    value={sessionId || ''}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="border p-2 w-full mb-2"
                    placeholder="Enter session ID"
                />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={handleLoadFromDB}
                    disabled={loading || !userId || !sessionId}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Load from Database
                </button>

                <button
                    onClick={handleLoadFromCache}
                    disabled={loading || !sessionId}
                    className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Check Cache
                </button>

                <button
                    onClick={handleClearFromCache}
                    disabled={loading || !sessionId}
                    className="bg-yellow-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Clear from Cache
                </button>

                <button
                    onClick={handleClearAllCache}
                    disabled={loading}
                    className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Clear All Cache
                </button>
            </div>

            {message && (
                <div className="mb-4 p-2 bg-gray-100 border rounded">
                    <p>{message}</p>
                </div>
            )}

            {article && (
                <div className="mb-4">
                    <h2 className="text-xl font-bold mb-2">Current Article</h2>
                    <div className="p-2 bg-gray-100 border rounded">
                        <p><strong>Title:</strong> {article.title}</p>
                        <p><strong>ID:</strong> {article.id}</p>
                        <p><strong>Versions:</strong> {article.versions.length}</p>
                    </div>
                </div>
            )}

            {cacheStatus && (
                <div className="mb-4">
                    <h2 className="text-xl font-bold mb-2">Cache Status</h2>
                    <pre className="p-2 bg-gray-100 border rounded overflow-auto max-h-96">
                        {cacheStatus}
                    </pre>
                </div>
            )}
        </div>
    );
}
