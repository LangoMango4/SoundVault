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
  priority: z.enum(["low", "normal", "high", "urgent"], {
    required_error: "Please select a priority level",
  }),
  expiresAt: z.date().nullable().optional(),
  useWindowsStyle: z.boolean().default(true),
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
      priority: "normal",
      expiresAt: null,
      useWindowsStyle: true,
    },
  });
  
  // Mutation to create a broadcast message
  const createMessageMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Create a new object without the useWindowsStyle property and add System Administrator as the title
      const { useWindowsStyle, ...messageData } = values;
      const res = await apiRequest("POST", "/api/messages", { 
        ...messageData, 
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
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How important is this message to users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiration (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Never expires</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                      <div className="p-3 border-t border-border">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => field.onChange(null)}
                          type="button"
                        >
                          Clear
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When this message should no longer be shown to users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="useWindowsStyle"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Windows-Style Message</FormLabel>
                    <FormDescription className="text-xs">
                      Display as a Windows error message dialog
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
            
            {showPreview && (
              <div className="border rounded p-4 mt-2 bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Preview:</h3>
                {form.watch("useWindowsStyle") ? (
                  <div className="bg-white shadow-lg w-80 overflow-hidden rounded-sm">
                    {/* Title bar */}
                    <div className="bg-white text-black border-b border-gray-300 px-3 py-1.5 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">System Administrator</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-black hover:text-gray-600 text-xl leading-none">?</button>
                        <button className="text-black hover:text-gray-600 text-xl leading-none">×</button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0">
                          <svg className="text-yellow-400 h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-10v6h2V7h-2z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-line">{form.watch("message") || "Message content will appear here"}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 text-sm rounded-sm">
                          Delete
                        </button>
                        <button className="bg-gray-100 hover:bg-gray-200 px-4 py-1 text-sm rounded-sm">
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 shadow-md rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <img src={warningIcon} alt="Warning" className="h-5 w-5 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-base">System Administrator</h4>
                        <p className="text-sm text-gray-600">{form.watch("message") || "Message content will appear here"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
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