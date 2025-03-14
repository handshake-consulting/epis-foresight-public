"use client"

import { ImageMessage } from "@/components/chat/types";
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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
    const [loading, setLoading] = useState<boolean[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // Reset current index when images change
    useEffect(() => {
        setCurrentIndex(0);
        setLoading(new Array(images.length).fill(true));
        setImageUrls(new Array(images.length).fill(""));
    }, [images]);

    // Fetch image URLs when component mounts or images change
    useEffect(() => {
        const fetchImageUrls = async () => {
            try {
                const newImageUrls = [...imageUrls];
                const newLoading = [...loading];

                for (let i = 0; i < images.length; i++) {
                    if (!newImageUrls[i]) {
                        try {
                            const response = await fetch(`/api/images/${images[i].imageId}`);

                            if (!response.ok) {
                                throw new Error(`Failed to fetch image: ${response.statusText}`);
                            }

                            const data = await response.json();

                            if (data.image_urls && data.image_urls.length > 0) {
                                newImageUrls[i] = data.image_urls[0];
                            } else {
                                throw new Error('No image URLs returned');
                            }
                        } catch (err) {
                            console.error('Error fetching image URL:', err);
                        } finally {
                            newLoading[i] = false;
                        }
                    }
                }

                setImageUrls(newImageUrls);
                setLoading(newLoading);
            } catch (err) {
                console.error('Error in fetchImageUrls:', err);
                setError(err instanceof Error ? err.message : 'Failed to load images');
            }
        };

        if (images.length > 0) {
            fetchImageUrls();
        }
    }, [images]);

    // No images to display
    if (images.length === 0) {
        return null;
    }

    // Navigation functions
    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    return (
        <div className={`border-t transition-all duration-300 ${isOpen ? 'h-64' : 'h-12'}`}>
            {/* Header bar */}
            <div className="h-12 px-4 flex items-center justify-between bg-gray-50 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">
                        {images.length} {images.length === 1 ? 'Image' : 'Images'}
                    </span>
                </div>
                <button
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={isOpen ? "Hide images" : "Show images"}
                >
                    {isOpen ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* Image slider (only visible when open) */}
            {isOpen && (
                <div className="h-52 relative">
                    {/* Loading state */}
                    {loading[currentIndex] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading[currentIndex] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="text-red-500">{error}</div>
                        </div>
                    )}

                    {/* Image display */}
                    {!loading[currentIndex] && imageUrls[currentIndex] && (
                        <div className="h-full flex items-center justify-center bg-gray-100">
                            <Image
                                src={imageUrls[currentIndex]}
                                alt={`Image ${currentIndex + 1}`}
                                className="max-h-full max-w-full object-contain"
                                width={400}
                                height={300}
                            />
                        </div>
                    )}

                    {/* Navigation controls */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white"
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>

                            {/* Image counter */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                {currentIndex + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ChevronDown component
function ChevronDown({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}
