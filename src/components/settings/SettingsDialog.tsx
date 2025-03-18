import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import Dialog from '../ui/Dialog';

const SettingsDialog: React.FC = () => {
    const { isSettingsOpen, settings, setSettings, setSettingsOpen } = useSettingsStore();

    const handleClose = () => setSettingsOpen(false);

    return (
        <Dialog
            isOpen={isSettingsOpen}
            onClose={handleClose}
            title="Reading Settings"
        >
            <div className="space-y-4">
                {/* Font Family */}
                <div>
                    <label className="block text-sm font-medium mb-1">Font</label>
                    <select
                        className="w-full border rounded p-2"
                        value={settings.fontFamily}
                        onChange={(e) => setSettings({ fontFamily: e.target.value })}
                    >
                        <option value="serif">Serif</option>
                        <option value="sans-serif">Sans-serif</option>
                        <option value="monospace">Monospace</option>
                    </select>
                </div>

                {/* Font Size */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Font Size: {settings.fontSize}px
                    </label>
                    <input
                        type="range"
                        min="12"
                        max="32"
                        value={settings.fontSize}
                        onChange={(e) => setSettings({ fontSize: Number(e.target.value) })}
                        className="w-full"
                    />
                </div>

                {/* Line Height */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Line Spacing: {settings.lineHeight}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.1"
                        value={settings.lineHeight}
                        onChange={(e) => setSettings({ lineHeight: Number(e.target.value) })}
                        className="w-full"
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default SettingsDialog; 