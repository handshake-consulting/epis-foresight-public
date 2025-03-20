"use client"

import { ImageMessage } from "@/components/chat/types";
import { Download, X } from "lucide-react";
import { RefObject } from "react";
import { ImageDisplay } from "./ImageDisplay";
import { NavigationControls } from "./NavigationControls";
import { ThumbnailStrip } from "./ThumbnailStrip";

interface FullscreenViewProps {
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
    fullscreenThumbnailContainerRef: RefObject<HTMLDivElement | null>;
    onThumbnailClick: (index: number) => void;
    onScroll: (direction: 'left' | 'right', isFullscreen: boolean) => void;
    onPrevious: () => void;
    onNext: () => void;
    onDownload: () => void;
    onExitFullscreen: () => void;
    onImageLoadStart: () => void;
    onImageLoad: () => void;
}

export function FullscreenView({
    images,
    currentIndex,
    isLoading,
    imageLoading,
    isTransitioning,
    pagination,
    theme,
    fullscreenThumbnailContainerRef,
    onThumbnailClick,
    onScroll,
    onPrevious,
    onNext,
    onDownload,
    onExitFullscreen,
    onImageLoadStart,
    onImageLoad
}: FullscreenViewProps) {
    return (
        <div className={`fixed inset-0 z-50 ${theme.bg} ${theme.text} flex flex-col items-center justify-center`}>
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={onDownload}
                    className={`rounded-full p-2 ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200`}
                    aria-label="Download image"
                >
                    <Download className="h-5 w-5" />
                </button>
                <button
                    onClick={onExitFullscreen}
                    className={`rounded-full p-2 ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200`}
                    aria-label="Exit fullscreen"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center p-8">
                <ImageDisplay
                    image={images[currentIndex]}
                    isLoading={isLoading}
                    imageLoading={imageLoading}
                    isTransitioning={isTransitioning}
                    theme={theme}
                    onLoadStart={onImageLoadStart}
                    onLoad={onImageLoad}
                    isFullscreen={true}
                />

                {images.length > 1 && (
                    <NavigationControls
                        currentIndex={currentIndex}
                        totalImages={images.length}
                        hasMoreImages={pagination.page < pagination.totalPages}
                        theme={theme}
                        onPrevious={onPrevious}
                        onNext={onNext}
                        isFullscreen={true}
                    />
                )}
            </div>

            {/* Thumbnail strip in fullscreen */}
            {images.length > 1 && (
                <div className={`absolute bottom-0 left-0 right-0 h-20 ${theme.tabBg} border-t ${theme.tabBorder}`}>
                    <ThumbnailStrip
                        images={images}
                        currentIndex={currentIndex}
                        isLoading={isLoading}
                        pagination={pagination}
                        theme={theme}
                        containerRef={fullscreenThumbnailContainerRef}
                        onThumbnailClick={onThumbnailClick}
                        onScroll={(direction) => onScroll(direction, true)}
                        isFullscreen={true}
                    />
                </div>
            )}
        </div>
    );
}
