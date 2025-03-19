import { useSettingsStore } from '@/store/settingsStore';
import { X } from 'lucide-react';
import React from 'react';

interface DialogProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, title, onClose, children }) => {
  const { settings } = useSettingsStore();

  // Determine theme-based styles
  const getThemeStyles = () => {
    switch (settings.theme) {
      case 'dark':
        return {
          bg: 'bg-gray-800',
          text: 'text-gray-100',
          border: 'border-gray-700',
          closeButton: 'text-gray-400 hover:text-gray-200',
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-200',
          closeButton: 'text-amber-700 hover:text-amber-900',
        };
      default: // light
        return {
          bg: 'bg-white',
          text: 'text-gray-800',
          border: 'border-gray-200',
          closeButton: 'text-gray-500 hover:text-gray-700',
        };
    }
  };

  const styles = getThemeStyles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div className={`${styles.bg} ${styles.text} relative z-10 w-full max-w-md rounded-lg overflow-hidden shadow-xl transition-colors duration-200`}>
        {/* Header */}
        <div className={`${styles.border} border-b p-4 flex justify-between items-center`}>
          <h3 className="font-bold">{title || 'Settings'}</h3>
          <button
            onClick={onClose}
            className={`${styles.closeButton} rounded-full p-1 hover:bg-black/10`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
