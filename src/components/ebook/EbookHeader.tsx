"use client"

import { ChatSession } from "@/components/chat/types";
import SettingsToggler from "@/components/settings/SettingsToggler";
import { createClient } from "@/utils/supabase/clients";
import { Book, Home, Loader2, Menu, Moon, Search, Sun, X } from "lucide-react";
import Link from "next/link";
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
    theme,
    toggleTheme,
    toggleSidebar,
    currentSession,
    onArticleSelect
}: EbookHeaderProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
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
                    <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} break-words hyphens-auto leading-tight`}>
                        {title || 'New Document'}
                    </h1>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center space-x-2">
                    {/* Search section */}
                    <div className="relative" ref={searchRef}>
                        {isSearchOpen ? (
                            <div className={`absolute right-0 top-0 flex items-center rounded-md overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : theme === 'sepia' ? 'bg-amber-200' : 'bg-gray-100'
                                }`}>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`py-2 px-3 w-64 outline-none ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' :
                                        theme === 'sepia' ? 'bg-amber-200 text-amber-900 placeholder-amber-700' :
                                            'bg-gray-100 text-gray-800 placeholder-gray-500'
                                        }`}
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`p-2 ${theme === 'dark' ? 'text-gray-300 hover:text-white' :
                                        theme === 'sepia' ? 'text-amber-800 hover:text-amber-900' :
                                            'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className={`p-2 rounded-md ${theme === 'dark'
                                    ? 'hover:bg-gray-700'
                                    : theme === 'sepia'
                                        ? 'hover:bg-amber-200'
                                        : 'hover:bg-gray-100'} transition-colors`}
                                aria-label="Search"
                            >
                                <Search className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                            </button>
                        )}

                        {/* Search results dropdown */}
                        {isSearchOpen && (searchResults.length > 0 || isSearching) && (
                            <div className={`absolute right-0 top-10 w-80 mt-1 rounded-md shadow-lg overflow-hidden z-50 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' :
                                theme === 'sepia' ? 'bg-amber-50 border border-amber-200' :
                                    'bg-white border border-gray-200'
                                }`}>
                                {isSearching ? (
                                    <div className={`p-4 flex items-center justify-center ${theme === 'dark' ? 'text-gray-300' :
                                        theme === 'sepia' ? 'text-amber-800' :
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
                                                className={`p-3 cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700 border-b border-gray-700' :
                                                    theme === 'sepia' ? 'hover:bg-amber-100 border-b border-amber-200' :
                                                        'hover:bg-gray-100 border-b border-gray-200'
                                                    } ${index === searchResults.length - 1 ? 'border-b-0' : ''}`}
                                            >
                                                <div className="flex items-start">
                                                    <Book className={`h-4 w-4 mt-1 mr-2 flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' :
                                                        theme === 'sepia' ? 'text-amber-700' :
                                                            'text-gray-500'
                                                        }`} />
                                                    <div>
                                                        <h4 className={`font-medium ${theme === 'dark' ? 'text-white' :
                                                            theme === 'sepia' ? 'text-amber-900' :
                                                                'text-gray-800'
                                                            }`}>
                                                            {result.title}
                                                        </h4>
                                                        {result.content && (
                                                            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' :
                                                                theme === 'sepia' ? 'text-amber-700' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                {result.content}
                                                            </p>
                                                        )}
                                                        {result.version && (
                                                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' :
                                                                theme === 'sepia' ? 'text-amber-600' :
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
