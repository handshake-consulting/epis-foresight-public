'use client'

import { Article, ImageMessage } from "@/components/chat/types";
import { useArticlesCache } from "@/hook/use-articles-cache";
import { getCurrentAuthState } from "@/utils/firebase/client";
import { useEffect, useState } from "react";

export default function BulkCachePage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<(Article & { cachedAt: number })[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);

    // Initialize articles cache hook
    const {
        isInitialized,
        isLoading: isCacheLoading,
        lastRefreshed,
        error: cacheError,
        refreshCache,
        getAllCachedArticles,
        searchCachedArticles,
        findArticleById
    } = useArticlesCache({
        autoRefresh: false // Disable auto-refresh for this demo
    });

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

    // Refresh all articles cache
    const handleRefreshCache = async () => {
        if (!userId) {
            setMessage('Please log in to use this feature');
            return;
        }

        setLoading(true);
        setMessage('Refreshing articles cache...');

        try {
            await refreshCache(userId);
            setMessage('Articles cache refreshed successfully');
        } catch (error) {
            console.error('Error refreshing cache:', error);
            setMessage(`Error refreshing cache: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Get all cached articles
    const handleGetAllArticles = async () => {
        setLoading(true);
        setMessage('Getting all cached articles...');

        try {
            const articles = await getAllCachedArticles();
            setSearchResults(articles);
            setMessage(`Found ${articles.length} cached articles`);
        } catch (error) {
            console.error('Error getting articles:', error);
            setMessage(`Error getting articles: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Search cached articles
    const handleSearchArticles = async () => {
        if (!searchQuery.trim()) {
            setMessage('Please enter a search query');
            return;
        }

        setLoading(true);
        setMessage(`Searching for "${searchQuery}"...`);

        try {
            const results = await searchCachedArticles(searchQuery);
            setSearchResults(results);
            setMessage(`Found ${results.length} articles matching "${searchQuery}"`);
        } catch (error) {
            console.error('Error searching articles:', error);
            setMessage(`Error searching articles: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Find article by ID
    const handleFindArticleById = async (id: string) => {
        setLoading(true);
        setMessage(`Finding article with ID: ${id}...`);

        try {
            const article = await findArticleById(id);
            if (article) {
                setSelectedArticle(article);
                // Set to the latest version by default
                setCurrentVersionIndex(article.versions.length - 1);
                setMessage(`Found article: ${article.title}`);
            } else {
                setSelectedArticle(null);
                setCurrentVersionIndex(0);
                setMessage(`No article found with ID: ${id}`);
            }
        } catch (error) {
            console.error('Error finding article:', error);
            setMessage(`Error finding article: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Navigate to previous version
    const handlePreviousVersion = () => {
        if (selectedArticle && currentVersionIndex > 0) {
            setCurrentVersionIndex(currentVersionIndex - 1);
        }
    };

    // Navigate to next version
    const handleNextVersion = () => {
        if (selectedArticle && currentVersionIndex < selectedArticle.versions.length - 1) {
            setCurrentVersionIndex(currentVersionIndex + 1);
        }
    };

    // Get current version
    const getCurrentVersion = () => {
        if (!selectedArticle || selectedArticle.versions.length === 0) {
            return null;
        }
        return selectedArticle.versions[currentVersionIndex];
    };

    // Current version
    const currentVersion = getCurrentVersion();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Bulk Articles Cache Test</h1>

            <div className="mb-4">
                <p>Cache Initialized: <span className="font-semibold">{isInitialized ? 'Yes' : 'No'}</span></p>
                <p>User ID: <span className="font-semibold">{userId || 'Not logged in'}</span></p>
                {lastRefreshed && (
                    <p>Last Refreshed: <span className="font-semibold">{lastRefreshed.toLocaleString()}</span></p>
                )}
                {cacheError && (
                    <p className="text-red-500">Error: {cacheError}</p>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={handleRefreshCache}
                    disabled={loading || isCacheLoading || !userId}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Refresh All Articles Cache
                </button>

                <button
                    onClick={handleGetAllArticles}
                    disabled={loading || isCacheLoading}
                    className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Get All Cached Articles
                </button>
            </div>

            <div className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search articles..."
                        className="border p-2 flex-grow"
                    />
                    <button
                        onClick={handleSearchArticles}
                        disabled={loading || isCacheLoading}
                        className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                    >
                        Search
                    </button>
                </div>
            </div>

            {message && (
                <div className="mb-4 p-2 bg-gray-100 border rounded">
                    <p>{message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-1">
                    <h2 className="text-xl font-bold mb-2">Search Results</h2>
                    <div className="border rounded max-h-96 overflow-auto">
                        {searchResults.length === 0 ? (
                            <p className="p-2 text-gray-500">No results</p>
                        ) : (
                            <ul className="divide-y">
                                {searchResults.map(article => (
                                    <li
                                        key={article.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleFindArticleById(article.id)}
                                    >
                                        <p className="font-semibold">{article.title}</p>
                                        <p className="text-sm text-gray-500">ID: {article.id}</p>
                                        <p className="text-sm text-gray-500">
                                            Updated: {new Date(article.updated_at).toLocaleString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                    <h2 className="text-xl font-bold mb-2">Selected Article</h2>
                    <div className="border rounded p-4 min-h-96">
                        {selectedArticle ? (
                            <div>
                                <h3 className="text-lg font-bold">{selectedArticle.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">ID: {selectedArticle.id}</p>

                                <div className="mb-4">
                                    <p><strong>Topic:</strong> {selectedArticle.topic}</p>
                                    <p><strong>Versions:</strong> {selectedArticle.versions.length}</p>
                                    <p><strong>Created:</strong> {new Date(selectedArticle.created_at).toLocaleString()}</p>
                                    <p><strong>Updated:</strong> {new Date(selectedArticle.updated_at).toLocaleString()}</p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold">
                                            Version {currentVersion?.versionNumber || 0} Content:
                                        </h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handlePreviousVersion}
                                                disabled={!selectedArticle || currentVersionIndex <= 0}
                                                className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-2 py-1">
                                                {currentVersionIndex + 1} / {selectedArticle.versions.length}
                                            </span>
                                            <button
                                                onClick={handleNextVersion}
                                                disabled={!selectedArticle || currentVersionIndex >= selectedArticle.versions.length - 1}
                                                className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>

                                    {currentVersion?.editPrompt && (
                                        <div className="mb-2 p-2 bg-blue-50 rounded">
                                            <p className="text-sm font-semibold">Edit Prompt:</p>
                                            <p className="text-sm">{currentVersion.editPrompt}</p>
                                        </div>
                                    )}

                                    <div className="mt-2 p-2 bg-gray-100 rounded max-h-64 overflow-auto">
                                        <pre className="whitespace-pre-wrap">
                                            {currentVersion?.content || 'No content'}
                                        </pre>
                                    </div>

                                    {currentVersion?.images && currentVersion.images.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm font-semibold">Images ({currentVersion.images.length}):</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {currentVersion.images.map((img: ImageMessage, index: number) => (
                                                    <div key={img.id} className="border rounded p-1">
                                                        <p className="text-xs text-center">Image {index + 1}</p>
                                                        {img.imageUrl && (
                                                            <img
                                                                src={img.imageUrl}
                                                                alt={`Version ${currentVersion.versionNumber} Image ${index + 1}`}
                                                                className="max-w-[100px] max-h-[100px] object-contain"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No article selected</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
