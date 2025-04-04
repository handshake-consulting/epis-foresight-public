"use client"

import { useArticlePreloader } from "@/hook/use-article-preloader";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "./[id]/loading";

console.log('[ClientWrapper] Module loaded');

// Dynamic import with no SSR to avoid loading issues with client-only code
const EbookArticlePage = dynamic(() => import("./EbookArticlePage"), {
    ssr: false
});

interface ClientWrapperProps {
    initialSessionId?: string;
}

export default function ClientWrapper({ initialSessionId }: ClientWrapperProps) {
    console.log('[ClientWrapper] Rendering with initialSessionId:', initialSessionId);

    const params = useParams();
    const sessionId = initialSessionId || (params?.id as string);
    const { isArticleCached } = useArticlePreloader();
    const [isLoading, setIsLoading] = useState(true);

    console.log('[ClientWrapper] Using sessionId:', sessionId);

    // Only check cache on initial mount to avoid re-renders
    useEffect(() => {
        console.log('[ClientWrapper] Running cache check effect for sessionId:', sessionId);

        if (sessionId) {
            const startTime = performance.now();
            const cached = isArticleCached(sessionId);
            const endTime = performance.now();

            console.log(`[ClientWrapper] Article ${sessionId} cache check completed in ${(endTime - startTime).toFixed(2)}ms - Cached: ${cached}`);
            setIsLoading(!cached);
        }
    }, [sessionId]); // Intentionally remove isArticleCached from deps to avoid re-runs

    console.log('[ClientWrapper] Rendering with isLoading:', isLoading);

    return (
        <>
            {isLoading ? (
                <Loading />
            ) : null}
            <div className={isLoading ? "opacity-0" : "opacity-100"}>
                <EbookArticlePage
                    initialSessionId={sessionId}
                    skipLoadingState={!isLoading}
                />
            </div>
        </>
    );
} 