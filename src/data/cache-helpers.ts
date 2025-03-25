import { cache } from "react";

// Create a segmented cache function that includes the user ID in the cache key
export function createUserSegmentedCache<T>(fn: (uid: string, ...args: any[]) => Promise<T>) {
    return cache((uid: string, ...args: any[]) => {
        // This creates a unique cache entry per user ID and arguments
        return fn(uid, ...args);
    });
}