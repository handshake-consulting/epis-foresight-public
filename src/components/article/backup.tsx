"use client"

import { ImageMessage } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
import { ChevronLeft, ChevronRight, Download, Expand, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ImageSliderProps {
    images: ImageMessage[];
    isOpen?: boolean;
    onToggle?: () => void;
}

export function ImageSlider({
    images,
    isOpen = false,
    onToggle
}: ImageSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { settings } = useSettingsStore();

    // No images to display
    if (images.length === 0) {
        return null;
    }

    // Navigation functions
    const goToPrevious = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
        setTimeout(() => setIsTransitioning(false), 300);
    };

    const goToNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => setIsTransitioning(false), 300);
    };

    const handleThumbnailClick = (index: number) => {
        if (currentIndex === index || isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 300);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = images[currentIndex].imageUrl || '';
        link.download = `image-${currentIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Handle keyboard navigation
    // useEffect(() => {
    //     // Define the event handler
    //     const handleKeyDown = (e: KeyboardEvent) => {
    //         // Only process keyboard events if the slider is open
    //         if (!isOpen) return;

    //         if (e.key === 'ArrowLeft') {
    //             goToPrevious();
    //         } else if (e.key === 'ArrowRight') {
    //             goToNext();
    //         } else if (e.key === 'Escape' && isFullscreen) {
    //             setIsFullscreen(false);
    //         }
    //     };

    //     // Add the event listener
    //     window.addEventListener('keydown', handleKeyDown);

    //     // Return cleanup function
    //     return () => window.removeEventListener('keydown', handleKeyDown);
    // }, [isOpen, isFullscreen, goToPrevious, goToNext]);

    // Theme-based styling
    const getThemeStyles = () => {
        switch (settings.theme) {
            case "dark":
                return {
                    bg: "bg-gray-900",
                    text: "text-gray-100",
                    tabBg: "bg-gray-800",
                    tabBorder: "border-gray-700",
                    iconColor: "text-gray-400",
                    hoverColor: "hover:text-gray-200",
                    activeColor: "text-gray-200",
                    imageBg: "bg-gray-800",
                    buttonBg: "bg-gray-800/90",
                    buttonHover: "hover:bg-gray-700",
                    counterBg: "bg-gray-800/90",
                    thumbBg: "bg-gray-800",
                    thumbBorder: "border-gray-700",
                    thumbActive: "border-blue-500 ring-2 ring-blue-500",
                    thumbHover: "hover:border-gray-600",
                    scrollbar: "scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
                };
            case "sepia":
                return {
                    bg: "bg-amber-50",
                    text: "text-amber-900",
                    tabBg: "bg-amber-100",
                    tabBorder: "border-amber-200",
                    iconColor: "text-amber-700",
                    hoverColor: "hover:text-amber-900",
                    activeColor: "text-amber-900",
                    imageBg: "bg-amber-100",
                    buttonBg: "bg-amber-100/90",
                    buttonHover: "hover:bg-amber-200",
                    counterBg: "bg-amber-800/90",
                    thumbBg: "bg-amber-100",
                    thumbBorder: "border-amber-200",
                    thumbActive: "border-amber-600 ring-2 ring-amber-600",
                    thumbHover: "hover:border-amber-300",
                    scrollbar: "scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-100"
                };
            default: // light
                return {
                    bg: "bg-white",
                    text: "text-gray-800",
                    tabBg: "bg-gray-50",
                    tabBorder: "border-gray-200",
                    iconColor: "text-gray-500",
                    hoverColor: "hover:text-gray-700",
                    activeColor: "text-gray-700",
                    imageBg: "bg-gray-50",
                    buttonBg: "bg-white/90",
                    buttonHover: "hover:bg-gray-100",
                    counterBg: "bg-black/70",
                    thumbBg: "bg-white",
                    thumbBorder: "border-gray-200",
                    thumbActive: "border-blue-500 ring-2 ring-blue-500",
                    thumbHover: "hover:border-gray-300",
                    scrollbar: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                };
        }
    };

    const theme = getThemeStyles();

    // Fullscreen overlay
    if (isFullscreen) {
        return (
            <div className={`fixed inset-0 z-50 ${theme.bg} ${theme.text} flex flex-col items-center justify-center`}>
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={handleDownload}
                        className={`rounded-full p-2 ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200`}
                        aria-label="Download image"
                    >
                        <Download className="h-5 w-5" />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className={`rounded-full p-2 ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200`}
                        aria-label="Exit fullscreen"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center p-8">
                    <div className={`relative w-full h-full flex items-center justify-center ${isTransitioning ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                        <Image
                            src={images[currentIndex].imageUrl || ''}
                            alt={`Image ${currentIndex + 1}`}
                            className="max-h-full max-w-full object-contain"
                            width={1200}
                            height={800}
                            priority
                            quality={100}
                        />
                    </div>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goToPrevious}
                                className={`absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200`}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={goToNext}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200`}
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>

                            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full ${theme.counterBg} text-white font-medium`}>
                                {currentIndex + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>

                {/* Thumbnail strip in fullscreen */}
                {images.length > 1 && (
                    <div className={`absolute bottom-0 left-0 right-0 h-20 ${theme.tabBg} border-t ${theme.tabBorder} flex items-center px-4 overflow-x-auto ${theme.scrollbar}`}>
                        <div className="flex gap-2 py-2">
                            {images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleThumbnailClick(index)}
                                    className={`relative h-14 w-14 rounded border ${index === currentIndex
                                        ? theme.thumbActive
                                        : `${theme.thumbBorder} ${theme.thumbHover}`
                                        } overflow-hidden transition-all duration-200 flex-shrink-0`}
                                    aria-label={`View image ${index + 1}`}
                                >
                                    <Image
                                        src={image.imageUrl || ''}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="object-cover"
                                        fill
                                        sizes="56px"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`fixed right-0 top-16 bottom-16 z-10 ${theme.bg} ${theme.text} shadow-xl border-l ${theme.tabBorder} transition-all duration-300 ease-in-out flex`}
            style={{ width: isOpen ? '360px' : '48px' }}
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
                    <span className={`text-sm font-medium ${theme.iconColor}`}>
                        {images.length} {images.length === 1 ? 'Image' : 'Images'}
                    </span>
                </div>
                <button
                    className={`mt-2 ${theme.iconColor} ${theme.hoverColor} transition-colors duration-200`}
                    aria-label={isOpen ? "Hide images" : "Show images"}
                >
                    {isOpen ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* Image slider (only visible when open) */}
            {isOpen && (
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b ${theme.tabBorder}">
                        <h3 className={`text-lg font-semibold ${theme.text}`}>Gallery</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownload}
                                className={`rounded-full p-1.5 ${theme.iconColor} ${theme.hoverColor} transition-colors duration-200`}
                                aria-label="Download image"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                            <button
                                onClick={toggleFullscreen}
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
                        {/* Main image display */}
                        <div className={`flex-1 relative rounded-lg overflow-hidden ${theme.imageBg} shadow-inner`}>
                            <div className={`w-full h-full flex items-center justify-center ${isTransitioning ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                                <Image
                                    src={images[currentIndex].imageUrl || ''}
                                    alt={`Image ${currentIndex + 1}`}
                                    className="max-h-full max-w-full object-contain p-2"
                                    width={600}
                                    height={400}
                                    priority
                                />
                            </div>

                            {/* Navigation controls */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                                        className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-md ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200 opacity-80 hover:opacity-100`}
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-md ${theme.buttonBg} ${theme.buttonHover} ${theme.text} transition-colors duration-200 opacity-80 hover:opacity-100`}
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>

                                    {/* Image counter */}
                                    <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-medium px-2.5 py-1.5 rounded-full ${theme.counterBg} text-white shadow-md`}>
                                        {currentIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div className={`mt-4 h-16 ${theme.thumbBg} rounded-lg border ${theme.thumbBorder} flex items-center px-2 overflow-x-auto ${theme.scrollbar}`}>
                                <div className="flex gap-2 py-2">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleThumbnailClick(index)}
                                            className={`relative h-12 w-12 rounded border ${index === currentIndex
                                                ? theme.thumbActive
                                                : `${theme.thumbBorder} ${theme.thumbHover}`
                                                } overflow-hidden transition-all duration-200 flex-shrink-0`}
                                            aria-label={`View image ${index + 1}`}
                                        >
                                            <Image
                                                src={image.imageUrl || ''}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="object-cover"
                                                fill
                                                sizes="48px"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
