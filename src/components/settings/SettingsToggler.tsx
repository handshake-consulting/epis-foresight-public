import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';

const SettingsToggler: React.FC = () => {
    const { isSettingsOpen, setSettingsOpen } = useSettingsStore();

    return (
        <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={() => setSettingsOpen(!isSettingsOpen)}
            title="Settings"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15V3m0 12l-4 4m4-4l4 4M4 21h16" />
            </svg>
        </button>
    );
};

export default SettingsToggler; 