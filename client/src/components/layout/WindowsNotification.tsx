import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import warningTriangle from '@/assets/warning-triangle.svg';

interface WindowsNotificationProps {
  title: string;
  message: string;
  sender: string;
  open: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function WindowsNotification({ 
  title, 
  message, 
  sender, 
  open, 
  onClose,
  onDelete
}: WindowsNotificationProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
      <div className="flex flex-col w-full max-w-md bg-white border border-gray-400 shadow-lg overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-red-700 text-white">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 flex items-center justify-center border border-white/60 text-xs">🖥️</span>
            <span className="text-xs font-normal">{title}</span>
          </div>
          <div className="flex items-center">
            <button className="text-white text-xs px-1 hover:bg-red-600">?</button>
            <button 
              onClick={onClose}
              className="text-white text-xs px-1 hover:bg-red-600"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Message content */}
        <div className="flex px-4 py-3 pb-2">
          <div className="mr-4 flex-shrink-0">
            <img src={warningTriangle} alt="Warning" className="h-8 w-8" />
          </div>
          <div className="flex-1">
            {sender && <p className="font-medium text-sm mb-1">{sender}</p>}
            <p className="text-sm whitespace-pre-line">{message}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end mt-3 px-3 pb-3">
          {onDelete && (
            <Button 
              onClick={onDelete}
              className="min-w-[75px] bg-white border border-gray-400 px-4 py-1 text-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2 rounded-none"
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={onClose}
            className="min-w-[75px] bg-white border border-gray-400 px-4 py-1 text-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-none"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}