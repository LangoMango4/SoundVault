import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { showSystemNotification } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationTester() {
  const showRegularToast = () => {
    toast({
      title: "Regular Notification",
      description: "This is a regular notification that will disappear after 5 seconds.",
    });
  };

  const showSystemToast = () => {
    showSystemNotification(
      "This is a system notification with an error style and warning icon. It will stay visible for 10 seconds."
    );
  };

  const showErrorToast = () => {
    showSystemNotification(
      new Error("This is a system notification created from an Error object. It shows how error objects are handled.")
    );
  };

  const showStatusCodeError = () => {
    showSystemNotification(
      "403: This demonstrates how status codes are removed from the error message for cleaner display."
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification System Testing</CardTitle>
        <CardDescription>
          Test the various notification types in the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={showRegularToast}>
            Show Regular Notification
          </Button>
          <Button variant="destructive" onClick={showSystemToast}>
            Show System Notification
          </Button>
          <Button variant="destructive" onClick={showErrorToast}>
            Show Error Object
          </Button>
          <Button variant="destructive" onClick={showStatusCodeError}>
            Show Status Code Handling
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        System notifications include a warning icon and stay visible longer (10s vs 5s).
      </CardFooter>
    </Card>
  );
}