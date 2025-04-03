'use client'

// Database configuration
const DB_NAME = 'epi-forsight-db';
const DB_VERSION = 2; // Increment version to trigger onupgradeneeded

// Store names
export const STORES = {
    SESSIONS: 'sessions',
    ARTICLES: 'articles',
    ARTICLE_VERSIONS: 'article_versions',
};

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event);
            reject('Error opening IndexedDB');
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create stores if they don't exist
            if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
                const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
                sessionsStore.createIndex('user_id', 'user_id', { unique: false });
                sessionsStore.createIndex('updated_at', 'updated_at', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.ARTICLES)) {
                const articlesStore = db.createObjectStore(STORES.ARTICLES, { keyPath: 'id' });
                articlesStore.createIndex('user_id', 'user_id', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.ARTICLE_VERSIONS)) {
                const versionsStore = db.createObjectStore(STORES.ARTICLE_VERSIONS, {
                    keyPath: ['article_id', 'versionNumber']
                });
                // Make sure the article_id index is properly created
                versionsStore.createIndex('article_id', 'article_id', { unique: false });
                console.log('Created article_versions store with article_id index');
            }
        };
    });
};

// Generic function to add or update an item in a store
export const setItem = async <T>(storeName: string, item: T): Promise<T> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => {
            resolve(item);
        };

        request.onerror = (event) => {
            console.error(`Error storing item in ${storeName}:`, event);
            reject(`Failed to store item in ${storeName}`);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

// Generic function to get an item from a store
export const getItem = async <T>(storeName: string, key: string | [string, number]): Promise<T | null> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = (event) => {
            console.error(`Error getting item from ${storeName}:`, event);
            reject(`Failed to get item from ${storeName}`);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

// Generic function to get all items from a store
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = (event) => {
            console.error(`Error getting all items from ${storeName}:`, event);
            reject(`Failed to get all items from ${storeName}`);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

// Get items by index
export const getItemsByIndex = async <T>(
    storeName: string,
    indexName: string,
    value: string | number
): Promise<T[]> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = (event) => {
            console.error(`Error getting items by index from ${storeName}:`, event);
            reject(`Failed to get items by index from ${storeName}`);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

// Delete an item from a store
export const deleteItem = async (storeName: string, key: string | [string, number]): Promise<void> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error deleting item from ${storeName}:`, event);
            reject(`Failed to delete item from ${storeName}`);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

// Clear all items from a store
export const clearStore = async (storeName: string): Promise<void> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error clearing store ${storeName}:`, event);
            reject(`Failed to clear store ${storeName}`);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};
