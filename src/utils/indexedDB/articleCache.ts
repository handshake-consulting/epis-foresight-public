'use client'

import { Article, ArticleVersion, ChatSession, ImageMessage } from "@/components/chat/types";
import { STORES, deleteItem, getAllItems, getItem, getItemsByIndex, setItem } from ".";

// Cache an article
export const cacheArticle = async (article: Article): Promise<void> => {
    try {
        console.log('Caching article:', article.id, 'with', article.versions.length, 'versions');

        // Store the article metadata
        await setItem(STORES.ARTICLES, {
            id: article.id,
            title: article.title,
            topic: article.topic,
            currentVersion: article.currentVersion,
            created_at: article.created_at,
            updated_at: article.updated_at,
            image: article.image
        });

        // Clear existing versions for this article to avoid duplicates
        try {
            const existingVersions = await getItemsByIndex<ArticleVersion & { article_id: string }>(
                STORES.ARTICLE_VERSIONS,
                'article_id',
                article.id
            );

            console.log('Found', existingVersions.length, 'existing versions to clear');

            // Delete each existing version
            for (const version of existingVersions) {
                await deleteItem(STORES.ARTICLE_VERSIONS, [article.id, version.versionNumber]);
            }
        } catch (e) {
            console.warn('Error clearing existing versions:', e);
        }

        // Store each version separately
        for (const version of article.versions) {
            const versionToStore = {
                article_id: article.id,
                versionNumber: version.versionNumber,
                content: version.content,
                editPrompt: version.editPrompt,
                timestamp: version.timestamp instanceof Date ? version.timestamp : new Date(version.timestamp),
                images: version.images || []
            };

            console.log('Storing version:', versionToStore.versionNumber, 'for article:', article.id);

            await setItem(STORES.ARTICLE_VERSIONS, versionToStore);
        }

        console.log('Successfully cached article:', article.id);
    } catch (error) {
        console.error('Error caching article:', error);
    }
};

// Get a cached article by ID
export const getCachedArticle = async (articleId: string, userId?: string): Promise<Article | null> => {
    try {
        // Get article metadata
        const articleMeta = await getItem<Omit<Article, 'versions'>>(STORES.ARTICLES, articleId);
        if (!articleMeta) {
            console.log('No article metadata found in cache for ID:', articleId);
            return null;
        }

        console.log('Found article metadata in cache:', articleMeta);

        // Get all versions for this article
        console.log('About to fetch versions for article ID:', articleId);
        let versions: (ArticleVersion & { article_id: string })[] = [];

        try {
            versions = await getItemsByIndex<ArticleVersion & { article_id: string }>(
                STORES.ARTICLE_VERSIONS,
                'article_id',
                articleId
            );
            console.log('Found versions in cache:', versions.length);
        } catch (indexError) {
            console.error('Error fetching versions by index:', indexError);

            // Try to get all versions and filter manually as a fallback
            console.log('Attempting fallback: getting all versions and filtering');
            const db = await (await import('.')).initDB();
            const allVersions: (ArticleVersion & { article_id: string })[] = await new Promise((resolve) => {
                const transaction = db.transaction(STORES.ARTICLE_VERSIONS, 'readonly');
                const store = transaction.objectStore(STORES.ARTICLE_VERSIONS);
                const request = store.getAll();

                request.onsuccess = () => {
                    console.log('Got all versions:', request.result?.length || 0);
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error('Error in fallback getAll');
                    resolve([]);
                };
            });

            versions = allVersions.filter(v => v.article_id === articleId);
            console.log('Filtered versions by article_id:', versions.length);
        }

        if (versions.length === 0) {
            console.log('No versions found for article ID:', articleId);
            return null;
        }

        // Sort versions by version number
        const sortedVersions = versions
            .map(v => ({
                versionNumber: v.versionNumber,
                content: v.content,
                editPrompt: v.editPrompt,
                timestamp: v.timestamp instanceof Date ? v.timestamp : new Date(v.timestamp),
                images: v.images || []
            }))
            .sort((a, b) => a.versionNumber - b.versionNumber);
        console.log({
            ...articleMeta,
            versions: sortedVersions
        });

        // Reconstruct the full article
        return {
            ...articleMeta,
            versions: sortedVersions
        };
    } catch (error) {
        console.error('Error getting cached article:', error);
        return null;
    }
};

