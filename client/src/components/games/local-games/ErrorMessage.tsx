import React from 'react';
import errorTitleIcon from '@/assets/error-title-icon.png';

interface ErrorMessageProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function ErrorMessage({ show, onClose, title = "System Administrator", message }: ErrorMessageProps) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white shadow-lg w-80 overflow-hidden rounded-sm">
        {/* Title bar */}
        <div className="bg-white text-black border-b border-gray-300 px-3 py-1.5 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-black hover:text-gray-600 text-xl leading-none">?</button>
            <button 
              onClick={onClose}
              className="text-black hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0">
              <svg className="text-yellow-400 h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-10v6h2V7h-2z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm">{message}</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 text-sm rounded-sm"
            >
              Delete
            </button>
            <button 
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-1 text-sm rounded-sm"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}