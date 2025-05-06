import React, { useState } from 'react';
import { useUpdateNotification } from '@/hooks/use-update-notification';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle } from 'lucide-react';

export default function UpdateNotificationTester() {
  const { testShowUpdateNotification } = useUpdateNotification();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleTest = () => {
    testShowUpdateNotification();
    setShowSuccess(true);
    
    toast({
      title: "Success",
      description: "Update notification triggered successfully!"
    });
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };
  
  return (
    <div className="space-y-4">
      <Button
        onClick={handleTest}
        className="bg-primary hover:bg-primary/90"
      >
        <Bell className="mr-2 h-4 w-4" />
        Test Update Notification
      </Button>
      
      {showSuccess && (
        <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-md text-sm flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          Update notification triggered successfully!
        </div>
      )}
    </div>
  );
}
