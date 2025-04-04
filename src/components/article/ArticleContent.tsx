"use client"

import { ArticleVersion } from "@/components/chat/types";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useEffect, useRef } from "react";
import { useSettingsStore } from '../../store/settingsStore';
import { ArticleMarkdownRender } from "./ArticleMarkdownRender";

interface ArticleContentProps {
    version: ArticleVersion;
    isLatestVersion?: boolean;
    isStreaming?: boolean;
}

export function ArticleContent({
    version,
    isLatestVersion,
    isStreaming = false
}: ArticleContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const { settings } = useSettingsStore();

    // Scroll to top when version changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [version.versionNumber]);

    // Apply settings as inline styles
    const contentStyle = {
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
    };

    // Prepare content with image if available
    const prepareContent = () => {
        // Check if there are images for this version
        if (version.images && version.images.length > 0 && version.images[0].imageUrl) {
            // Get the first image
            const firstImage = version.images[0];

            // Create markdown for the image to be displayed on desktop
            // The image component in ArticleMarkdownRender will handle hiding on mobile
            const imageMarkdown = `![Article illustration](${firstImage.imageUrl})\n\n`;

            // Prepend the image markdown to the article content
            return imageMarkdown + version.content;
        }

        // Return original content if no images
        return version.content;
    };

    return (
        <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-4 py-6 bg-[#fcf9f2]"
            style={contentStyle}
        >
            <div className="max-w-3xl mx-auto">
                {/* Version indicator */}
                <div className="mb-4 text-sm flex items-center justify-end">
                    <div className="flex items-center gap-2 text-[#8a7e66] italic font-serif">
                        {isLatestVersion ? (
                            <span>Latest version</span>
                        ) : (
                            <span>Version {version.versionNumber}</span>
                        )}
                    </div>
                </div>

                {/* Streaming indicator */}
                {isStreaming && (
                    <div className="mb-8">
                        <ProgressBar
                            className="mb-2"
                            label="This may take 15-30 seconds"
                        />
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
                    <div className="prose prose-lg max-w-none" style={contentStyle}>
                        <ArticleMarkdownRender text={prepareContent()} />
                    </div>
                </div>
            </div>
        </div>
    );
}
