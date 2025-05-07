import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import warningIcon from '@/assets/warning-icon.png';
import windowsIcon from '@/assets/windows-notification.png';
import errorTitleIcon from '@/assets/error-title-icon.png';
import windowsExeIcon from '@/assets/windows-exe-icon.png';

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
      <div className="flex flex-col w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-sm overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-white text-black border-b border-gray-300">
          <div className="flex items-center">
            <img src={windowsExeIcon} alt="Windows" className="h-4 w-4 mr-1.5" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-2 text-black hover:text-gray-600">?</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 text-black hover:text-gray-600"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Message content */}
        <div className="flex px-4 py-3">
          <div className="mr-4 flex-shrink-0">
            <img src={warningIcon} alt="Warning" className="h-8 w-8" />
          </div>
          <div className="flex-1">
            {sender && <p className="font-medium text-sm mb-1">{sender}</p>}
            <p className="text-sm whitespace-pre-line">{message}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 p-2 bg-gray-100 border-t border-gray-200">
          {onDelete && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="px-4 py-0 h-7 text-xs"
            >
              Delete
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={onClose}
            className="px-6 py-0 h-7 text-xs bg-gray-100 border-gray-300"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}