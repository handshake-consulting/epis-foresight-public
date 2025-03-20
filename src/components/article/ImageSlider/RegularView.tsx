"use client"

import { ImageMessage } from "@/components/chat/types";
import { ChevronRight, Download, Expand, Image as ImageIcon, X } from "lucide-react";
import { RefObject } from "react";
import { ImageDisplay } from "./ImageDisplay";
import { NavigationControls } from "./NavigationControls";
import { ThumbnailStrip } from "./ThumbnailStrip";

interface RegularViewProps {
    images: ImageMessage[];
    currentIndex: number;
    isLoading: boolean;
    imageLoading: boolean;
    isTransitioning: boolean;
    pagination: {
        page: number;
        totalPages: number;
    };
    theme: any;
    isOpen: boolean;
    width: string;
    thumbnailContainerRef: RefObject<HTMLDivElement | null>;
    onThumbnailClick: (index: number) => void;
    onScroll: (direction: 'left' | 'right') => void;
    onPrevious: (e?: React.MouseEvent) => void;
    onNext: (e?: React.MouseEvent) => void;
    onDownload: () => void;
    onFullscreen: () => void;
    onToggle: () => void;
    onImageLoadStart: () => void;
    onImageLoad: () => void;
}

export function RegularView({
    images,
    currentIndex,
    isLoading,
    imageLoading,
    isTransitioning,
    pagination,
    theme,
    isOpen,
    width,
    thumbnailContainerRef,
    onThumbnailClick,
    onScroll,
    onPrevious,
    onNext,
    onDownload,
    onFullscreen,
    onToggle,
    onImageLoadStart,
    onImageLoad
}: RegularViewProps) {
    return (
        <div
            className={`fixed right-0 top-16 bottom-16 z-10 ${theme.bg} ${theme.text} shadow-xl border-l ${theme.tabBorder} transition-all duration-300 ease-in-out flex`}
            style={{ width }}
        >
            {/* Vertical tab */}
            <div
                className={`h-full w-12 flex flex-col items-center justify-center cursor-pointer border-r ${theme.tabBg} ${theme.tabBorder} transition-colors duration-200`}
                onClick={onToggle}
                style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)'
                }}
            >
                <div className="flex items-center p-2">
                    <ImageIcon className={`h-4 w-4 mb-2 ${theme.iconColor}`} />
                    <div className={`text-sm font-medium ${theme.iconColor} flex items-center`}>
                        {images.length} {images.length === 1 ? 'Image' : 'Images'}
                        {pagination.page < pagination.totalPages && (
                            <span className="flex items-center ml-1" title="More images available">
                                <span className="text-xs">+</span>
                                <ChevronRight className="h-3 w-3" />
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Image slider (only visible when open) */}
            {isOpen && (
                <div className="flex-1 flex flex-col">
                    <div className={`flex justify-between items-center p-4 border-b ${theme.tabBorder}`}>
                        <h3 className={`text-lg font-semibold ${theme.text}`}>Gallery</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={onDownload}
                                className={`rounded-full p-1.5 ${theme.iconColor} ${theme.hoverColor} transition-colors duration-200`}
                                aria-label="Download image"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                            <button
                                onClick={onFullscreen}
                                className={`rounded-full p-1.5 ${theme.iconColor} ${theme.hoverColor} transition-colors duration-200`}
                                aria-label="View fullscreen"
                            >
                                <Expand className="h-4 w-4" />
                            </button>
                            <button
                                onClick={onToggle}
                                className={`rounded-full p-1.5 ${theme.iconColor} ${theme.hoverColor} transition-colors duration-200`}
                                aria-label="Close gallery"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-4 flex flex-col">
                        {/* Main image display with loading indicator */}
                        <div className="relative flex-1">
                            <ImageDisplay
                                image={images[currentIndex]}
                                isLoading={isLoading}
                                imageLoading={imageLoading}
                                isTransitioning={isTransitioning}
                                theme={theme}
                                onLoadStart={onImageLoadStart}
                                onLoad={onImageLoad}
                            />

                            {/* Navigation controls */}
                            {images.length > 1 && (
                                <NavigationControls
                                    currentIndex={currentIndex}
                                    totalImages={images.length}
                                    hasMoreImages={pagination.page < pagination.totalPages}
                                    theme={theme}
                                    onPrevious={onPrevious}
                                    onNext={onNext}
                                />
                            )}
                        </div>

                        {/* Improved thumbnail strip with fixed width container and scroll buttons */}
                        {images.length > 1 && (
                            <div className={`mt-4 h-16 ${theme.thumbBg} rounded-lg border ${theme.thumbBorder} relative`}>
                                <ThumbnailStrip
                                    images={images}
                                    currentIndex={currentIndex}
                                    isLoading={isLoading}
                                    pagination={pagination}
                                    theme={theme}
                                    containerRef={thumbnailContainerRef}
                                    onThumbnailClick={onThumbnailClick}
                                    onScroll={onScroll}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
