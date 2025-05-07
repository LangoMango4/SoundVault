import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Check, X, RefreshCw } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistance } from 'date-fns';
import { BroadcastMessage } from '@shared/schema';
import warningIcon from '@/assets/warning-icon.png';
import windowsExeIcon from '@/assets/windows-exe-icon.png';
import { WindowsNotification } from './WindowsNotification';

export function BroadcastMessages() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWindowsNotification, setShowWindowsNotification] = useState(false);
  const [activeNotification, setActiveNotification] = useState<BroadcastMessage | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check for unread messages
  const { data: unreadMessages, isLoading, refetch: refetchUnread } = useQuery({
    queryKey: ['/api/messages', 'unread'],
    queryFn: async () => {
      const res = await fetch('/api/messages?unread=true');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<BroadcastMessage[]>;
    },
    // Only fetch for authenticated users
    enabled: !!user,
    // Check for new messages every 15 seconds for better responsiveness
    refetchInterval: 15000,
  });
  
  // Set up real-time updates for new messages
  useEffect(() => {
    if (!user) return;
    
    // Force refetch when new messages might have been created
    const checkForNewMessages = () => {
      refetchUnread();
    };
    
    // Check every 5 seconds (more frequent than the regular refetch interval)
    const intervalId = setInterval(checkForNewMessages, 5000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [user, refetchUnread]);
  
  // Get all messages when dialog is opened
  const { data: allMessages, refetch: refetchAll } = useQuery({
    queryKey: ['/api/messages', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<BroadcastMessage[]>;
    },
    enabled: isOpen && !!user,
  });
  
  // Refresh messages when dialog is opened
  useEffect(() => {
    if (isOpen && user) {
      refetchAll();
    }
  }, [isOpen, user, refetchAll]);
  
  // Mark a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('POST', `/api/messages/${messageId}/read`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all message-related queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'all'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark message as read",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mark all messages as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!unreadMessages?.length) return;
      
      // Mark each unread message as read sequentially
      for (const message of unreadMessages) {
        await apiRequest('POST', `/api/messages/${message.id}/read`);
      }
      return true;
    },
    onSuccess: () => {
      // Invalidate all message-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'all'] });
      toast({
        title: "All messages marked as read",
        description: "You've cleared all your notifications",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark all as read",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Only check if the user is an admin (for delete permission)
  const isAdmin = user?.role === 'admin';
  
  // Open notifications when there are new unread messages
  useEffect(() => {
    if (unreadMessages && unreadMessages.length > 0) {
      // Check if we have a new unread message
      const latestMessage = unreadMessages[0];
      
      // Show Windows-style notification
      setActiveNotification(latestMessage);
      setShowWindowsNotification(true);
    }
  }, [unreadMessages]);
  
  // Only render if the user is authenticated
  if (!user) return null;
  
  // Delete broadcast message
  const deleteBroadcastMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('DELETE', `/api/messages/${messageId}`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all message-related queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'all'] });
      
      toast({
        title: "Message deleted",
        description: "The message has been removed"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle the Windows notification close
  const handleCloseNotification = () => {
    setShowWindowsNotification(false);
    
    // Mark the message as read
    if (activeNotification) {
      markAsReadMutation.mutate(activeNotification.id);
    }
  };
  
  // Handle the message deletion from notification
  const handleDeleteNotification = () => {
    if (activeNotification) {
      deleteBroadcastMessageMutation.mutate(activeNotification.id);
      setShowWindowsNotification(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        {/* Use warning icon instead of bell when there are unread messages */}
        {!isLoading && unreadMessages && unreadMessages.length > 0 ? (
          <img src={warningIcon} alt="Warning" className="h-6 w-6" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {!isLoading && unreadMessages && unreadMessages.length > 0 && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>
      
      {/* Windows-style notification */}
      {activeNotification && (
        <WindowsNotification 
          title={activeNotification.title}
          message={activeNotification.message}
          sender=""
          open={showWindowsNotification}
          onClose={handleCloseNotification}
          onDelete={handleDeleteNotification}
        />
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Broadcast Messages</DialogTitle>
                <DialogDescription>
                  System notifications and announcements from administrators.
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  refetchAll();
                  refetchUnread();
                }} 
                title="Refresh messages"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            {allMessages && allMessages.length > 0 ? (
              <div className="space-y-4 p-1">
                {allMessages.map(message => {
                  // Check if this user has read this message
                  const hasBeenRead = Array.isArray(message.hasBeenRead) 
                    ? message.hasBeenRead.includes(user.id)
                    : false;
                    
                  return (
                    <Card key={message.id} className={hasBeenRead ? 'opacity-70' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          <img 
                            src={windowsExeIcon} 
                            alt="Windows" 
                            className="h-3 w-3 mr-2"
                          />
                          <CardTitle className="text-base">{message.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm whitespace-pre-line">{message.message}</p>
                      </CardContent>
                      <CardFooter className="pt-0 justify-end gap-2">
                        {!hasBeenRead && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(message.id)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Mark as read
                          </Button>
                        )}
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => deleteBroadcastMessageMutation.mutate(message.id)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {isLoading ? 'Loading messages...' : 'No messages to display'}
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="secondary" 
              size="sm"
              disabled={!unreadMessages || unreadMessages.length === 0}
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Mark all as read
            </Button>
            <Button variant="default" size="sm" onClick={() => setIsOpen(false)}>
              <X className="mr-1 h-4 w-4" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}