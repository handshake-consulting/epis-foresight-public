"use client"

import { ChatSession } from "@/components/chat/types";
import { getSessionsList } from "@/data/getSession";
import { cacheSessions, getCachedSessions, getLastCacheUpdate } from "@/utils/indexedDB/articleCache";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const useSessions = () => {
    // State to hold placeholder data
    const [placeholderData, setPlaceholderData] = useState<ChatSession[] | undefined>(undefined);

    // Load cached data on component mount
    useEffect(() => {
        const loadCachedData = async () => {
            try {
                const lastUpdate = await getLastCacheUpdate();
                const cachedData = await getCachedSessions();

                // Only use cache if it's not too old (less than 1 hour)
                if (lastUpdate && cachedData.length > 0) {
                    const cacheAge = Date.now() - lastUpdate.getTime();
                    if (cacheAge < 1000 * 60 * 60) { // 1 hour
                        console.log('Using cached sessions for initial data');
                        setPlaceholderData(cachedData);
                    }
                }
            } catch (error) {
                console.error('Error getting initial cached data:', error);
            }
        };

        loadCachedData();
    }, []);

    return useQuery<ChatSession[]>({
        queryKey: ['sessions', 'all'],
        queryFn: async () => {
            try {
                // Try to get data from server
                const serverData = await getSessionsList({ fetchAll: true });

                // Cache the data for offline use
                if (serverData && serverData.length > 0) {
                    await cacheSessions(serverData);
                }

                return serverData;
            } catch (error) {
                console.error('Error fetching sessions from server:', error);

                // If server fetch fails, try to get from cache
                const cachedData = await getCachedSessions();
                if (cachedData && cachedData.length > 0) {
                    console.log('Using cached sessions data');
                    return cachedData;
                }

                // If both fail, return empty array
                return [];
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
        placeholderData, // Use the state variable directly
    });
};
