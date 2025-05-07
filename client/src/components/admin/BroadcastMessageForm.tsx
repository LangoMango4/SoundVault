import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InsertBroadcastMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Megaphone, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import warningIcon from "@/assets/warning-icon.png";
import errorTitleIcon from "@/assets/error-title-icon.png";

// Form validation schema
const formSchema = z.object({
  message: z.string().min(5, { message: "Message must be at least 5 characters" }),
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

interface BroadcastMessageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastMessageForm({ open, onOpenChange }: BroadcastMessageFormProps) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });
  
  // Mutation to create a broadcast message
  const createMessageMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/messages", { 
        ...values, 
        title: "System Administrator" 
      } as InsertBroadcastMessage);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message broadcast successfully",
        description: "Your message has been sent to all users",
      });
      // Invalidate all message-related queries to ensure updates everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'all'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(values: FormValues) {
    createMessageMutation.mutate(values);
    
    // Additionally, set a timeout to refresh queries after a brief delay
    // This ensures that even if the cache invalidation doesn't trigger immediately,
    // users will still see the new message
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'all'] });
    }, 1000);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <img src={warningIcon} alt="Warning" className="h-6 w-6" />
            <DialogTitle>Broadcast Message</DialogTitle>
          </div>
          <DialogDescription>
            Send a notification to all users of the soundboard application
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title field removed - always set to "System Administrator" */}
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your message content here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The main content of your broadcast message
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMessageMutation.isPending}
              >
                <img src={warningIcon} alt="Warning" className="w-5 h-5 mr-2" />
                {createMessageMutation.isPending ? "Sending..." : "Broadcast Message"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}