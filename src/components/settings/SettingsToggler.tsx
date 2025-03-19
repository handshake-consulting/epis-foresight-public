import { useSettingsStore } from '@/store/settingsStore';
import { Settings } from 'lucide-react';
import React from 'react';

const SettingsToggler: React.FC = () => {
    const { isSettingsOpen, setSettingsOpen, settings } = useSettingsStore();

    // Determine hover background based on theme
    const getHoverClass = () => {
        switch (settings.theme) {
            case 'dark':
                return 'hover:bg-gray-700';
            case 'sepia':
                return 'hover:bg-amber-200';
            default: // light
                return 'hover:bg-gray-100';
        }
    };

    return (
        <button
            className={`p-2 rounded-md ${getHoverClass()} transition-colors`}
            onClick={() => setSettingsOpen(!isSettingsOpen)}
            title="Settings"
        >
            <Settings className="h-5 w-5" />
        </button>
    );
};

export default SettingsToggler;
