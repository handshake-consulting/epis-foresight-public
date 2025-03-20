"use client"

import { ChatSession } from "@/components/chat/types";
import { getSessionsList } from "@/data/getSession";
import { useQuery } from "@tanstack/react-query";

export const useSessions = (page: number = 1, pageSize: number = 10) => {
    return useQuery<ChatSession[]>({
        queryKey: ['sessions', page, pageSize],
        queryFn: () => getSessionsList({ page, pageSize }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
    });
};
