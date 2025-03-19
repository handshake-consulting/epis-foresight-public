"use client"

import { ImageMessage } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react";
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
    const { settings, setSettings } = useSettingsStore();
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
    console.log(settings.theme);

    return (
        <div className={`fixed right-0 top-16 bottom-16 z-10 bg-white shadow-lg border-l transition-all duration-300 flex  ${settings.theme === "dark"
            ? "bg-gray-900 text-gray-100"
            : settings.theme === "sepia"
                ? "bg-amber-50 text-amber-900"
                : "bg-gray-50 text-gray-800"
            }`} style={{ width: isOpen ? '320px' : '48px' }}>
            {/* Vertical tab */}
            <div
                className={`h-full w-12 flex flex-col items-center justify-center cursor-pointer border-r ${settings.theme === "dark"
                        ? "bg-gray-800 border-gray-700"
                        : settings.theme === "sepia"
                            ? "bg-amber-100 border-amber-200"
                            : "bg-gray-50 border-gray-200"
                    }`}
                onClick={onToggle}
                style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)'
                }}
            >
                <div className="flex items-center p-2">
                    <ImageIcon className={`h-4 w-4 mb-2 ${settings.theme === "dark"
                            ? "text-gray-400"
                            : settings.theme === "sepia"
                                ? "text-amber-700"
                                : "text-gray-500"
                        }`} />
                    <span className={`text-sm font-medium ${settings.theme === "dark"
                            ? "text-gray-300"
                            : settings.theme === "sepia"
                                ? "text-amber-800"
                                : "text-gray-700"
                        }`}>
                        {images.length} {images.length === 1 ? 'Image' : 'Images'}
                    </span>
                </div>
                <button
                    className={`mt-2 ${settings.theme === "dark"
                            ? "text-gray-400 hover:text-gray-200"
                            : settings.theme === "sepia"
                                ? "text-amber-700 hover:text-amber-900"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
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
                <div className="flex-1 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-lg font-medium ${settings.theme === "dark"
                                ? "text-gray-100"
                                : settings.theme === "sepia"
                                    ? "text-amber-900"
                                    : "text-gray-800"
                            }`}>Gallery</h3>
                        <button
                            onClick={onToggle}
                            className={`${settings.theme === "dark"
                                    ? "text-gray-400 hover:text-gray-200"
                                    : settings.theme === "sepia"
                                        ? "text-amber-700 hover:text-amber-900"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            aria-label="Close gallery"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 relative">
                        {/* Image display */}
                        <div className={`h-full flex items-center justify-center rounded-lg ${settings.theme === "dark"
                                ? "bg-gray-700"
                                : settings.theme === "sepia"
                                    ? "bg-amber-200"
                                    : "bg-gray-100"
                            }`}>
                            <Image
                                src={images[currentIndex].imageUrl || ''}
                                alt={`Image ${currentIndex + 1}`}
                                className="max-h-full max-w-full object-contain p-2"
                                width={400}
                                height={300}
                            />
                        </div>

                        {/* Navigation controls */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                                    className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 shadow ${settings.theme === "dark"
                                            ? "bg-gray-800/80 hover:bg-gray-800 text-gray-300"
                                            : settings.theme === "sepia"
                                                ? "bg-amber-50/80 hover:bg-amber-50 text-amber-900"
                                                : "bg-white/80 hover:bg-white text-gray-700"
                                        }`}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 shadow ${settings.theme === "dark"
                                            ? "bg-gray-800/80 hover:bg-gray-800 text-gray-300"
                                            : settings.theme === "sepia"
                                                ? "bg-amber-50/80 hover:bg-amber-50 text-amber-900"
                                                : "bg-white/80 hover:bg-white text-gray-700"
                                        }`}
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>

                                {/* Image counter */}
                                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-full ${settings.theme === "dark"
                                        ? "bg-gray-800/80 text-gray-200"
                                        : settings.theme === "sepia"
                                            ? "bg-amber-800/80 text-amber-50"
                                            : "bg-black/60 text-white"
                                    }`}>
                                    {currentIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
