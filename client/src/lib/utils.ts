import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to display system notifications with a consistent format
export function showSystemNotification(
  messageOrError: string | Error,
  variant: "default" | "destructive" = "destructive"
) {
  // Extract message string if an Error object was provided
  const message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
  
  // Clean up the message - remove any status code prefixes like "403:" or "500: "
  const cleanMessage = message.replace(/^\d{3}:?\s*/, '');
  
  // Remove any quotes or JSON syntax that might have leaked through
  const formattedMessage = cleanMessage
    .replace(/^["'{]|[}"']$/g, '')  // Remove surrounding quotes or braces
    .replace(/\\"/g, '"')           // Replace escaped quotes
    .replace(/\\/g, '');            // Remove any remaining backslashes
  
  // Use a plain string title for System Notification so the timeout system recognizes it
  // and applies the correct duration
  toast({
    title: "System Notification",
    description: formattedMessage,
    variant: variant
  });
}
