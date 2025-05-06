import React from 'react';

interface ErrorMessageProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

import warningTriangle from '@/assets/warning-triangle.svg';

export function ErrorMessage({ show, onClose, title = "System Administrator", message }: ErrorMessageProps) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white shadow-xl w-[400px] max-w-md overflow-hidden border border-gray-300 rounded-sm">
        {/* Title bar */}
        <div className="bg-white text-black px-2 py-1 flex justify-between items-center border-t-[3px] border-t-red-600">
          <div className="flex items-center gap-1">
            <span className="text-xs font-normal">{title}</span>
          </div>
          <div className="flex items-center">
            <button className="text-black text-xs px-1 hover:bg-gray-100">?</button>
            <button 
              onClick={onClose}
              className="text-black text-xs px-1 hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 pb-2 bg-white">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <img src={warningTriangle} alt="Warning" className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap font-normal">{message}</p>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button 
              onClick={onClose}
              className="min-w-[75px] bg-white border border-gray-300 px-4 py-1 text-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}