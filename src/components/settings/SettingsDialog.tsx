import { AlignCenter, AlignJustify, AlignLeft, BookOpen, Layout, Type } from 'lucide-react';
import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import Dialog from '../ui/Dialog';

const SettingsDialog: React.FC = () => {
    const { isSettingsOpen, settings, setSettings, setSettingsOpen } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<'typography' | 'layout' | 'theme'>('typography');

    const handleClose = () => setSettingsOpen(false);

    return (
        <Dialog
            isOpen={isSettingsOpen}
            onClose={handleClose}
            title="Reading Settings"
        >
            {/* Tabs */}
            <div className="flex border-b mb-4">
                <button
                    onClick={() => setActiveTab('typography')}
                    className={`flex items-center gap-2 px-3 py-2 ${activeTab === 'typography'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Type className="h-4 w-4" />
                    <span>Typography</span>
                </button>
                <button
                    onClick={() => setActiveTab('layout')}
                    className={`flex items-center gap-2 px-3 py-2 ${activeTab === 'layout'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Layout className="h-4 w-4" />
                    <span>Layout</span>
                </button>
                <button
                    onClick={() => setActiveTab('theme')}
                    className={`flex items-center gap-2 px-3 py-2 ${activeTab === 'theme'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <BookOpen className="h-4 w-4" />
                    <span>Theme</span>
                </button>
            </div>

            {/* Typography Settings */}
            {activeTab === 'typography' && (
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
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                            <option value="'Times New Roman', Times, serif">Times New Roman</option>
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

                    {/* Text Alignment */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Text Alignment</label>
                        <div className="flex space-x-2">
                            <button
                                className={`p-2 border rounded flex-1 flex justify-center items-center ${settings.textAlign === 'left'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => setSettings({ textAlign: 'left' })}
                            >
                                <AlignLeft className="h-5 w-5" />
                            </button>
                            <button
                                className={`p-2 border rounded flex-1 flex justify-center items-center ${settings.textAlign === 'center'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => setSettings({ textAlign: 'center' })}
                            >
                                <AlignCenter className="h-5 w-5" />
                            </button>
                            <button
                                className={`p-2 border rounded flex-1 flex justify-center items-center ${settings.textAlign === 'justify'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => setSettings({ textAlign: 'justify' })}
                            >
                                <AlignJustify className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Layout Settings */}
            {activeTab === 'layout' && (
                <div className="space-y-4">
                    {/* Page Margins */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Page Margins: {settings.pageMargin}px
                        </label>
                        <input
                            type="range"
                            min="8"
                            max="32"
                            value={settings.pageMargin}
                            onChange={(e) => setSettings({ pageMargin: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Paragraph Spacing */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Paragraph Spacing: {settings.paragraphSpacing}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="2"
                            step="0.1"
                            value={settings.paragraphSpacing}
                            onChange={(e) => setSettings({ paragraphSpacing: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Show Page Numbers */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Show Page Numbers</label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                                type="checkbox"
                                id="toggle-page-numbers"
                                checked={settings.showPageNumber}
                                onChange={() => setSettings({ showPageNumber: !settings.showPageNumber })}
                                className="sr-only"
                            />
                            <label
                                htmlFor="toggle-page-numbers"
                                className={`block overflow-hidden h-6 rounded-full cursor-pointer ${settings.showPageNumber ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${settings.showPageNumber ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                ></span>
                            </label>
                        </div>
                    </div>

                    {/* Enable Animations */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Enable Animations</label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                                type="checkbox"
                                id="toggle-animations"
                                checked={settings.enableAnimations}
                                onChange={() => setSettings({ enableAnimations: !settings.enableAnimations })}
                                className="sr-only"
                            />
                            <label
                                htmlFor="toggle-animations"
                                className={`block overflow-hidden h-6 rounded-full cursor-pointer ${settings.enableAnimations ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${settings.enableAnimations ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                ></span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Settings */}
            {activeTab === 'theme' && (
                <div className="space-y-4">
                    {/* Theme Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                className={`p-4 border rounded-lg flex flex-col items-center ${settings.theme === 'light'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => setSettings({ theme: 'light' })}
                            >
                                <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
                                <span className="text-sm">Light</span>
                            </button>
                            <button
                                className={`p-4 border rounded-lg flex flex-col items-center ${settings.theme === 'sepia'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => setSettings({ theme: 'sepia' })}
                            >
                                <div className="w-full h-12 bg-amber-50 border border-amber-100 rounded mb-2"></div>
                                <span className="text-sm">Sepia</span>
                            </button>
                            <button
                                className={`p-4 border rounded-lg flex flex-col items-center ${settings.theme === 'dark'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => setSettings({ theme: 'dark' })}
                            >
                                <div className="w-full h-12 bg-gray-800 border border-gray-700 rounded mb-2"></div>
                                <span className="text-sm">Dark</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
};

export default SettingsDialog;
