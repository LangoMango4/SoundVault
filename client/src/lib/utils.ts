import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Shows a system notification with error styling and longer duration
 * Handles different error formats (Error objects, JSON strings, quoted strings)
 */
export function showSystemNotification(message: string | Error) {
  let errorMessage = message;
  
  // Handle Error objects
  if (message instanceof Error) {
    errorMessage = message.message;
  }
  
  // Convert to string if not already
  let errorText = String(errorMessage);
  
  // Clean up HTTP status codes (e.g., "403: Forbidden" -> "Forbidden")
  errorText = errorText.replace(/^\d{3}:\s+/g, '');
  
  // Remove quotes from JSON-formatted error messages
  try {
    // Check if it's a JSON string
    if (errorText.startsWith('{') && errorText.endsWith('}')) {
      const parsed = JSON.parse(errorText);
      if (parsed.error || parsed.message) {
        errorText = parsed.error || parsed.message;
      }
    }
  } catch (e) {
    // Not a valid JSON, continue with original message
  }
  
  // Remove quotes from string literals
  if (errorText.startsWith('"') && errorText.endsWith('"')) {
    errorText = errorText.substring(1, errorText.length - 1);
  }
  
  // Show toast with longer duration and error styling
  toast({
    title: "System Notification",
    description: errorText,
    variant: "destructive",
    duration: 10000, // 10 seconds
  });
}