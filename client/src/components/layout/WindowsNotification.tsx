import React from 'react';
import { Button } from '@/components/ui/button';
import warningIcon from '@/assets/warning-icon.png';
import windowsExeIcon from '@/assets/windows-exe-icon.png';
import { useAuth } from '@/hooks/use-auth';

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="flex flex-col w-full max-w-md bg-white border border-gray-300 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-2 bg-blue-600 text-white">
          <div className="flex items-center">
            <img src={windowsExeIcon} alt="App" className="h-4 w-4 mr-2" />
            <span className="font-medium">{title}</span>
          </div>
        </div>
        
        {/* Message content */}
        <div className="flex px-4 py-4">
          <div className="mr-4 flex-shrink-0">
            <img src={warningIcon} alt="Warning" className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <p className="whitespace-pre-line">{message}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-3 bg-gray-100 border-t border-gray-200">
          {isAdmin && onDelete && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="mr-2"
            >
              Delete
            </Button>
          )}
          <Button 
            variant="default"
            size="sm"
            onClick={onClose}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}