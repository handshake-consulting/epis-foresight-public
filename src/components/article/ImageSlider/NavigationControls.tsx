"use client"

import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationControlsProps {
    currentIndex: number;
    totalImages: number;
    hasMoreImages: boolean;
    theme: any;
    onPrevious: (e?: React.MouseEvent) => void;
    onNext: (e?: React.MouseEvent) => void;
    isFullscreen?: boolean;
}

export function NavigationControls({
    currentIndex,
    totalImages,
    hasMoreImages,
    theme,
    onPrevious,
    onNext,
    isFullscreen = false
}: NavigationControlsProps) {
    const buttonSize = isFullscreen ? "p-3" : "p-2";
    const iconSize = isFullscreen ? "h-6 w-6" : "h-5 w-5";
    const counterPosition = isFullscreen ? "bottom-6" : "bottom-3";
    const counterSize = isFullscreen ? "px-3 py-1.5" : "text-xs font-medium px-2.5 py-1.5";
    const plusSize = isFullscreen ? "text-sm" : "text-xs";
    const chevronSize = isFullscreen ? "h-4 w-4" : "h-3 w-3";
    const leftPosition = isFullscreen ? "left-4" : "left-2";
    const rightPosition = isFullscreen ? "right-4" : "right-2";
    const buttonOpacity = isFullscreen ? "" : "opacity-80 hover:opacity-100";

    return (
        <>
            <button
                onClick={onPrevious}
                className={`absolute ${leftPosition} top-1/2 -translate-y-1/2 rounded-full ${buttonSize} shadow-md ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200 ${buttonOpacity}`}
                aria-label="Previous image"
            >
                <ChevronLeft className={iconSize} />
            </button>
            <button
                onClick={onNext}
                className={`absolute ${rightPosition} top-1/2 -translate-y-1/2 rounded-full ${buttonSize} shadow-md ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200 ${buttonOpacity}`}
                aria-label="Next image"
            >
                <ChevronRight className={iconSize} />
            </button>

            {/* Image counter with more images indicator */}
            <div className={`absolute ${counterPosition} left-0 right-0 flex justify-center items-center`}>
                <div className={`${counterSize} rounded-full ${theme.counterBg} text-white ${!isFullscreen ? 'shadow-md' : ''} flex items-center gap-1.5`}>
                    {currentIndex + 1} / {totalImages}
                    {hasMoreImages && (
                        <span className="flex items-center ml-1" title="More images available">
                            <span className={plusSize}>+</span>
                            <ChevronRight className={chevronSize} />
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}
