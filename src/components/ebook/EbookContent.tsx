"use client"

import { ArticleVersion } from "@/components/chat/types";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BookmarkItem, useSettingsStore } from "@/store/settingsStore";
import { BookOpen, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ArticleMarkdownRender } from "../article/ArticleMarkdownRender";
import { MobileImageSlider } from "../article/ImageSlider/MobileImageSlider";
import { Button } from "../ui/button";

interface EbookContentProps {
    version: ArticleVersion;
    isLatestVersion: boolean;
    isStreaming?: boolean;
    theme: string;
    onPreviousVersion?: () => void;
    onNextVersion?: () => void;
    currentVersionNumber: number;
    totalVersions: number;
    articleId?: string;
    articleTitle?: string;
    images?: any[]; // Array of images for the MobileImageSlider
}

export function EbookContent({
    version,
    isLatestVersion,
    isStreaming = false,
    theme,
    onPreviousVersion,
    onNextVersion,
    currentVersionNumber,
    totalVersions,
    articleId = "",
    articleTitle = "Untitled Document",
    images = []
}: EbookContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const { settings, toggleBookmark, isBookmarked, isFooterOpen } = useSettingsStore();
    const [readingProgress, setReadingProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Check if current version is bookmarked
    const bookmarked = isBookmarked(articleId, version.versionNumber);

    // Fade in content when it changes
    useEffect(() => {
        setIsVisible(false); // Reset visibility

        // Slight delay to allow previous content to fade out
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 150);

        return () => clearTimeout(timer);
    }, [version.versionNumber, articleId]);

    // Scroll to top when version changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
            setReadingProgress(0);
        }
    }, [version.versionNumber]);

    // Track reading progress
    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setReadingProgress(Math.min(progress, 100));
        }
    };

    // Apply settings as inline styles
    const contentStyle = {
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        textAlign: settings.textAlign,
    };

    // Apply page margin styles
    const pageStyle = {
        padding: `${settings.pageMargin}px`,
    };

    // Prepare content with image if available
    const prepareContent = () => {
        // Check if there are images available
        if (images && images.length > 0 && images[0].imageUrl) {
            // Get the first image
            const firstImage = images[0];

            // Create markdown for the image to be displayed on desktop
            // The image component in ArticleMarkdownRender will handle hiding on mobile
            const imageMarkdown = `![Article illustration](${firstImage.imageUrl})\n\n`;

            // Prepend the image markdown to the article content
            return imageMarkdown + version.content;
        }

        // Return original content if no images
        return version.content;
    };

    // Calculate extra padding for the footer when it's expanded
    const extraPadding = isFooterOpen ? "pb-[320px]" : "pb-12";

    return (
        <div className={`flex flex-col h-full pt-16 ${extraPadding}`}>
            {/* Main content area */}
            <div
                ref={contentRef}
                className={`flex-1 overflow-y-auto px-4 py-6 ${theme === "dark"
                    ? "bg-gray-900"
                    : theme === "sepia"
                        ? "bg-amber-50"
                        : "bg-gray-50"
                    }`}
                onScroll={handleScroll}
            >
                <div
                    className={`max-w-3xl mx-auto transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={pageStyle}
                >
                    {/* Version indicator */}
                    <div className="mb-4 text-sm flex items-center justify-between">
                        <div className={`flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            } italic`}>
                            <BookOpen className="h-4 w-4" />
                            <span className="text-xs">
                                {new Date(version.timestamp).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                })}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Version navigation - fixed position at bottom */}
                            {totalVersions > 1 && (
                                <div
                                    className="flex flex-row space-x-1 items-center"
                                // className={`fixed bottom-[52px] left-0 right-0 z-40 ${theme === "dark"
                                //     ? "bg-gray-800 border-t border-gray-700"
                                //     : theme === "sepia"
                                //         ? "bg-amber-100 border-t border-amber-200"
                                //         : "bg-white border-t border-gray-200"
                                //     } py-2 px-4 flex justify-between items-center shadow-md`}

                                >
                                    <Button
                                        onClick={onPreviousVersion}
                                        disabled={currentVersionNumber <= 1}
                                        size={"icon"}
                                        variant={'outline'}
                                        className="rounded-full w-7 h-7"
                                        // className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${currentVersionNumber <= 1
                                        //     ? theme === "dark"
                                        //         ? "text-gray-600 cursor-not-allowed"
                                        //         : "text-gray-300 cursor-not-allowed"
                                        //     : theme === "dark"
                                        //         ? "text-gray-300 hover:bg-gray-700"
                                        //         : "text-gray-700 hover:bg-gray-100"
                                        //     } transition-colors`}
                                        aria-label="Previous version"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="sr-only">Previous Version</span>
                                    </Button>

                                    <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                        } italic font-medium`}>
                                        Version {currentVersionNumber} of {totalVersions}
                                    </div>

                                    <Button
                                        onClick={onNextVersion}
                                        disabled={currentVersionNumber >= totalVersions}
                                        size={"icon"}
                                        variant={'outline'}
                                        className="rounded-full h-7 w-7"
                                        // className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${currentVersionNumber >= totalVersions
                                        //     ? theme === "dark"
                                        //         ? "text-gray-600 cursor-not-allowed"
                                        //         : "text-gray-300 cursor-not-allowed"
                                        //     : theme === "dark"
                                        //         ? "text-gray-300 hover:bg-gray-700"
                                        //         : "text-gray-700 hover:bg-gray-100"
                                        //     } transition-colors`}
                                        aria-label="Next version"
                                    >
                                        <span className="sr-only">Next Version</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className={`${theme === "dark"
                                    ? "bg-gray-800 text-gray-300 border-gray-700"
                                    : "bg-white text-gray-700 border-gray-200"
                                    } px-2 py-1 rounded-full border text-xs hidden sm:block`}>
                                    Version {version.versionNumber}
                                </span>
                                {isLatestVersion && (
                                    <span className={`${theme === "dark"
                                        ? "bg-blue-900 text-blue-100 border-blue-800"
                                        : "bg-blue-50 text-blue-700 border-blue-100"
                                        } px-2 py-1 rounded-full border text-xs`}>
                                        Latest
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Edit prompt if available */}
                    {/* {version.editPrompt && version.versionNumber > 1 && (
                        <div className={`mb-6 ${theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-gray-300"
                            : "bg-gray-100 border-gray-200 text-gray-700"
                            } p-4 rounded-lg border italic`}>
                            <div className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"
                                } mb-1`}>Edit prompt:</div>
                            <div>{version.editPrompt}</div>
                        </div>
                    )} */}

                    {/* Progress bar for generation */}
                    {isStreaming && (
                        <div className={`mb-6 ${theme === "dark"
                            ? "bg-gray-800 border-gray-700"
                            : "bg-gray-100 border-gray-200"
                            } p-4 rounded-lg border`}>
                            <div className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"
                                } mb-2`}>Generating document...</div>
                            <ProgressBar
                                isLoading={true}
                                className="mb-2"
                                label="This may take 15-30 seconds"
                            />
                        </div>
                    )}

                    {/* Book-like container */}
                    <div className={`${theme === "dark"
                        ? "bg-gray-800 border-gray-700 text-gray-100"
                        : theme === "sepia"
                            ? "bg-amber-100 border-amber-200 text-amber-900"
                            : "bg-white border-gray-200 text-gray-800"
                        } border rounded-lg shadow-lg p-8 mb-8 relative`}>
                        {/* Decorative book elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-gray-200 to-transparent opacity-10"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-t from-gray-200 to-transparent opacity-10"></div>

                        {/* Bookmark button */}
                        <button
                            className={`absolute top-2 right-2 p-1 rounded-full ${bookmarked
                                ? theme === "dark"
                                    ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                                    : "text-blue-500 hover:text-blue-600 hover:bg-gray-100"
                                : theme === "dark"
                                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                } transition-colors`}
                            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this page"}
                            onClick={() => {
                                const bookmark: BookmarkItem = {
                                    articleId,
                                    versionNumber: version.versionNumber,
                                    title: articleTitle,
                                    timestamp: new Date(version.timestamp),
                                    content: version.content.substring(0, 100) + "..." // Preview content
                                };
                                toggleBookmark(bookmark);
                            }}
                        >
                            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
                        </button>

                        {/* Page number */}
                        <div className={`absolute bottom-2 right-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            } text-sm italic`}>
                            {version.versionNumber}
                        </div>

                        {/* Article content with book-like styling */}
                        <div className="prose prose-lg max-w-none" style={contentStyle}>
                            <ArticleMarkdownRender text={prepareContent()} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Image slider - only visible on mobile */}
            {images.length > 0 && (
                <div className="md:hidden">
                    <MobileImageSlider
                        initialImages={images}
                        isloaded={isStreaming}
                    />
                </div>
            )}


            {/* Reading progress indicator */}
            <div className="fixed bottom-0 left-0 right-0 h-1">
                <div
                    className={`h-full ${theme === "dark" ? "bg-blue-600" : "bg-blue-500"
                        } transition-all duration-300`}
                    style={{ width: `${readingProgress}%` }}
                ></div>
            </div>
        </div>
    );
}
