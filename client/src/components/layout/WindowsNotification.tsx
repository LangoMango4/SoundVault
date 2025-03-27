import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import warningIcon from '@/assets/warning-icon.png';

interface WindowsNotificationProps {
  title: string;
  message: string;
  sender: string;
  open: boolean;
  onClose: () => void;
}

export function WindowsNotification({ 
  title, 
  message, 
  sender, 
  open, 
  onClose 
}: WindowsNotificationProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
      <div className="flex flex-col w-full max-w-md bg-white border border-gray-200 shadow-lg">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0078d7] text-white">
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 bg-white rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-[#0078d7]"></div>
            </div>
            <span className="text-sm font-medium">{sender}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xl">?</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Message content */}
        <div className="flex px-6 py-4">
          <div className="mr-4">
            <img src={warningIcon} alt="Warning" className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <p className="text-sm">{message}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-3 bg-gray-50 border-t border-gray-200">
          <Button 
            variant="outline"
            size="sm"
            onClick={onClose}
            className="px-6"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}