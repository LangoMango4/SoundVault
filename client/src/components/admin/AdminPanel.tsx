import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Users, FileAudio, Settings, ShieldAlert, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DataTable } from "@/components/ui/data-table";
import { UserForm } from "./UserForm";
import { SoundForm } from "./SoundForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CURRENT_VERSION, VERSION_HISTORY } from "@/hooks/use-update-notification";

// Import column definitions
import { usersColumns } from "./columns/users-columns";
import { soundsColumns } from "./columns/sounds-columns";
import { termsLogsColumns } from "./columns/terms-logs-columns";
import { userStrikesColumns } from "./columns/user-strikes-columns";
import { moderationLogsColumns } from "./columns/moderation-logs-columns";

// Import other admin components
import BlockedWordsManager from "./BlockedWordsManager";
import TestNotification from "./TestNotification";
import UpdateNotificationTester from "./UpdateNotificationTester";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const [searchText, setSearchText] = useState("");
  const [tableTab, setTableTab] = useState("users");
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isSoundFormOpen, setIsSoundFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userToApprove, setUserToApprove] = useState<any>(null);
  const [userToReject, setUserToReject] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: string} | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user is admin, if not, close the panel
  useEffect(() => {
    if (open && user?.role !== "admin") {
      onOpenChange(false);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    }
  }, [open, user, onOpenChange, toast]);
  
  // Users query with approval filtering
  const { 
    data: users = [], 
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: open && user?.role === "admin",
  });
  
  // Count of pending users who need approval
  const pendingApprovalCount = users.filter((u: any) => !u.approved).length;
  
  // Sounds query
  const { 
    data: sounds = [], 
    isLoading: soundsLoading,
    refetch: refetchSounds
  } = useQuery({
    queryKey: ['/api/sounds'],
    queryFn: async () => {
      const response = await fetch('/api/sounds');
      if (!response.ok) {
        throw new Error('Failed to fetch sounds');
      }
      return response.json();
    },
    enabled: open && user?.role === "admin",
  });
  
  // Terms Logs query
  const { 
    data: termsLogs = [], 
    isLoading: termsLogsLoading,
    refetch: refetchTermsLogs
  } = useQuery({
    queryKey: ['/api/terms/logs'],
    queryFn: async () => {
      const response = await fetch('/api/terms/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch terms logs');
      }
      return response.json();
    },
    enabled: open && user?.role === "admin" && tableTab === "terms",
  });
  
  // Fetch user strikes
  const { 
    data: userStrikes = [], 
    isLoading: userStrikesLoading,
    refetch: refetchUserStrikes
  } = useQuery({
    queryKey: ['/api/moderation/strikes'],
    queryFn: async () => {
      const response = await fetch('/api/moderation/strikes');
      if (!response.ok) {
        throw new Error('Failed to fetch user strikes');
      }
      return response.json();
    },
    enabled: open && user?.role === "admin" && tableTab === "moderation",
  });
  
  // Fetch moderation logs
  const { 
    data: moderationLogs = [], 
    isLoading: moderationLogsLoading,
    refetch: refetchModerationLogs
  } = useQuery({
    queryKey: ['/api/moderation/logs'],
    queryFn: async () => {
      const response = await fetch('/api/moderation/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch moderation logs');
      }
      return response.json();
    },
    enabled: open && user?.role === "admin" && tableTab === "moderation",
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully",
      });
    },
  });
  
  // Delete sound mutation
  const deleteSoundMutation = useMutation({
    mutationFn: async (soundId: number) => {
      await apiRequest("DELETE", `/api/sounds/${soundId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sounds'] });
      toast({
        title: "Sound deleted",
        description: "The sound has been deleted successfully",
      });
    },
  });
  
  // Delete terms log mutation
  const deleteTermsLogMutation = useMutation({
    mutationFn: async (logId: number) => {
      await apiRequest("DELETE", `/api/terms/logs/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terms/logs'] });
      toast({
        title: "Log entry deleted",
        description: "The terms & conditions log entry has been deleted successfully",
      });
    },
  });
  
  // Delete moderation log mutation
  const deleteModerationLogMutation = useMutation({
    mutationFn: async (logId: number) => {
      await apiRequest("DELETE", `/api/moderation/logs/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/logs'] });
      toast({
        title: "Log entry deleted",
        description: "The moderation log entry has been deleted successfully",
      });
    },
  });
  
  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/users/${userId}`, { approved: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User approved",
        description: "The user has been approved and can now access the system",
      });
    },
  });
  
  // Handle edit user
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };
  
  // Handle delete click
  const handleDeleteClick = (id: number, type: string) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };
  
  // Handle approve user click
  const handleApproveUser = (user: any) => {
    setUserToApprove(user);
    setApproveDialogOpen(true);
  };
  
  // Handle reject user click
  const handleRejectUser = (user: any) => {
    setUserToReject(user);
    setRejectDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === "user") {
      deleteUserMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "sound") {
      deleteSoundMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "termslog") {
      deleteTermsLogMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "moderationlog") {
      deleteModerationLogMutation.mutate(itemToDelete.id);
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  // Filter users based on search text
  const filteredUsers = users.filter((user: any) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.fullName.toLowerCase().includes(searchLower)
    );
  });

  // Filter sounds based on search text
  const filteredSounds = sounds.filter((sound: any) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return sound.name.toLowerCase().includes(searchLower);
  });
  
  // Filter terms logs based on search text
  const filteredTermsLogs = termsLogs.filter((log: any) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      log.username.toLowerCase().includes(searchLower) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Administrator Dashboard
            </DialogTitle>
          </DialogHeader>
          
          <Tabs 
            defaultValue="users" 
            value={tableTab} 
            onValueChange={setTableTab}
            className="flex flex-col h-full py-2"
          >
            <div className="px-6 pb-2 flex items-center justify-between border-b">
              <TabsList>
                <TabsTrigger value="users" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                  {pendingApprovalCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {pendingApprovalCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sounds" className="flex items-center gap-1">
                  <FileAudio className="h-4 w-4" />
                  <span>Sounds</span>
                </TabsTrigger>
                <TabsTrigger value="terms" className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  <span>T&Cs Logs</span>
                </TabsTrigger>
                <TabsTrigger value="moderation" className="flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Moderation</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span>System</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                {tableTab !== "system" && tableTab !== "moderation" && (
                  <Input
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="max-w-[200px]"
                  />
                )}
                
                {tableTab === "users" && (
                  <Button onClick={() => setIsUserFormOpen(true)}>
                    Add User
                  </Button>
                )}
                
                {tableTab === "sounds" && (
                  <Button onClick={() => setIsSoundFormOpen(true)}>
                    Add Sound
                  </Button>
                )}
              </div>
            </div>
            
            <TabsContent value="users" className="flex-1 overflow-auto p-6">
              {usersLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovalCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                      <h3 className="text-amber-800 font-medium flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        New Account Approvals Required ({pendingApprovalCount})
                      </h3>
                      <p className="text-amber-700 text-sm mt-1">
                        There are {pendingApprovalCount} new user account(s) waiting for approval. Review these accounts below.
                      </p>
                    </div>
                  )}
                  
                  <DataTable
                    columns={usersColumns}
                    data={filteredUsers}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sounds" className="flex-1 overflow-auto p-6">
              {soundsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DataTable
                  columns={soundsColumns}
                  data={filteredSounds}
                />
              )}
            </TabsContent>
            
            <TabsContent value="terms" className="flex-1 overflow-auto p-6">
              {termsLogsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DataTable
                  columns={termsLogsColumns}
                  data={filteredTermsLogs}
                />
              )}
            </TabsContent>
            
            <TabsContent value="moderation" className="flex-1 overflow-auto p-6">
              <div className="space-y-8">
                {/* Custom Blocked Words Manager */}
                <BlockedWordsManager className="mb-8" />
                
                {/* User Strikes */}
                <div>
                  <h4 className="text-lg font-medium mb-4">User Strikes</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This table shows users who have received strikes for chat violations. 
                    Users with 5 or more strikes have limited chat privileges.
                  </p>
                  
                  {userStrikesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : userStrikes && userStrikes.length > 0 ? (
                    <DataTable columns={userStrikesColumns} data={userStrikes} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
                      <div className="mb-2 rounded-full bg-muted p-3">
                        <svg className="h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <path d="m9 11 3 3L22 4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium">No strikes yet</h3>
                      <p className="text-sm text-muted-foreground">
                        No users have received strikes for chat violations.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Moderation Logs */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Moderation Logs</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This table shows all instances where chat messages were moderated.
                    Messages highlighted in yellow contain the original, unfiltered content.
                  </p>
                  
                  {moderationLogsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : moderationLogs && moderationLogs.length > 0 ? (
                    <DataTable columns={moderationLogsColumns} data={moderationLogs} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
                      <div className="mb-2 rounded-full bg-muted p-3">
                        <svg className="h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" />
                          <path d="M15 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1" />
                          <path d="M8 11v5a4 4 0 0 0 8 0v-5" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium">No moderation logs</h3>
                      <p className="text-sm text-muted-foreground">
                        No chat messages have been moderated yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="system" className="flex-1 overflow-auto p-6">
              <div className="flex justify-between mb-6">
                <h3 className="text-lg font-medium">System Settings</h3>
              </div>
              
              <div className="space-y-8">
                {/* Update Notification Testing */}
                <div className="bg-card rounded-md border shadow-sm p-6">
                  <h4 className="font-medium text-lg mb-3">Update Notification</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The update notification automatically shows when the application is updated with a new version.
                    For testing purposes, you can manually trigger the notification here.
                  </p>
                  
                  <div className="space-y-4">
                    <UpdateNotificationTester />
                  </div>
                </div>
                
                {/* System Information */}
                <div className="bg-card rounded-md border shadow-sm p-6">
                  <h4 className="font-medium text-lg mb-3">System Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Current Version</p>
                      <p className="text-sm text-muted-foreground">{CURRENT_VERSION}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{VERSION_HISTORY[CURRENT_VERSION]?.date || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Test Notifications */}
                <div className="bg-card rounded-md border shadow-sm p-6 mt-4">
                  <h4 className="font-medium text-lg mb-3">Test Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the buttons below to test different types of notifications with the warning icon.
                  </p>
                  <TestNotification />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* User Form Dialog */}
      <UserForm 
        open={isUserFormOpen} 
        onOpenChange={setIsUserFormOpen}
        user={editingUser}
      />
      
      {/* Sound Form Dialog */}
      <SoundForm 
        open={isSoundFormOpen} 
        onOpenChange={setIsSoundFormOpen}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "user" && "This action cannot be undone. This will permanently delete this user account."}
              {itemToDelete?.type === "sound" && "This action cannot be undone. This will permanently delete this sound from the system."}
              {itemToDelete?.type === "termslog" && "This action cannot be undone. This will permanently delete this Terms & Conditions acceptance log."}
              {itemToDelete?.type === "moderationlog" && "This action cannot be undone. This will permanently delete this moderation log entry."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Approve User Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {userToApprove?.fullName} ({userToApprove?.username})? 
              This will grant the user access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (userToApprove) {
                  approveUserMutation.mutate(userToApprove.id);
                  setApproveDialogOpen(false);
                  setUserToApprove(null);
                }
              }}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reject User Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {userToReject?.fullName} ({userToReject?.username})? 
              This will delete their account from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (userToReject) {
                  deleteUserMutation.mutate(userToReject.id);
                  setRejectDialogOpen(false);
                  setUserToReject(null);
                }
              }}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}