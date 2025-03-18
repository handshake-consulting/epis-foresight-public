import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    setSettings: (settings: Partial<EbookSettings>) => void;
    setSettingsOpen: (open: boolean) => void;
}

// Create store with default values and persistence
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
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
            setSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings }
                })),
            setSettingsOpen: (open) => set({ isSettingsOpen: open }),
        }),
        {
            name: 'reader-settings', // unique name for localStorage
        }
    )
);