// Cache a list of sessions
export const cacheSessions = async (sessions: ChatSession[]): Promise<void> => {
    try {
        for (const session of sessions) {
            await setItem(STORES.SESSIONS, session);
        }
    } catch (error) {
        console.error('Error caching sessions:', error);
    }
};

// Get all cached sessions
export const getCachedSessions = async (): Promise<ChatSession[]> => {
    try {
        const sessions = await getAllItems<ChatSession>(STORES.SESSIONS);
        return sessions.sort((a, b) => {
            const dateA = new Date(a.updated_at);
            const dateB = new Date(b.updated_at);
            return dateB.getTime() - dateA.getTime(); // Sort by updated_at in descending order
        });
    } catch (error) {
        console.error('Error getting cached sessions:', error);
        return [];
    }
};

// Get cached sessions for a specific user
export const getCachedSessionsByUser = async (userId: string): Promise<ChatSession[]> => {
    try {
        const sessions = await getItemsByIndex<ChatSession>(STORES.SESSIONS, 'user_id', userId);
        return sessions.sort((a, b) => {
            const dateA = new Date(a.updated_at);
            const dateB = new Date(b.updated_at);
            return dateB.getTime() - dateA.getTime(); // Sort by updated_at in descending order
        });
    } catch (error) {
        console.error('Error getting cached sessions for user:', error);
        return [];
    }
};

// Check if we have a cached version of the data
export const hasCachedData = async (): Promise<boolean> => {
    try {
        const sessions = await getAllItems(STORES.SESSIONS);
        return sessions.length > 0;
    } catch (error) {
        console.error('Error checking cached data:', error);
        return false;
    }
};

// Get the timestamp of the last cache update
export const getLastCacheUpdate = async (): Promise<Date | null> => {
    try {
        // We'll use the most recent session update as our cache timestamp
        const sessions = await getAllItems<ChatSession>(STORES.SESSIONS);
        if (sessions.length === 0) return null;

        // Find the most recently updated session
        let latestDate = new Date(0); // Start with epoch
        for (const session of sessions) {
            const sessionDate = new Date(session.updated_at);
            if (sessionDate > latestDate) {
                latestDate = sessionDate;
            }
        }

        return latestDate;
    } catch (error) {
        console.error('Error getting last cache update:', error);
        return null;
    }
};

// Preload all articles for a user
export const preloadAllArticles = async (userId: string): Promise<void> => {
    try {
        console.log('Preloading all articles for user:', userId);

        // Create Supabase client
        const { createClient } = await import('@/utils/supabase/clients');
        const supabase = createClient();

        // Get all article sessions for this user
        const { data: sessions, error: sessionsError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'article')
            .order('updated_at', { ascending: false });

        if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError);
            return;
        }

        console.log(`Found ${sessions.length} articles to preload`);

        // Cache the sessions first
        await cacheSessions(sessions);

        // Process each session to load and cache the article data
        let successCount = 0;
        let errorCount = 0;

        for (const session of sessions) {
            try {
                // Get all messages for this session
                const { data: messages, error: messagesError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('session_id', session.id)
                    .order('created_at', { ascending: true });

                if (messagesError) {
                    console.error(`Error fetching messages for session ${session.id}:`, messagesError);
                    errorCount++;
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

                // Cache the article
                await cacheArticle(articleData);
                successCount++;

            } catch (error) {
                console.error(`Error processing article ${session.id}:`, error);
                errorCount++;
            }
        }

        console.log(`Preloading complete. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
        console.error('Error in preloadAllArticles:', error);
    }
};

// Import the uuid function
const uuidv4 = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
