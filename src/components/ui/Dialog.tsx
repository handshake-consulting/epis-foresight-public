import React from 'react';

interface DialogProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Dialog box */}
      <div className="bg-white relative z-10 w-full max-w-md rounded-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h3 className="font-bold">{title || 'Settings'}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog; 