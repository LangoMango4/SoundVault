import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Check, X } from 'lucide-react';
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

export function BroadcastMessages() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check for unread messages
  const { data: unreadMessages, isLoading } = useQuery({
    queryKey: ['/api/messages', 'unread'],
    queryFn: async () => {
      const res = await fetch('/api/messages?unread=true');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<BroadcastMessage[]>;
    },
    // Only fetch for authenticated users
    enabled: !!user,
    // Check for new messages every minute
    refetchInterval: 60000,
  });
  
  // Get all messages when dialog is opened
  const { data: allMessages } = useQuery({
    queryKey: ['/api/messages', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<BroadcastMessage[]>;
    },
    enabled: isOpen && !!user,
  });
  
  // Mark a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('POST', `/api/messages/${messageId}/read`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both message queries to update the UI
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
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
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

  // Get appropriate priority badge color
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'urgent':
        return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      case 'low':
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge>Normal</Badge>;
    }
  };
  
  // Format time since message was created
  const getTimeAgo = (dateString: Date) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };
  
  // Open notifications when there are new unread messages
  useEffect(() => {
    if (unreadMessages && unreadMessages.length > 0) {
      // Show a toast notification for the first unread message
      const latestMessage = unreadMessages[0];
      toast({
        title: latestMessage.title,
        description: `${latestMessage.message.substring(0, 60)}${latestMessage.message.length > 60 ? '...' : ''}`,
        action: (
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            View
          </Button>
        )
      });
    }
  }, [unreadMessages, toast]);
  
  // Only render if the user is authenticated
  if (!user) return null;
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {!isLoading && unreadMessages && unreadMessages.length > 0 && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Messages</DialogTitle>
            <DialogDescription>
              System notifications and announcements from administrators.
            </DialogDescription>
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
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{message.title}</CardTitle>
                          {getPriorityBadge(message.priority)}
                        </div>
                        <CardDescription className="text-xs">
                          {getTimeAgo(message.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm whitespace-pre-line">{message.message}</p>
                      </CardContent>
                      <CardFooter className="pt-0 justify-end">
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