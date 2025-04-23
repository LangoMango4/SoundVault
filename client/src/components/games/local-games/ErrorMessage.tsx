import React from 'react';
import { X } from 'lucide-react';

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
      <div className="bg-[#f0f0f0] border border-gray-300 shadow-lg w-96 rounded-md overflow-hidden">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">⮟</span>
            <span className="text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="hover:bg-blue-500 px-2 text-lg leading-none">?</button>
            <button 
              onClick={onClose}
              className="hover:bg-red-500 px-2 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="bg-yellow-400 w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-2xl">
              !
            </div>
          </div>
          <div className="flex-1">
            <p className="mb-4">{message}</p>
            <div className="flex justify-end">
              <button 
                onClick={onClose}
                className="border border-gray-300 bg-gray-100 hover:bg-gray-200 px-6 py-1 text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}