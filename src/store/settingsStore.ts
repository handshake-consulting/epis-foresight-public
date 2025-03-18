import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define minimal settings interface
interface BasicSettings {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
}

interface SettingsState {
    settings: BasicSettings;
    isSettingsOpen: boolean;
    setSettings: (settings: Partial<BasicSettings>) => void;
    setSettingsOpen: (open: boolean) => void;
}

// Create store with default values and persistence
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: {
                fontSize: 18,
                fontFamily: 'serif',
                lineHeight: 1.5,
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