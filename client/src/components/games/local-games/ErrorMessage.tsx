import React from 'react';

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
      <div className="bg-white shadow-lg w-96 max-w-md overflow-hidden rounded-sm border border-gray-300">
        {/* Title bar */}
        <div className="bg-red-600 text-white px-3 py-1.5 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-white hover:text-gray-200 text-xl leading-none">?</button>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0">
              <svg className="text-yellow-500 h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"/>
                <path d="M13 8L13 13" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                <path d="M13 16L13 17" stroke="black" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-base whitespace-pre-wrap">{message}</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={onClose}
              className="bg-blue-100 border border-blue-300 px-4 py-1 text-sm hover:bg-blue-200"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}