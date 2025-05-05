"use client"

import { ChatSession } from "@/components/chat/types";
import SettingsToggler from "@/components/settings/SettingsToggler";
import { useSettingsStore } from "@/store/settingsStore";
import { HelpCircle, Menu, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface EbookHeaderProps {
    title: string;
    theme: string;
    toggleTheme: () => void;
    toggleSidebar: () => void;
    currentSession: ChatSession | null;
    settings?: {
        fontFamily?: string;
        fontSize?: number;
        lineHeight?: number;
        textAlign?: string;
    };
}

export function EbookHeader({
    title,
    theme: headerTheme,
    toggleTheme,
    toggleSidebar,
    currentSession,
    settings
}: EbookHeaderProps) {
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const { settings: globalSettings } = useSettingsStore();
    return (
        <header className={`fixed top-0 left-0 right-0 z-10 ${headerTheme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : headerTheme === 'sepia'
                ? 'bg-amber-100 border-amber-200 text-amber-900'
                : 'bg-white border-gray-200 text-gray-800'
            } 
      border-b shadow-sm transition-colors duration-200`}>
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Left section */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-md ${headerTheme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'} transition-colors`}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className={`h-5 w-5 ${headerTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>
                    <span className={`hidden md:inline font-medium ${headerTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Table of Contents
                    </span>
                </div>

                {/* Center section - Title */}
                <div className="text-center flex-1 px-4">
                    <h1 className={`text-lg font-bold ${headerTheme === 'dark' ? 'text-white' : 'text-gray-800'} break-words hyphens-auto leading-tight`}>
                        {title || 'New Page'}
                    </h1>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center space-x-2">

                    {/* Mobile-only Help icon */}
                    <button
                        onClick={() => {
                            setIsHelpModalOpen(true)
                            useSettingsStore.getState().setUIOpenState(null);
                        }}
                        className={`md:hidden p-2 rounded-md ${headerTheme === 'dark'
                            ? 'hover:bg-gray-700'
                            : headerTheme === 'sepia'
                                ? 'hover:bg-amber-200'
                                : 'hover:bg-gray-100'
                            } transition-colors`}
                        aria-label="About"
                    >
                        <HelpCircle className={`h-5 w-5 ${headerTheme === 'dark' ? 'text-gray-300' : headerTheme === 'sepia' ? 'text-amber-800' : 'text-gray-600'}`} />
                    </button>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-md ${headerTheme === 'dark'
                            ? 'hover:bg-gray-700'
                            : headerTheme === 'sepia'
                                ? 'hover:bg-amber-200'
                                : 'hover:bg-gray-100'
                            } transition-colors`}
                        aria-label="Toggle theme"
                    >
                        {headerTheme === 'dark' ? (
                            <Sun className="h-5 w-5 text-gray-300" />
                        ) : headerTheme === 'sepia' ? (
                            <Moon className="h-5 w-5 text-amber-800" />
                        ) : (
                            <Moon className="h-5 w-5 text-gray-600" />
                        )}
                    </button>

                    {/* Settings button */}
                    <SettingsToggler />
                </div>
            </div>

            {/* Help Modal (mobile only) */}
            {isHelpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className={`relative w-[90%] max-w-md max-h-[90vh] overflow-y-auto rounded-lg p-6 ${headerTheme === 'dark'
                        ? 'bg-gray-800 text-white'
                        : headerTheme === 'sepia'
                            ? 'bg-amber-50 text-amber-900'
                            : 'bg-white text-gray-800'
                        }`}>
                        {/* Close button */}
                        <button
                            onClick={() => setIsHelpModalOpen(false)}
                            className={`absolute top-2 right-2 p-2 rounded-full ${headerTheme === 'dark'
                                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                : headerTheme === 'sepia'
                                    ? 'text-amber-800 hover:text-amber-900 hover:bg-amber-200'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* About content (same as RegularView) */}
                        <div className="flex flex-col items-center justify-center text-center gap-6 pt-4">
                            <p
                                className="mb-4"
                                style={{
                                    fontFamily: (settings || globalSettings)?.fontFamily,
                                    fontSize: (settings || globalSettings)?.fontSize ? `${(settings || globalSettings).fontSize}px` : undefined,
                                    lineHeight: (settings || globalSettings)?.lineHeight,
                                }}
                            >
                                This generative e-book prototype app is based on:
                            </p>

                            <div className="relative w-[230px] h-[307px] mb-4">
                                <Image
                                    src="/LeadersMaketheFuture_Cover Final.jpg"
                                    alt="Leaders Make the Future Book Cover"
                                    fill
                                    sizes="(max-width: 768px) 230px, 230px"
                                    style={{ objectFit: 'contain' }}
                                    priority
                                />
                            </div>

                            <p
                                style={{
                                    fontFamily: (settings || globalSettings)?.fontFamily,
                                    fontSize: (settings || globalSettings)?.fontSize ? `${(settings || globalSettings).fontSize}px` : undefined,
                                    lineHeight: (settings || globalSettings)?.lineHeight,
                                }}
                            >
                                If you find this app interesting, you&apos;ll love the original book.
                                <a
                                    href="https://www.amazon.com/Leaders-Make-Future-Third-Leadership/dp/B0D66H9BF1/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block mt-2 ${headerTheme === 'dark'
                                        ? 'text-blue-400 hover:text-blue-300'
                                        : 'text-blue-600 hover:underline'
                                        }`}
                                    style={{
                                        fontFamily: (settings || globalSettings)?.fontFamily,
                                        fontSize: (settings || globalSettings)?.fontSize ? `${(settings || globalSettings).fontSize}px` : undefined,
                                        lineHeight: (settings || globalSettings)?.lineHeight,
                                    }}
                                >
                                    Buy it here.
                                </a>
                                <p
                                    className="mt-4"
                                    style={{
                                        fontFamily: (settings || globalSettings)?.fontFamily,
                                        fontSize: (settings || globalSettings)?.fontSize ? `${(settings || globalSettings).fontSize}px` : undefined,
                                        lineHeight: (settings || globalSettings)?.lineHeight,
                                    }}
                                >
                                    This app was designed and built by <a
                                        href="https://handshake.fyi"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${headerTheme === 'dark'
                                            ? 'text-blue-400 hover:text-blue-300'
                                            : 'text-blue-600 hover:underline'
                                            }`}
                                    >
                                        Handshake
                                    </a> 🤝
                                </p>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
