"use client"

import { ArticleVersion } from "@/components/chat/types";
import { useEffect, useRef } from "react";
import { ArticleMarkdownRender } from "./ArticleMarkdownRender";

interface ArticleContentProps {
    version: ArticleVersion;
    isLatestVersion: boolean;
}

export function ArticleContent({ version, isLatestVersion }: ArticleContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    // Scroll to top when version changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [version.versionNumber]);

    return (
        <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-4 py-6 bg-[#fcf9f2]"
        >
            <div className="max-w-3xl mx-auto">
                {/* Version indicator */}
                <div className="mb-4 text-sm text-gray-500 flex items-center">
                    <span className="bg-[#f5f1e6] px-2 py-1 rounded border border-[#e8e1d1]">
                        Version {version.versionNumber}
                    </span>
                    {isLatestVersion && (
                        <span className="ml-2 bg-[#e8f0f9] text-blue-800 px-2 py-1 rounded border border-[#d1dce8]">
                            Latest
                        </span>
                    )}
                    <span className="ml-auto text-gray-500 italic font-serif">
                        {new Date(version.timestamp).toLocaleString()}
                    </span>
                </div>

                {/* Edit prompt if available */}
                {version.editPrompt && version.versionNumber > 1 && (
                    <div className="mb-6 bg-[#f5f1e6] p-4 rounded-lg border border-[#e8e1d1] italic font-serif">
                        <div className="text-sm font-medium text-gray-600 mb-1">Edit prompt:</div>
                        <div className="text-gray-700">{version.editPrompt}</div>
                    </div>
                )}

                {/* Book-like container */}
                <div className="bg-white border border-[#e8e1d1] rounded-lg shadow-md p-8 mb-8">
                    {/* Article content with book-like styling */}
                    <div className="prose prose-lg max-w-none">
                        <ArticleMarkdownRender text={version.content} />
                    </div>
                </div>
            </div>
        </div>
    );
}
