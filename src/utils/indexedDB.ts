'use client'

interface IndexedDBOptions {
    dbName: string;
    storeName: string;
    version?: number;
}

export class IndexedDBService {
    private dbName: string;
    private storeName: string;
    private version: number;
    private db: IDBDatabase | null = null;

    constructor(options: IndexedDBOptions) {
        this.dbName = options.dbName;
        this.storeName = options.storeName;
        this.version = options.version || 1;
    }

    /**
     * Initialize the database
     */
    async init(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.error("Your browser doesn't support IndexedDB");
                resolve(false);
                return;
            }

            const request = window.indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error("IndexedDB error:", (event.target as IDBRequest).error);
                resolve(false);
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBRequest).result;
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Add or update an item in the store
     */
    async set<T>(item: T & { id: string }): Promise<boolean> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }

            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const request = store.put(item);

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error("Error storing item in IndexedDB:", request.error);
                    resolve(false);
                };
            } catch (error) {
                console.error("Transaction error:", error);
                resolve(false);
            }
        });
    }

    /**
     * Get an item from the store by id
     */
    async get<T>(id: string): Promise<T | null> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }

            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);

                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result || null);
                };

                request.onerror = () => {
                    console.error("Error getting item from IndexedDB:", request.error);
                    resolve(null);
                };
            } catch (error) {
                console.error("Transaction error:", error);
                resolve(null);
            }
        });
    }

    /**
     * Delete an item from the store by id
     */
    async delete(id: string): Promise<boolean> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }

            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const request = store.delete(id);

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error("Error deleting item from IndexedDB:", request.error);
                    resolve(false);
                };
            } catch (error) {
                console.error("Transaction error:", error);
                resolve(false);
            }
        });
    }

    /**
     * Clear all items from the store
     */
    async clear(): Promise<boolean> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }

            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const request = store.clear();

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error("Error clearing IndexedDB store:", request.error);
                    resolve(false);
                };
            } catch (error) {
                console.error("Transaction error:", error);
                resolve(false);
            }
        });
    }

    /**
     * Get all items from the store
     */
    async getAll<T>(): Promise<T[]> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve([]);
                return;
            }

            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);

                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error("Error getting all items from IndexedDB:", request.error);
                    resolve([]);
                };
            } catch (error) {
                console.error("Transaction error:", error);
                resolve([]);
            }
        });
    }
}

// Create a singleton instance for articles
let articleDBInstance: IndexedDBService | null = null;

export const getArticleDB = (): IndexedDBService => {
    if (!articleDBInstance) {
        articleDBInstance = new IndexedDBService({
            dbName: 'epi-forsight-articles',
            storeName: 'articles',
            version: 1
        });
    }
    return articleDBInstance;
};
