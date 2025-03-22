"use client"

import { ChatSession } from "@/components/chat/types";
import { getSessionsList } from "@/data/getSession";
import { useQuery } from "@tanstack/react-query";

export const useSessions = () => {
    return useQuery<ChatSession[]>({
        queryKey: ['sessions', 'all'],
        queryFn: () => getSessionsList({ fetchAll: true }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
    });
};
