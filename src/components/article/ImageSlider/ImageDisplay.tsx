"use client"

import { ImageMessage } from "@/components/chat/types";
import Image from "next/image";

interface ImageDisplayProps {
    image: ImageMessage;
    isLoading: boolean;
    imageLoading: boolean;
    isTransitioning: boolean;
    theme: any;
    onLoadStart: () => void;
    onLoad: () => void;
    isFullscreen?: boolean;
}

export function ImageDisplay({
    image,
    isLoading,
    imageLoading,
    isTransitioning,
    theme,
    onLoadStart,
    onLoad,
    isFullscreen = false
}: ImageDisplayProps) {
    const imageSize = isFullscreen ? { width: 1200, height: 800 } : { width: 600, height: 400 };
    const loaderSize = isFullscreen ? "w-12 h-12 border-4" : "w-10 h-10 border-4";
    const imageClass = isFullscreen ? "max-h-full max-w-full object-contain" : "max-h-full max-w-full object-contain p-2";

    return (
        <div className={`${isFullscreen ? '' : 'flex-1'} relative ${!isFullscreen ? `rounded-lg overflow-hidden ${theme.imageBg} shadow-inner` : ''}`}>
            {/* Loading indicator */}
            {(isLoading || imageLoading) && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${isFullscreen ? 'bg-black/30' : `${theme.imageBg}/90`}`}>
                    <div className={`${loaderSize} border-t-transparent rounded-full animate-spin ${theme.text}`}></div>
                    <div className={`mt-3 text-sm font-medium ${isFullscreen ? 'text-white' : theme.text}`}>
                        Loading image...
                    </div>
                </div>
            )}
            <div className={`${isFullscreen ? 'relative w-full h-full' : 'w-full h-full'} flex items-center justify-center ${isTransitioning ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                <Image
                    src={image.imageUrl || ''}
                    alt={`Image`}
                    className={imageClass}
                    width={imageSize.width}
                    height={imageSize.height}
                    priority
                    quality={isFullscreen ? 100 : undefined}
                    onLoadStart={onLoadStart}
                    onLoad={onLoad}
                />
            </div>
        </div>
    );
}
