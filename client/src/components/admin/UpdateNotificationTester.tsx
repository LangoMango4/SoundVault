import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUpdateNotification, CURRENT_VERSION } from "@/hooks/use-update-notification";

export default function UpdateNotificationTester() {
  const [version, setVersion] = useState(CURRENT_VERSION);
  const { testShowUpdateNotification } = useUpdateNotification();
  
  const handleTestNotification = () => {
    // The hook provides testShowUpdateNotification method
    testShowUpdateNotification();
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="version">Version to show in notification</Label>
        <Input
          id="version"
          placeholder="e.g. 1.5.0"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        />
      </div>
      
      <Button onClick={handleTestNotification}>
        Test Update Notification
      </Button>
    </div>
  );
}