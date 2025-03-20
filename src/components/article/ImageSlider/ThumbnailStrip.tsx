"use client"

import { ImageMessage } from "@/components/chat/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { RefObject } from "react";

interface ThumbnailStripProps {
    images: ImageMessage[];
    currentIndex: number;
    isLoading: boolean;
    pagination: {
        page: number;
        totalPages: number;
    };
    theme: any;
    containerRef: RefObject<HTMLDivElement | null>;
    onThumbnailClick: (index: number) => void;
    onScroll: (direction: 'left' | 'right') => void;
    isFullscreen?: boolean;
}

export function ThumbnailStrip({
    images,
    currentIndex,
    isLoading,
    pagination,
    theme,
    containerRef,
    onThumbnailClick,
    onScroll,
    isFullscreen = false
}: ThumbnailStripProps) {
    const thumbnailSize = isFullscreen ? 'h-14 w-14' : 'h-12 w-12';
    const padding = isFullscreen ? 'px-4' : 'px-2';
    const rightOffset = isFullscreen ? 'right-12' : 'right-8';
    const moreIndicatorOffset = isFullscreen ? 'right-16' : 'right-2';
    const scrollButtonClasses = isFullscreen
        ? `px-2 border-${isFullscreen ? 'r' : 'l'} ${theme.tabBorder}`
        : 'px-1.5 rounded-l-lg';

    return (
        <div className="relative h-full flex items-center px-8">
            {/* Left scroll button */}
            <button
                onClick={() => onScroll('left')}
                className={`absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center ${theme.scrollButtonBg} ${theme.scrollButtonHover} transition-colors duration-200 ${scrollButtonClasses}`}
                aria-label="Scroll thumbnails left"
            >
                <ChevronLeft className={isFullscreen ? "h-5 w-5" : "h-4 w-4"} />
            </button>

            {/* Fixed width container with horizontal scroll */}
            <div
                ref={containerRef}
                className={`w-full h-full overflow-x-auto ${theme.scrollbar} scrollbar-none`}
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    maxWidth: isFullscreen ? '90%' : '500px',
                    margin: '0 auto'
                }}
            >
                {/* Gradient overlay for "More" indicator */}
                {pagination.page < pagination.totalPages && !isLoading && (
                    <div className={`absolute ${rightOffset} top-0 bottom-0 w-16 bg-gradient-to-l ${theme.gradientFrom} to-transparent z-10`}></div>
                )}

                <div className={`flex gap-2 py-2 ${padding} w-max`}>
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => onThumbnailClick(index)}
                            className={`relative ${thumbnailSize} rounded border ${index === currentIndex
                                ? theme.thumbActive
                                : `${theme.thumbBorder} ${theme.thumbHover}`
                                } overflow-hidden transition-all duration-200 flex-shrink-0`}
                            aria-label={`View image ${index + 1}`}
                        >
                            {/* Loading indicator for thumbnails */}
                            {!image.imageUrl && (
                                <div className={`absolute inset-0 flex items-center justify-center ${theme.thumbBg}`}>
                                    <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${theme.iconColor}`}></div>
                                </div>
                            )}
                            <Image
                                src={image.imageUrl || ''}
                                alt={`Thumbnail ${index + 1}`}
                                className="object-cover"
                                fill
                                sizes={isFullscreen ? "56px" : "48px"}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Right scroll button */}
            <button
                onClick={() => onScroll('right')}
                className={`absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center ${theme.scrollButtonBg} ${theme.scrollButtonHover} transition-colors duration-200 ${isFullscreen ? `border-l ${theme.tabBorder} px-2` : 'px-1.5 rounded-r-lg'}`}
                aria-label="Scroll thumbnails right"
            >
                <ChevronRight className={isFullscreen ? "h-5 w-5" : "h-4 w-4"} />
            </button>

            {/* "More" indicator positioned on top of the gradient */}
            {pagination.page < pagination.totalPages && !isLoading && (
                <div className={`absolute ${moreIndicatorOffset} top-0 bottom-0 flex items-center justify-center z-30`}>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${theme.counterBg} text-white text-xs shadow-md`}>
                        <span>More</span>
                        <ChevronRight className="h-3 w-3" />
                    </div>
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div className={`absolute ${moreIndicatorOffset} top-0 bottom-0 flex items-center justify-center z-20`}>
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
}
