"use client"

import { ChatSession } from "@/components/chat/types";
import SettingsToggler from "@/components/settings/SettingsToggler";
import { Home, Menu, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";

interface EbookHeaderProps {
    title: string;
    theme: string;
    toggleTheme: () => void;
    toggleSidebar: () => void;
    currentSession: ChatSession | null;
}

export function EbookHeader({
    title,
    theme,
    toggleTheme,
    toggleSidebar,
    currentSession
}: EbookHeaderProps) {
    return (
        <header className={`fixed top-0 left-0 right-0 z-10 ${theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-gray-100'
                : theme === 'sepia'
                    ? 'bg-amber-100 border-amber-200 text-amber-900'
                    : 'bg-white border-gray-200 text-gray-800'
            } 
      border-b shadow-sm transition-colors duration-200`}>
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Left section */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-md ${theme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'} transition-colors`}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>
                    <Link
                        href="/"
                        className={`flex items-center gap-2 ${theme === 'dark'
                            ? 'text-gray-300 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'} font-medium transition-colors`}
                    >
                        <Home className="h-4 w-4" />
                        <span className="hidden sm:inline">Library</span>
                    </Link>
                </div>

                {/* Center section - Title */}
                <div className="text-center flex-1 px-4">
                    <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} truncate`}>
                        {title || 'New Document'}
                    </h1>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center space-x-2">
                    {/* Search button */}
                    <button
                        className={`p-2 rounded-md ${theme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'} transition-colors`}
                        aria-label="Search"
                    >
                        <Search className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-md ${theme === 'dark'
                                ? 'hover:bg-gray-700'
                                : theme === 'sepia'
                                    ? 'hover:bg-amber-200'
                                    : 'hover:bg-gray-100'
                            } transition-colors`}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-5 w-5 text-gray-300" />
                        ) : theme === 'sepia' ? (
                            <Moon className="h-5 w-5 text-amber-800" />
                        ) : (
                            <Moon className="h-5 w-5 text-gray-600" />
                        )}
                    </button>

                    {/* Settings button */}
                    <SettingsToggler />
                </div>
            </div>
        </header>
    );
}
