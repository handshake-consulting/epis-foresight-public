"use client"

import { ImageMessage } from "@/components/chat/types";
import { HelpCircle, X } from "lucide-react";
import Image from "next/image";
import { RefObject, useEffect, useState } from "react";

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
    settings?: {
        fontFamily?: string;
        fontSize?: number;
        lineHeight?: number;
        textAlign?: string;
    };
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
    onImageLoad,
    settings
}: RegularViewProps) {
    // State to store the measured header height
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    // Effect to measure header height and update on window resize
    useEffect(() => {
        const measureHeaderHeight = () => {
            const headerElement = document.querySelector('header');
            if (headerElement) {
                const height = headerElement.getBoundingClientRect().height;
                setHeaderHeight(height);
            }
        };

        // Initial measurement
        measureHeaderHeight();

        // Set up resize listener
        window.addEventListener('resize', measureHeaderHeight);

        // Cleanup
        return () => {
            window.removeEventListener('resize', measureHeaderHeight);
        };
    }, []);

    return (
        <div
            className={`fixed right-0 bottom-0 z-10 ${theme.bg} ${theme.text} shadow-xl border-l ${theme.tabBorder} transition-all duration-300 ease-in-out flex`}
            style={{
                width,
                marginBottom: "-1px",
                top: `${headerHeight}px` // Dynamic positioning based on measured header height
            }}
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
                <div className="flex items-center justify-center gap-2 p-2">
                    <div style={{ transform: 'rotate(90deg)' }}>
                        <HelpCircle className={`h-4 w-4 ${theme.iconColor}`} />
                    </div>
                    <div className={`text-sm font-medium ${theme.iconColor} flex items-center`}>
                        About
                    </div>
                </div>
            </div>

            {/* Image slider (only visible when open) */}
            {isOpen && (
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4 flex flex-col relative">
                        {/* Close button positioned in top right */}
                        <button
                            onClick={onToggle}
                            className={`absolute top-2 right-2 rounded-full p-1.5 ${theme.iconColor} ${theme.hoverColor} transition-colors duration-200 z-10`}
                            aria-label="Close gallery"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Static content about the book */}
                        <div className="relative flex-1 flex flex-col items-center justify-center text-center gap-6 p-4 overflow-y-auto">
                            <p
                                className={`mb-4 ${theme.text}`}
                                style={{
                                    fontFamily: settings?.fontFamily,
                                    fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
                                    lineHeight: settings?.lineHeight,
                                }}
                            >
                                This generative e-book prototype app is based on:
                            </p>

                            <div className="relative w-[230px] h-[307px] mb-4">
                                <Image
                                    src="/LeadersMaketheFuture_Cover Final.jpg"
                                    alt="Leaders Make the Future Book Cover"
                                    fill
                                    sizes="(max-width: 768px) 0px, 230px"
                                    style={{ objectFit: 'contain' }}
                                    priority
                                />
                            </div>

                            <p
                                className={`${theme.text}`}
                                style={{
                                    fontFamily: settings?.fontFamily,
                                    fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
                                    lineHeight: settings?.lineHeight,
                                }}
                            >
                                If you find this app interesting, you&apos;ll love the original book.
                                <a
                                    href="https://www.amazon.com/Leaders-Make-Future-Third-Leadership/dp/B0D66H9BF1/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-2 text-blue-600 hover:underline"
                                    style={{
                                        fontFamily: settings?.fontFamily,
                                        fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
                                        lineHeight: settings?.lineHeight,
                                    }}
                                >
                                    Buy it here
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
