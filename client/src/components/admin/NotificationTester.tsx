import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { showSystemNotification } from "@/lib/utils";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NotificationTester() {
  // Regular toast notification (5 seconds)
  const showRegularToast = () => {
    toast({
      title: "Regular Notification",
      description: "This is a regular notification that will disappear after 5 seconds.",
    });
  };

  // System notification (10 seconds)
  const showSystemToast = () => {
    showSystemNotification(
      "This is a system notification with an error style. It will stay visible for 10 seconds."
    );
  };

  // Error object handling in system notification
  const showErrorToast = () => {
    showSystemNotification(
      new Error("This is a system notification created from an Error object. It shows how error objects are handled.")
    );
  };

  // HTTP status code handling in system notification
  const showStatusCodeError = () => {
    showSystemNotification(
      "403: This demonstrates how status codes are removed from the error message for cleaner display."
    );
  };

  // JSON format error handling
  const showJsonFormatError = () => {
    showSystemNotification(
      '{"error": "This simulates a JSON-formatted error that should be properly cleaned up"}'
    );
  };

  // Quoted string error handling
  const showQuotedError = () => {
    showSystemNotification(
      '"This simulates a quoted error message that should be properly cleaned up"'
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification System Testing</CardTitle>
          <CardDescription>
            Test different types of notifications with our improved error handling system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={showRegularToast}
              className="flex justify-start items-center"
            >
              <Info className="mr-2 h-4 w-4" />
              Show Regular Notification
            </Button>
            <Button 
              variant="destructive" 
              onClick={showSystemToast}
              className="flex justify-start items-center"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Show System Notification
            </Button>
            <Button 
              variant="destructive" 
              onClick={showErrorToast}
              className="flex justify-start items-center"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Test Error Object Handling
            </Button>
            <Button 
              variant="destructive" 
              onClick={showStatusCodeError}
              className="flex justify-start items-center"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Test Status Code Handling
            </Button>
            <Button 
              variant="destructive" 
              onClick={showJsonFormatError}
              className="flex justify-start items-center"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Test JSON Format Handling
            </Button>
            <Button 
              variant="destructive" 
              onClick={showQuotedError}
              className="flex justify-start items-center"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Test Quoted String Handling
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types Comparison</CardTitle>
          <CardDescription>
            Differences between regular notifications and system notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Regular Notifications</TableHead>
                <TableHead>System Notifications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Duration</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    5 seconds
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    10 seconds
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Default Style</TableCell>
                <TableCell>Neutral</TableCell>
                <TableCell>Destructive (red)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Error Formatting</TableCell>
                <TableCell>None</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside text-sm">
                    <li>Strips HTTP status codes (e.g., "403:")</li>
                    <li>Cleans JSON and string formatting</li>
                    <li>Extracts message from Error objects</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Use Cases</TableCell>
                <TableCell>General information, success messages</TableCell>
                <TableCell>Error messages, warnings, important alerts</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          System notifications are identified by the title "System Notification" and automatically
          receive the longer display duration.
        </CardFooter>
      </Card>
    </div>
  );
}