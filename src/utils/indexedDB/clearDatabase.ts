'use client'

import { STORES, initDB } from ".";

// Function to clear all data from IndexedDB
export const clearAllData = async (): Promise<void> => {
    try {
        console.log('Clearing all IndexedDB data...');

        // Get all store names
        const storeNames = Object.values(STORES);

        // Open database
        const db = await initDB();

        // Create a transaction for all stores
        const transaction = db.transaction(storeNames, 'readwrite');

        // Clear each store
        for (const storeName of storeNames) {
            const store = transaction.objectStore(storeName);
            store.clear();
            console.log(`Cleared store: ${storeName}`);
        }

        // Return a promise that resolves when the transaction completes
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log('All stores cleared successfully');
                db.close();
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('Error clearing stores:', event);
                db.close();
                reject(new Error('Failed to clear stores'));
            };
        });
    } catch (error) {
        console.error('Error in clearAllData:', error);
        throw error;
    }
};

// Function to delete and recreate the database
export const resetDatabase = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            console.log('Resetting IndexedDB database...');

            // Request to delete the database
            const deleteRequest = indexedDB.deleteDatabase('epi-forsight-db');

            deleteRequest.onsuccess = async () => {
                console.log('Database deleted successfully');

                try {
                    // Reinitialize the database
                    await initDB();
                    console.log('Database recreated successfully');
                    resolve();
                } catch (error) {
                    console.error('Error recreating database:', error);
                    reject(error);
                }
            };

            deleteRequest.onerror = (event) => {
                console.error('Error deleting database:', event);
                reject(new Error('Failed to delete database'));
            };

            deleteRequest.onblocked = () => {
                console.warn('Database deletion blocked. Close all other tabs/connections and try again.');
                reject(new Error('Database deletion blocked'));
            };
        } catch (error) {
            console.error('Error in resetDatabase:', error);
            reject(error);
        }
    });
};
