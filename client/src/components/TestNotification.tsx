import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TestNotification() {
  const { toast } = useToast();
  
  const showNotification = () => {
    toast({
      title: "Regular Notification",
      description: "This is a regular notification with the warning icon.",
      variant: "default",
    });
  };
  
  const showSystemNotification = () => {
    toast({
      title: "System Notification",
      description: "This is a system notification with the warning icon that shows for 10 seconds.",
      variant: "default",
    });
  };
  
  const showErrorNotification = () => {
    toast({
      title: "Error Notification",
      description: "This is an error notification with the warning icon.",
      variant: "destructive",
    });
  };
  
  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-md">
      <h2 className="text-lg font-medium">Test Notifications</h2>
      <p className="text-sm text-muted-foreground">
        Click the buttons below to test different notifications with the warning icon.
      </p>
      <div className="flex gap-2">
        <Button onClick={showNotification} variant="outline">Regular Notification</Button>
        <Button onClick={showSystemNotification} variant="default">System Notification</Button>
        <Button onClick={showErrorNotification} variant="destructive">Error Notification</Button>
      </div>
    </div>
  );
}