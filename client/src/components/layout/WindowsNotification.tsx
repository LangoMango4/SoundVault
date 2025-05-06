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
      <div className="flex flex-col w-full max-w-md bg-white border border-gray-300 shadow-xl overflow-hidden rounded-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-red-700 text-white">
          <div className="flex items-center gap-1">
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
        <div className="flex p-4 pb-2 items-start bg-white">
          <div className="mr-4 flex-shrink-0">
            <img src={warningTriangle} alt="Warning" className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm whitespace-pre-line">{message}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end px-4 pb-4 pt-2 bg-white">
          {onDelete && (
            <Button 
              onClick={onDelete}
              className="min-w-[75px] bg-white border border-gray-300 px-4 py-1 text-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2 rounded-sm"
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={onClose}
            className="min-w-[75px] bg-white border border-gray-300 px-4 py-1 text-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}