"use client"

import MarkdownRender from "@/components/chat/MarkdownRender";
import { ArticleVersion } from "@/components/chat/types";
import { useEffect, useRef } from "react";

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
            className="flex-1 overflow-y-auto px-4 py-6"
        >
            <div className="max-w-3xl mx-auto">
                {/* Version indicator */}
                <div className="mb-4 text-sm text-gray-500 flex items-center">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                        Version {version.versionNumber}
                    </span>
                    {isLatestVersion && (
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Latest
                        </span>
                    )}
                    <span className="ml-auto text-gray-400">
                        {new Date(version.timestamp).toLocaleString()}
                    </span>
                </div>

                {/* Edit prompt if available */}
                {version.editPrompt && version.versionNumber > 1 && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-500 mb-1">Edit prompt:</div>
                        <div className="text-gray-700">{version.editPrompt}</div>
                    </div>
                )}

                {/* Article content */}
                <div className="prose prose-lg max-w-none">
                    <MarkdownRender text={version.content} />
                </div>
            </div>
        </div>
    );
}
