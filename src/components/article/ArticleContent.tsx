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
                <div className="mb-4 text-sm flex items-center justify-end">
                    <div className="flex items-center gap-2 text-[#8a7e66] italic font-serif">
                        <span className="text-xs">
                            {new Date(version.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                        <span>•</span>
                        <span className="bg-[#f5f1e6] px-2 py-1 rounded-full border border-[#e8e1d1] text-xs">
                            Version {version.versionNumber}
                        </span>
                        {isLatestVersion && (
                            <span className="bg-[#f5f1e6] text-[#8a7e66] px-2 py-1 rounded-full border border-[#e8e1d1] text-xs">
                                Latest
                            </span>
                        )}
                    </div>
                </div>

                {/* Edit prompt if available */}
                {version.editPrompt && version.versionNumber > 1 && (
                    <div className="mb-6 bg-[#f5f1e6] p-4 rounded-lg border border-[#e8e1d1] italic font-serif">
                        <div className="text-sm font-medium text-[#5d5545] mb-1">Edit prompt:</div>
                        <div className="text-[#5d5545]">{version.editPrompt}</div>
                    </div>
                )}

                {/* Book-like container */}
                <div className="bg-white border border-[#e8e1d1] rounded-lg shadow-md p-8 mb-8 relative">
                    {/* Decorative book elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-[#e8e1d1] to-transparent opacity-30"></div>
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-t from-[#e8e1d1] to-transparent opacity-30"></div>

                    {/* Page number */}
                    <div className="absolute bottom-2 right-4 text-[#8a7e66] font-serif text-sm italic">
                        {version.versionNumber}
                    </div>

                    {/* Article content with book-like styling */}
                    <div className="prose prose-lg max-w-none">
                        <ArticleMarkdownRender text={version.content} />
                    </div>
                </div>
            </div>
        </div>
    );
}
