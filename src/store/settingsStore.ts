import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define bookmark item interface
export interface BookmarkItem {
    articleId: string;
    versionNumber: number;
    title: string;
    timestamp: Date;
    content?: string; // Optional preview content
}

// Define enhanced settings interface for ebook reader
interface EbookSettings {
    // Typography settings
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    textAlign: 'left' | 'justify' | 'center';

    // Layout settings
    pageMargin: number;
    paragraphSpacing: number;

    // Theme settings
    theme: 'light' | 'dark' | 'sepia';

    // Reading preferences
    showPageNumber: boolean;
    enableAnimations: boolean;
}

interface SettingsState {
    settings: EbookSettings;
    isSettingsOpen: boolean;
    bookmarks: BookmarkItem[];
    setSettings: (settings: Partial<EbookSettings>) => void;
    setSettingsOpen: (open: boolean) => void;
    toggleBookmark: (bookmark: BookmarkItem) => void;
    removeBookmark: (articleId: string, versionNumber: number) => void;
    isBookmarked: (articleId: string, versionNumber: number) => boolean;
}

// Create store with default values and persistence
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            settings: {
                // Typography defaults
                fontSize: 18,
                fontFamily: 'serif',
                lineHeight: 1.5,
                textAlign: 'left',

                // Layout defaults
                pageMargin: 16,
                paragraphSpacing: 1.2,

                // Theme defaults
                theme: 'light',

                // Reading preferences defaults
                showPageNumber: true,
                enableAnimations: true,
            },
            isSettingsOpen: false,
            bookmarks: [],
            setSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings }
                })),
            setSettingsOpen: (open) => set({ isSettingsOpen: open }),
            toggleBookmark: (bookmark) =>
                set((state) => {
                    const existingIndex = state.bookmarks.findIndex(
                        b => b.articleId === bookmark.articleId && b.versionNumber === bookmark.versionNumber
                    );

                    if (existingIndex >= 0) {
                        // Remove bookmark if it exists
                        const newBookmarks = [...state.bookmarks];
                        newBookmarks.splice(existingIndex, 1);
                        return { bookmarks: newBookmarks };
                    } else {
                        // Add new bookmark
                        return { bookmarks: [...state.bookmarks, bookmark] };
                    }
                }),
            removeBookmark: (articleId, versionNumber) =>
                set((state) => ({
                    bookmarks: state.bookmarks.filter(
                        b => !(b.articleId === articleId && b.versionNumber === versionNumber)
                    )
                })),
            isBookmarked: (articleId, versionNumber) => {
                const state = get();
                return state.bookmarks.some(
                    b => b.articleId === articleId && b.versionNumber === versionNumber
                );
            }
        }),
        {
            name: 'reader-settings', // unique name for localStorage
        }
    )
);
