'use client';

import React from 'react';
import SettingsDialog from '../../components/settings/SettingsDialog';
import SettingsToggler from '../../components/settings/SettingsToggler';
import { useSettingsStore } from '../../store/settingsStore';

// Sample article content
const sampleContent = `
  <h1>Sample Article</h1>
  <p>This is a sample article to demonstrate how the settings will affect the text.</p>
  <p>The settings dialog allows you to change the font family, size, and line spacing.</p>
  <p>All changes are applied in real-time to provide immediate visual feedback.</p>
`;

const SettingsDemoPage: React.FC = () => {
    const { settings } = useSettingsStore();

    // Apply settings as inline styles
    const contentStyle = {
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
    };

    return (
        <div className="container mx-auto p-4">
            {/* Header with settings button */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Settings Demo</h1>
                <SettingsToggler />
            </div>

            {/* Sample content that will be affected by settings */}
            <div className="prose max-w-none" style={contentStyle}>
                <div dangerouslySetInnerHTML={{ __html: sampleContent }} />
            </div>

            {/* Settings dialog (only visible when open) */}
            <SettingsDialog />
        </div>
    );
};

export default SettingsDemoPage; 