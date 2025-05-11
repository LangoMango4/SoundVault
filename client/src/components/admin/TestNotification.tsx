import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

export default function TestNotification() {
  const [notificationText, setNotificationText] = useState("");
  const { toast } = useToast();
  
  const handleShowNotification = () => {
    if (!notificationText.trim()) return;
    
    toast({
      title: "System Notification",
      description: notificationText,
      // Remove icon prop as it's not in the Toast type
    });
  };
  
  const handleShowError = () => {
    if (!notificationText.trim()) return;
    
    toast({
      title: "System Error",
      description: notificationText,
      variant: "destructive",
      // Remove icon prop as it's not in the Toast type
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter notification text..."
          value={notificationText}
          onChange={(e) => setNotificationText(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleShowNotification}
          disabled={!notificationText.trim()}
        >
          Show Normal Notification
        </Button>
        
        <Button
          onClick={handleShowError}
          variant="destructive"
          disabled={!notificationText.trim()}
        >
          Show Error Notification
        </Button>
      </div>
    </div>
  );
}