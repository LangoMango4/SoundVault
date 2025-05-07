import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to display system notifications with a consistent format
export function showSystemNotification(message: string, variant: "default" | "destructive" = "destructive") {
  toast({
    title: "System Notification",
    description: message,
    variant: variant
  });
}
