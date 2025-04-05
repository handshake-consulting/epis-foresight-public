"use client"

import { ChatSession } from "@/components/chat/types";
import SettingsToggler from "@/components/settings/SettingsToggler";
import { useSettingsStore } from "@/store/settingsStore";
import { createClient } from "@/utils/supabase/clients";
import { Book, HelpCircle, Loader2, Menu, Moon, Search, Sun, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";

interface EbookHeaderProps {
    title: string;
    theme: string;
    toggleTheme: () => void;
    toggleSidebar: () => void;
    currentSession: ChatSession | null;
    onArticleSelect: (articleId: string, versionNumber: number) => void;
    settings?: {
        fontFamily?: string;
        fontSize?: number;
        lineHeight?: number;
        textAlign?: string;
    };
}

interface SearchResult {
    id: string;
    title: string;
    content?: string;
    version?: number;
    timestamp?: string;
}

export function EbookHeader({
    title,
    theme: headerTheme,
    toggleTheme,
    toggleSidebar,
    currentSession,
    onArticleSelect,
    settings
}: EbookHeaderProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const { settings: globalSettings } = useSettingsStore();
    const searchRef = useRef<any>(null);
    const router = useRouter();

    // Close search dropdown when clicking outside
    useOnClickOutside(searchRef, () => {
        setIsSearchOpen(false);
    });

    // Debounce search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search function
    const performSearch = async (query: string) => {
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const supabase = createClient();

            // Search in chat_sessions (titles)
            const { data: sessionResults, error: sessionError } = await supabase
                .from("chat_sessions")
                .select("id, title, updated_at")
                .eq("type", "article")
                .ilike("title", `%${query}%`)
                .order("updated_at", { ascending: false })
                .limit(5);

            if (sessionError) {
                console.error("Error searching sessions:", sessionError);
            }

            // Search in chat_messages (content)
            const { data: messageResults, error: messageError } = await supabase
                .from("chat_messages")
                .select("id, session_id, content, version, created_at")
                .eq("role", "assistant")
                .eq("is_topic", false)
                .ilike("content", `%${query}%`)
                .order("created_at", { ascending: false })
                .limit(10);

            if (messageError) {
                console.error("Error searching messages:", messageError);
            }

            // Get session details for message results
            let contentResults: SearchResult[] = [];
            if (messageResults && messageResults.length > 0) {
                // Get unique session IDs
                const sessionIds = [...new Set(messageResults.map(msg => msg.session_id))];

                // Get session details
                const { data: sessions } = await supabase
                    .from("chat_sessions")
                    .select("id, title")
                    .eq("type", "article")
                    .in("id", sessionIds);

                // Map message results to search results
                contentResults = messageResults.map(msg => {
                    const session = sessions?.find(s => s.id === msg.session_id);

                    // Extract a snippet of content around the search term
                    let snippet = "";
                    if (msg.content) {
                        const index = msg.content.toLowerCase().indexOf(query.toLowerCase());
                        if (index !== -1) {
                            const start = Math.max(0, index - 40);
                            const end = Math.min(msg.content.length, index + query.length + 40);
                            snippet = (start > 0 ? "..." : "") +
                                msg.content.substring(start, end) +
                                (end < msg.content.length ? "..." : "");
                        } else {
                            snippet = msg.content.substring(0, 80) + "...";
                        }
                    }

                    return {
                        id: msg.session_id,
                        title: session?.title || "Untitled Document",
                        content: snippet,
                        version: msg.version,
                        timestamp: msg.created_at
                    };
                });
            }

            // Combine and deduplicate results
            const titleResults: SearchResult[] = sessionResults?.map(session => ({
                id: session.id,
                title: session.title || "Untitled Document",
                timestamp: session.updated_at
            })) || [];

            // Combine results, prioritizing title matches
            const combinedResults = [...titleResults];

            // Add content results that aren't already in the list
            contentResults.forEach(result => {
                if (!combinedResults.some(r => r.id === result.id)) {
                    combinedResults.push(result);
                }
            });

            setSearchResults(combinedResults.slice(0, 10));
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle result click
    const handleResultClick = (result: SearchResult) => {
        setIsSearchOpen(false);
        setSearchQuery("");

        // Navigate to the article
        if (result.version) {
            // If we have a version, navigate to that specific version
            onArticleSelect(result.id, result.version);
            //  router.push(`/article/${result.id}?version=${result.version}`);
        } else {
            onArticleSelect(result.id, 1);
            // Otherwise just navigate to the article
            //router.push(`/article/${result.id}`);
        }
    };
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
                    {/* Mobile-only search button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className={`md:hidden p-2 rounded-md ${headerTheme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'} transition-colors`}
                        aria-label="Search"
                    >
                        <Search className={`h-5 w-5 ${headerTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>
                    <span className={`hidden md:inline font-medium ${headerTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Table of Contents
                    </span>
                </div>

                {/* Center section - Title */}
                <div className="text-center flex-1 px-4">
                    <h1 className={`text-lg font-bold ${headerTheme === 'dark' ? 'text-white' : 'text-gray-800'} break-words hyphens-auto leading-tight`}>
                        {title || 'New Document'}
                    </h1>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center space-x-2">
                    {/* Search section - Desktop only */}
                    <div className="relative hidden md:block" ref={searchRef}>
                        {isSearchOpen ? (
                            <div className={`absolute right-0 top-0 flex items-center rounded-md overflow-hidden ${headerTheme === 'dark' ? 'bg-gray-700' : headerTheme === 'sepia' ? 'bg-amber-200' : 'bg-gray-100'
                                }`}>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`py-2 px-3 w-64 outline-none ${headerTheme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' :
                                        headerTheme === 'sepia' ? 'bg-amber-200 text-amber-900 placeholder-amber-700' :
                                            'bg-gray-100 text-gray-800 placeholder-gray-500'
                                        }`}
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`p-2 ${headerTheme === 'dark' ? 'text-gray-300 hover:text-white' :
                                        headerTheme === 'sepia' ? 'text-amber-800 hover:text-amber-900' :
                                            'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className={`p-2 rounded-md ${headerTheme === 'dark'
                                    ? 'hover:bg-gray-700'
                                    : headerTheme === 'sepia'
                                        ? 'hover:bg-amber-200'
                                        : 'hover:bg-gray-100'} transition-colors`}
                                aria-label="Search"
                            >
                                <Search className={`h-5 w-5 ${headerTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                            </button>
                        )}

                        {/* Search results dropdown */}
                        {isSearchOpen && (searchResults.length > 0 || isSearching) && (
                            <div className={`absolute right-0 top-10 w-80 mt-1 rounded-md shadow-lg overflow-hidden z-50 ${headerTheme === 'dark' ? 'bg-gray-800 border border-gray-700' :
                                headerTheme === 'sepia' ? 'bg-amber-50 border border-amber-200' :
                                    'bg-white border border-gray-200'
                                }`}>
                                {isSearching ? (
                                    <div className={`p-4 flex items-center justify-center ${headerTheme === 'dark' ? 'text-gray-300' :
                                        headerTheme === 'sepia' ? 'text-amber-800' :
                                            'text-gray-600'
                                        }`}>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span>Searching...</span>
                                    </div>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto">
                                        {searchResults.map((result, index) => (
                                            <div
                                                key={`${result.id}-${index}`}
                                                onClick={() => handleResultClick(result)}
                                                className={`p-3 cursor-pointer ${headerTheme === 'dark' ? 'hover:bg-gray-700 border-b border-gray-700' :
                                                    headerTheme === 'sepia' ? 'hover:bg-amber-100 border-b border-amber-200' :
                                                        'hover:bg-gray-100 border-b border-gray-200'
                                                    } ${index === searchResults.length - 1 ? 'border-b-0' : ''}`}
                                            >
                                                <div className="flex items-start">
                                                    <Book className={`h-4 w-4 mt-1 mr-2 flex-shrink-0 ${headerTheme === 'dark' ? 'text-gray-400' :
                                                        headerTheme === 'sepia' ? 'text-amber-700' :
                                                            'text-gray-500'
                                                        }`} />
                                                    <div>
                                                        <h4 className={`font-medium ${headerTheme === 'dark' ? 'text-white' :
                                                            headerTheme === 'sepia' ? 'text-amber-900' :
                                                                'text-gray-800'
                                                            }`}>
                                                            {result.title}
                                                        </h4>
                                                        {result.content && (
                                                            <p className={`text-sm mt-1 ${headerTheme === 'dark' ? 'text-gray-400' :
                                                                headerTheme === 'sepia' ? 'text-amber-700' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                {result.content}
                                                            </p>
                                                        )}
                                                        {result.version && (
                                                            <p className={`text-xs mt-1 ${headerTheme === 'dark' ? 'text-gray-500' :
                                                                headerTheme === 'sepia' ? 'text-amber-600' :
                                                                    'text-gray-500'
                                                                }`}>
                                                                Version: {result.version}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile-only Help icon */}
                    <button
                        onClick={() => setIsHelpModalOpen(true)}
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
                                    Buy it here
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
