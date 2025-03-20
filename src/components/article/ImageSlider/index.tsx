"use client"

import { ImageMessage } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
import { getIdToken } from "@/utils/firebase/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FullscreenView } from "./FullscreenView";
import { RegularView } from "./RegularView";
import { PaginationData } from "./types";

interface ImageSliderProps {
    initialImages?: ImageMessage[];
}

export function ImageSlider({
    initialImages = []
}: ImageSliderProps) {
    // Use the store for image slider open state
    const { isImageSliderOpen, toggleImageSlider, settings } = useSettingsStore();

    const [images, setImages] = useState<ImageMessage[]>(initialImages);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true); // State for image loading
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
    });

    // Refs for thumbnail scrolling
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);
    const fullscreenThumbnailContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setImages(initialImages);
        setImageLoading(false); // Reset image loading state when initialImages change
    }, [initialImages]);

    // Scroll thumbnails to center the current image
    useEffect(() => {
        if (thumbnailContainerRef.current && images.length > 1) {
            const container = thumbnailContainerRef.current;
            const thumbnailWidth = 56; // 48px + gap
            const scrollPosition = currentIndex * thumbnailWidth - (container.clientWidth / 2) + (thumbnailWidth / 2);
            container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }

        if (fullscreenThumbnailContainerRef.current && images.length > 1 && isFullscreen) {
            const container = fullscreenThumbnailContainerRef.current;
            const thumbnailWidth = 62; // 56px + gap
            const scrollPosition = currentIndex * thumbnailWidth - (container.clientWidth / 2) + (thumbnailWidth / 2);
            container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
    }, [currentIndex, images.length, isFullscreen]);

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
        setImageLoading(true); // Set loading state when navigating
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
        setImageLoading(true); // Set loading state when navigating
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => setIsTransitioning(false), 300);
    }, [isTransitioning, currentIndex, images.length, loadMoreImages]);

    const handleThumbnailClick = useCallback((index: number) => {
        if (currentIndex === index || isTransitioning) return;
        setIsTransitioning(true);
        setImageLoading(true); // Set loading state when changing image
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

    // Scroll thumbnail container
    const scrollThumbnails = useCallback((direction: 'left' | 'right', isFullscreenView: boolean = false) => {
        const container = isFullscreenView ? fullscreenThumbnailContainerRef.current : thumbnailContainerRef.current;
        if (!container) return;

        const scrollAmount = direction === 'left' ? -200 : 200;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }, []);

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
                    scrollbar: "scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900",
                    gradientFrom: "from-gray-900/80",
                    scrollButtonBg: "bg-gray-800/90",
                    scrollButtonHover: "hover:bg-gray-700"
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
                    scrollbar: "scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-100",
                    gradientFrom: "from-amber-50/80",
                    scrollButtonBg: "bg-amber-100/90",
                    scrollButtonHover: "hover:bg-amber-200"
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
                    scrollbar: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
                    gradientFrom: "from-white/80",
                    scrollButtonBg: "bg-white/90",
                    scrollButtonHover: "hover:bg-gray-100"
                };
        }
    }, [settings.theme]);

    const theme = getThemeStyles();

    // No images to display and not loading - render nothing
    if (images.length === 0) {
        return null;
    }

    // Fullscreen overlay
    if (isFullscreen) {
        return (
            <FullscreenView
                images={images}
                currentIndex={currentIndex}
                isLoading={isLoading}
                imageLoading={imageLoading}
                isTransitioning={isTransitioning}
                pagination={pagination}
                theme={theme}
                fullscreenThumbnailContainerRef={fullscreenThumbnailContainerRef}
                onThumbnailClick={handleThumbnailClick}
                onScroll={scrollThumbnails}
                onPrevious={goToPrevious}
                onNext={goToNext}
                onDownload={handleDownload}
                onExitFullscreen={toggleFullscreen}
                onImageLoadStart={() => setImageLoading(true)}
                onImageLoad={() => setImageLoading(false)}
            />
        );
    }

    // Regular view
    return (
        <RegularView
            images={images}
            currentIndex={currentIndex}
            isLoading={isLoading}
            imageLoading={imageLoading}
            isTransitioning={isTransitioning}
            pagination={pagination}
            theme={theme}
            isOpen={isImageSliderOpen}
            width={isImageSliderOpen ? '650px' : '48px'}
            thumbnailContainerRef={thumbnailContainerRef}
            onThumbnailClick={handleThumbnailClick}
            onScroll={(direction) => scrollThumbnails(direction)}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onDownload={handleDownload}
            onFullscreen={toggleFullscreen}
            onToggle={toggleImageSlider}
            onImageLoadStart={() => setImageLoading(true)}
            onImageLoad={() => setImageLoading(false)}
        />
    );
}
