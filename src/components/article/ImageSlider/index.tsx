"use client"

import { ImageMessage } from "@/components/chat/types";
import { useSettingsStore } from "@/store/settingsStore";
import { useCallback, useState } from "react";
import { RegularView } from "./RegularView";

interface ImageSliderProps {
    initialImages?: ImageMessage[];

}

export function ImageSlider({
    initialImages = [],

}: ImageSliderProps) {
    // Use the store for image slider open state
    const { isImageSliderOpen, toggleImageSlider, settings } = useSettingsStore();

    const [images, setImages] = useState<ImageMessage[]>(initialImages);


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


    // Regular view
    return (
        <RegularView

            theme={theme}
            isOpen={isImageSliderOpen}
            width={isImageSliderOpen ? '650px' : '48px'}

            onToggle={toggleImageSlider}

            settings={settings}
        />
    );
}
