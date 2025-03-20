"use client"

import { ImageMessage } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
import { getIdToken } from "@/utils/firebase/client";
import { ChevronLeft, ChevronRight, Download, Expand, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface ImageSliderProps {
    initialImages?: ImageMessage[];
}

interface PaginationData {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export function ImageSlider({
    initialImages = []
}: ImageSliderProps) {
    // Use the store for image slider open state
    const { isImageSliderOpen, toggleImageSlider } = useSettingsStore();

    const [images, setImages] = useState<ImageMessage[]>(initialImages);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
    });
    const { settings } = useSettingsStore();
    useEffect(() => {
        setImages(initialImages)
    }, [initialImages])
    // Fetch images from API
    const fetchImages = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            setIsLoading(true);
            setError(null);

            // Get Firebase ID token for authentication
            const token = await getIdToken();

            // Call our API to fetch images
            const response = await fetch(`/api/article-images?page=${page}&pageSize=${pagination.pageSize}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Update state with fetched images and pagination data
            if (append) {
                // Append new images to existing ones for infinite scroll
                setImages(prevImages => [...prevImages, ...data.images]);
            } else {
                // Replace images when not appending (initial load)
                setImages(data.images);
                // Reset current index when loading a new page
                setCurrentIndex(0);
            }

            setPagination(data.pagination);
        } catch (err) {
            console.error("Error fetching images:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch images");
        } finally {
            setIsLoading(false);
        }
    }, [pagination.pageSize]);

    // Load images when component mounts or when isImageSliderOpen changes
    useEffect(() => {
        // Only fetch images when the slider is open and has exactly one image
        if (isImageSliderOpen && images.length === 1) {
            fetchImages(1, false);
        }
    }, [isImageSliderOpen, fetchImages, images.length]);

    // Load more images when needed
    const loadMoreImages = useCallback(() => {
        if (!isLoading && pagination.page < pagination.totalPages) {
            // Load next page and append images
            fetchImages(pagination.page + 1, true);
            return true;
        }
        return false;
    }, [fetchImages, isLoading, pagination.page, pagination.totalPages]);

    // Navigation functions
    const goToPrevious = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
        setTimeout(() => setIsTransitioning(false), 300);
    }, [isTransitioning, images.length]);

    const goToNext = useCallback(() => {
        if (isTransitioning) return;

        // Check if we're at the last image and need to load more
        if (currentIndex === images.length - 1) {
            // Try to load more images
            const moreImagesLoaded = loadMoreImages();

            // If more images are being loaded, stay on current image until they load
            if (moreImagesLoaded) {
                return;
            }
        }

        setIsTransitioning(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => setIsTransitioning(false), 300);
    }, [isTransitioning, currentIndex, images.length, loadMoreImages]);

    const handleThumbnailClick = useCallback((index: number) => {
        if (currentIndex === index || isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [currentIndex, isTransitioning]);

    const handleDownload = useCallback(() => {
        if (images.length === 0) return;
        const link = document.createElement('a');
        link.href = images[currentIndex].imageUrl || '';
        link.download = `image-${currentIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [images, currentIndex]);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(!isFullscreen);
    }, [isFullscreen]);

    // Handle keyboard navigation
    useEffect(() => {
        // Define the event handler
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only process keyboard events if the slider is open
            if (!isImageSliderOpen) return;

            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        // Add the event listener
        window.addEventListener('keydown', handleKeyDown);

        // Return cleanup function
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isImageSliderOpen, isFullscreen, goToPrevious, goToNext]);

    // Theme-based styling
    const getThemeStyles = useCallback(() => {
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
    }, [settings.theme]);

    const theme = getThemeStyles();
    // console.log("images", images || initialImages);

    // No images to display and not loading - render nothing
    if (images.length === 0) {
        return null;
    }

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

                            {/* Image counter with more images indicator */}
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center">
                                <div className={`px-3 py-1.5 rounded-full ${theme.counterBg} text-white font-medium flex items-center gap-1.5`}>
                                    {currentIndex + 1} / {images.length}
                                    {pagination.page < pagination.totalPages && (
                                        <span className="flex items-center ml-1" title="More images available">
                                            <span className="text-sm">+</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Thumbnail strip in fullscreen */}
                {images.length > 1 && (
                    <div
                        className={`absolute bottom-0 left-0 right-0 h-20 ${theme.tabBg} border-t ${theme.tabBorder} flex items-center px-4 overflow-x-auto ${theme.scrollbar}`}
                    >
                        <div className="flex gap-2 py-2 relative">
                            {pagination.page < pagination.totalPages && !isLoading && (
                                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-2">
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${theme.counterBg} text-white text-xs`}>
                                        <span>More</span>
                                        <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            )}
                            {isLoading && pagination.page > 1 && (
                                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-black/20 px-2 rounded">
                                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
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

    // Regular view
    return (
        <div
            className={`fixed right-0 top-16 bottom-16 z-10 ${theme.bg} ${theme.text} shadow-xl border-l ${theme.tabBorder} transition-all duration-300 ease-in-out flex`}
            style={{ width: isImageSliderOpen ? '650px' : '48px' }}
        >
            {/* Vertical tab */}
            <div
                className={`h-full w-12 flex flex-col items-center justify-center cursor-pointer border-r ${theme.tabBg} ${theme.tabBorder} transition-colors duration-200`}
                onClick={toggleImageSlider}
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
                <button
                    className={`mt-2 ${theme.iconColor} ${theme.hoverColor} transition-colors duration-200`}
                    aria-label={isImageSliderOpen ? "Hide images" : "Show images"}
                >
                    {isImageSliderOpen ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* Image slider (only visible when open) */}
            {isImageSliderOpen && (
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
                                onClick={toggleImageSlider}
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

                                    {/* Image counter with more images indicator */}
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center">
                                        <div className={`text-xs font-medium px-2.5 py-1.5 rounded-full ${theme.counterBg} text-white shadow-md flex items-center gap-1.5`}>
                                            {currentIndex + 1} / {images.length}
                                            {pagination.page < pagination.totalPages && (
                                                <span className="flex items-center ml-1" title="More images available">
                                                    <span className="text-xs">+</span>
                                                    <ChevronRight className="h-3 w-3" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div
                                className={`mt-4 h-16 ${theme.thumbBg} rounded-lg border ${theme.thumbBorder} flex items-center px-2 overflow-x-auto ${theme.scrollbar}`}
                            >
                                <div className="flex gap-2 py-2 relative">
                                    {pagination.page < pagination.totalPages && !isLoading && (
                                        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-2">
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${theme.counterBg} text-white text-xs`}>
                                                <span>More</span>
                                                <ChevronRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    )}
                                    {isLoading && pagination.page > 1 && (
                                        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-black/20 px-2 rounded">
                                            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
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
