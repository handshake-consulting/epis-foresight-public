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

    // First-time user experience
    hasSeenWelcomeModal: boolean;
}

// Define UI open states type
type UIElement = 'sidebar' | 'footer' | 'imageSlider' | 'lightbox' | null;

interface SettingsState {
    settings: EbookSettings;
    isSettingsOpen: boolean;
    bookmarks: BookmarkItem[];
    // UI open states
    isSidebarOpen: boolean;
    isFooterOpen: boolean;
    isImageSliderOpen: boolean;
    isLightboxOpen: boolean;
    activeUIElement: UIElement;
    // Functions
    setSettings: (settings: Partial<EbookSettings>) => void;
    setSettingsOpen: (open: boolean) => void;
    toggleBookmark: (bookmark: BookmarkItem) => void;
    removeBookmark: (articleId: string, versionNumber: number) => void;
    isBookmarked: (articleId: string, versionNumber: number) => boolean;
    // UI open state functions
    setUIOpenState: (element: UIElement) => void;
    toggleSidebar: () => void;
    toggleFooter: () => void;
    toggleImageSlider: () => void;
    openLightbox: () => void;
    closeLightbox: () => void;
    // Welcome modal functions
    markWelcomeModalAsSeen: () => void;
}

// Create store with default values and persistence
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            settings: {
                // Typography defaults
                fontSize: 18,
                fontFamily: 'sans-serif',
                lineHeight: 1.5,
                textAlign: 'left',

                // Layout defaults
                pageMargin: 16,
                paragraphSpacing: 1.2,

                // Theme defaults
                theme: 'sepia',

                // Reading preferences defaults
                showPageNumber: true,
                enableAnimations: true,

                // First-time user experience defaults
                hasSeenWelcomeModal: false,
            },
            isSettingsOpen: false,
            bookmarks: [],
            // UI open states defaults
            isSidebarOpen: false,
            isFooterOpen: false,
            isImageSliderOpen: false,
            isLightboxOpen: false,
            activeUIElement: null,
            // Functions
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
            },
            // UI open state functions
            setUIOpenState: (element) =>
                set((state) => {
                    // If the element is already active, toggle it off
                    if (state.activeUIElement === element) {
                        return {
                            isSidebarOpen: false,
                            isFooterOpen: false,
                            isImageSliderOpen: false,
                            activeUIElement: null
                        };
                    }

                    // Otherwise, close all and open the requested one
                    return {
                        isSidebarOpen: element === 'sidebar',
                        isFooterOpen: element === 'footer',
                        isImageSliderOpen: element === 'imageSlider',
                        isLightboxOpen: element === 'lightbox',
                        activeUIElement: element
                    };
                }),
            toggleSidebar: () => {
                const state = get();
                state.setUIOpenState(state.isSidebarOpen ? null : 'sidebar');
            },
            toggleFooter: () => {
                const state = get();
                state.setUIOpenState(state.isFooterOpen ? null : 'footer');
            },
            toggleImageSlider: () => {
                const state = get();
                state.setUIOpenState(state.isImageSliderOpen ? null : 'imageSlider');
            },
            // Lightbox functions
            openLightbox: () => {
                set((state) => ({
                    isLightboxOpen: true,
                    isFooterOpen: false, // Hide footer when lightbox opens
                    activeUIElement: 'lightbox'
                }));
            },
            closeLightbox: () => {
                set((state) => ({
                    isLightboxOpen: false,
                    activeUIElement: state.activeUIElement === 'lightbox' ? null : state.activeUIElement
                }));
            },
            // Welcome modal functions
            markWelcomeModalAsSeen: () => {
                set((state) => ({
                    settings: { ...state.settings, hasSeenWelcomeModal: true }
                }));
            }
        }),
        {
            name: 'reader-settings', // unique name for localStorage
        }
    )
);
