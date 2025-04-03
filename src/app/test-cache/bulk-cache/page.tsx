'use client'

import { Article, ImageMessage } from "@/components/chat/types";
import { useArticle } from "@/hook/use-article";
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
    const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(-1);
    const [prompt, setPrompt] = useState<string>('');

    // Initialize useArticle hook
    const {
        generateArticle,
        isStreaming,
        article,
        resetArticle,
        error,
        isFirstGeneration
    } = useArticle({
        callbacks: {
            onData: (data) => {
                if (data.status === "error") {
                    console.error("Stream error:", data.error);
                }
            },
            onError: (error) => console.error("Hook error:", error),
            onFinish: () => {
                setMessage('Article generation completed');
            },
        }
    });

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

    // Handle article generation
    const handleGenerateArticle = async () => {
        if (!prompt.trim()) {
            setMessage('Please enter a prompt');
            return;
        }

        if (!userId) {
            setMessage('Please log in to use this feature');
            return;
        }

        setLoading(true);
        setMessage(`Generating article for prompt: "${prompt}"...`);

        try {
            await generateArticle(prompt, userId, selectedArticle?.id, selectedArticle?.id ? false : true);
        } catch (error) {
            console.error('Error generating article:', error);
            setMessage(`Error generating article: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Reset current article
    const handleResetArticle = () => {
        resetArticle();
        setMessage('Article reset');
    };

    // Find article by ID
    const handleFindArticleById = async (id: string, index?: number) => {
        setLoading(true);
        setMessage(`Finding article with ID: ${id}...`);

        try {
            const article = await findArticleById(id);
            if (article) {
                setSelectedArticle(article);
                // Set to the latest version by default
                setCurrentVersionIndex(article.versions.length - 1);
                // Update current article index if provided
                if (index !== undefined) {
                    setCurrentArticleIndex(index);
                } else {
                    // Find index in search results
                    const foundIndex = searchResults.findIndex(a => a.id === id);
                    setCurrentArticleIndex(foundIndex);
                }
                setMessage(`Found article: ${article.title}`);
            } else {
                setSelectedArticle(null);
                setCurrentVersionIndex(0);
                setCurrentArticleIndex(-1);
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

    // Get current version from selected article
    const getSelectedVersion = () => {
        if (!selectedArticle || selectedArticle.versions.length === 0) {
            return null;
        }
        return selectedArticle.versions[currentVersionIndex];
    };

    // Get current version from generated article
    const getGeneratedVersion = () => {
        if (!article || article.versions.length === 0) {
            return null;
        }
        return article.versions[article.versions.length - 1];
    };

    // Current versions
    const selectedVersion = getSelectedVersion();
    const generatedVersion = getGeneratedVersion();

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
                {error && (
                    <p className="text-red-500">Article Error: {error}</p>
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

            <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Generate New Article</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter prompt for article generation..."
                        className="border p-2 flex-grow"
                    />
                    <button
                        onClick={handleGenerateArticle}
                        disabled={isStreaming || !userId || !prompt.trim()}
                        className="bg-orange-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                    >
                        {isStreaming ? 'Generating...' : 'Generate Article'}
                    </button>
                    <button
                        onClick={handleResetArticle}
                        disabled={isStreaming || !article}
                        className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                    >
                        Reset
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
                                        className={`p-2 hover:bg-gray-100 cursor-pointer ${article.id === selectedArticle?.id ? 'bg-blue-50' : ''}`}
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
                    {/* Selected Article from Cache - only show if no article is being generated or available */}
                    {selectedArticle && (!article && !isStreaming) && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold">Selected Article from Cache</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePreviousVersion}
                                        disabled={!selectedArticle || currentVersionIndex <= 0}
                                        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                                    >
                                        Previous Version
                                    </button>
                                    <span className="px-2 py-1">
                                        {currentVersionIndex + 1} / {selectedArticle.versions.length}
                                    </span>
                                    <button
                                        onClick={handleNextVersion}
                                        disabled={!selectedArticle || currentVersionIndex >= selectedArticle.versions.length - 1}
                                        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                                    >
                                        Next Version
                                    </button>
                                </div>
                            </div>
                            <div className="border rounded p-4 mb-4">
                                <h3 className="text-lg font-bold">{selectedArticle.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">ID: {selectedArticle.id}</p>

                                <div className="mb-4">
                                    <p><strong>Topic:</strong> {selectedArticle.topic}</p>
                                    <p><strong>Versions:</strong> {selectedArticle.versions.length}</p>
                                    <p><strong>Created:</strong> {new Date(selectedArticle.created_at).toLocaleString()}</p>
                                    <p><strong>Updated:</strong> {new Date(selectedArticle.updated_at).toLocaleString()}</p>
                                </div>

                                {selectedVersion && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold">
                                                Version {selectedVersion.versionNumber} Content:
                                            </h4>
                                        </div>

                                        {selectedVersion.editPrompt && (
                                            <div className="mb-2 p-2 bg-blue-50 rounded">
                                                <p className="text-sm font-semibold">Edit Prompt:</p>
                                                <p className="text-sm">{selectedVersion.editPrompt}</p>
                                            </div>
                                        )}

                                        <div className="mt-2 p-2 bg-gray-100 rounded max-h-64 overflow-auto">
                                            <pre className="whitespace-pre-wrap">
                                                {selectedVersion.content || 'No content'}
                                            </pre>
                                        </div>

                                        {selectedVersion.images && selectedVersion.images.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm font-semibold">Images ({selectedVersion.images.length}):</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {selectedVersion.images.map((img: ImageMessage, index: number) => (
                                                        <div key={img.id} className="border rounded p-1">
                                                            <p className="text-xs text-center">Image {index + 1}</p>
                                                            {img.imageUrl && (
                                                                <img
                                                                    src={img.imageUrl}
                                                                    alt={`Version ${selectedVersion.versionNumber} Image ${index + 1}`}
                                                                    className="max-w-[100px] max-h-[100px] object-contain"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Generated Article - only show if no article is selected from cache */}
                    {!selectedArticle && (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold">Generated Article</h2>
                                <div className="flex gap-2">
                                    {isStreaming && (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                            Streaming...
                                        </span>
                                    )}
                                    {isFirstGeneration && !isStreaming && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                            Ready for first generation
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="border rounded p-4 min-h-64">
                                {article ? (
                                    <div>
                                        <h3 className="text-lg font-bold">{article.title}</h3>
                                        <p className="text-sm text-gray-500 mb-2">ID: {article.id}</p>

                                        <div className="mb-4">
                                            <p><strong>Topic:</strong> {article.topic}</p>
                                            <p><strong>Versions:</strong> {article.versions.length}</p>
                                            <p><strong>Created:</strong> {new Date(article.created_at).toLocaleString()}</p>
                                            <p><strong>Updated:</strong> {new Date(article.updated_at).toLocaleString()}</p>
                                        </div>

                                        {generatedVersion && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold">
                                                        Version {generatedVersion.versionNumber} Content:
                                                    </h4>
                                                </div>

                                                {generatedVersion.editPrompt && (
                                                    <div className="mb-2 p-2 bg-blue-50 rounded">
                                                        <p className="text-sm font-semibold">Edit Prompt:</p>
                                                        <p className="text-sm">{generatedVersion.editPrompt}</p>
                                                    </div>
                                                )}

                                                <div className="mt-2 p-2 bg-gray-100 rounded max-h-64 overflow-auto">
                                                    <pre className="whitespace-pre-wrap">
                                                        {generatedVersion.content || 'No content'}
                                                    </pre>
                                                </div>

                                                {generatedVersion.images && generatedVersion.images.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-sm font-semibold">Images ({generatedVersion.images.length}):</p>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {generatedVersion.images.map((img: ImageMessage, index: number) => (
                                                                <div key={img.id} className="border rounded p-1">
                                                                    <p className="text-xs text-center">Image {index + 1}</p>
                                                                    {img.imageUrl && (
                                                                        <img
                                                                            src={img.imageUrl}
                                                                            alt={`Version ${generatedVersion.versionNumber} Image ${index + 1}`}
                                                                            className="max-w-[100px] max-h-[100px] object-contain"
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No article generated yet. Enter a prompt and click "Generate Article".</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
