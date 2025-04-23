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
      <div className="bg-[#F0F0F0] border border-[#DFDFDF] shadow-md w-[420px] overflow-hidden font-sans">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#0058E1] to-[#2080F6] text-white px-2.5 py-1 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold flex items-center">
              <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {title}
            </div>
          </div>
          <div className="flex items-center">
            <button 
              aria-label="Help"
              className="hover:bg-blue-700 px-3 py-0.5 text-sm font-bold"
            >
              ?
            </button>
            <button 
              aria-label="Close"
              onClick={onClose}
              className="hover:bg-red-500 px-3 py-0.5 text-sm font-bold"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 flex items-center justify-center">
              <svg className="text-[#FFCC00] h-12 w-12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-sans text-sm">{message}</p>
          </div>
        </div>
        
        {/* Button area */}
        <div className="bg-[#F0F0F0] p-4 pt-2 flex justify-end border-t border-[#DFDFDF]">
          <button 
            onClick={onClose}
            className="border border-[#ADADAD] bg-[#E1E1E1] hover:bg-[#E5F1FB] hover:border-[#0078D7] px-5 py-1 min-w-[86px] text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}