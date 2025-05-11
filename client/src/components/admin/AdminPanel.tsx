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
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { UserForm } from "./UserForm";
import { SoundForm } from "./SoundForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CURRENT_VERSION, VERSION_HISTORY } from "@/hooks/use-update-notification";

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
  const [editingSound, setEditingSound] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToApprove, setUserToApprove] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve"
  );

  const { toast } = useToast();

  // Fetch users data
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/users", { signal });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  // Fetch sounds data
  const {
    data: sounds = [],
    isLoading: isLoadingSounds,
    refetch: refetchSounds,
  } = useQuery({
    queryKey: ["/api/sounds"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/sounds", { signal });
      if (!res.ok) throw new Error("Failed to fetch sounds");
      return res.json();
    }
  });

  // Fetch terms acceptance logs
  const {
    data: termsLogs = [],
    isLoading: isLoadingTermsLogs,
  } = useQuery({
    queryKey: ["/api/terms/logs"],
    queryFn: async ({ signal }) => {
      try {
        const res = await fetch("/api/terms/logs", { signal });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error("Error fetching terms logs:", error);
        return [];
      }
    }
  });

  // Fetch moderation logs
  const {
    data: moderationLogs = [],
    isLoading: isLoadingModerationLogs,
  } = useQuery({
    queryKey: ["/api/moderation/logs"],
    queryFn: async ({ signal }) => {
      try {
        const res = await fetch("/api/moderation/logs", { signal });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error("Error fetching moderation logs:", error);
        return [];
      }
    }
  });

  // Fetch user strikes
  const {
    data: userStrikes = [],
    isLoading: isLoadingUserStrikes,
  } = useQuery({
    queryKey: ["/api/moderation/strikes"],
    queryFn: async ({ signal }) => {
      try {
        const res = await fetch("/api/moderation/strikes", { signal });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error("Error fetching user strikes:", error);
        return [];
      }
    }
  });

  // Mutation for approving/rejecting users
  const approveUserMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: number; approved: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, { approved });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to update user approval status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setConfirmDialogOpen(false);
      setUserToApprove(null);
      toast({
        title: `User ${approvalAction === "approve" ? "approved" : "rejected"}`,
        description: approvalAction === "approve" 
          ? "The user can now log in to the system" 
          : "The user's registration has been rejected",
        variant: approvalAction === "approve" ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle user filtering
  const filteredUsers = users.filter((user: any) => {
    const searchLower = searchText.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  // Count pending approvals
  const pendingApprovalCount = filteredUsers.filter(
    (user: any) => user.approved === false
  ).length;

  // Handle user edit
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  // Handle sound edit
  const handleEditSound = (sound: any) => {
    setEditingSound(sound);
    setIsSoundFormOpen(true);
  };

  // Handle user form close
  const handleUserFormClose = (userUpdated: boolean) => {
    setIsUserFormOpen(false);
    setEditingUser(null);
    if (userUpdated) {
      refetchUsers();
    }
  };

  // Handle sound form close
  const handleSoundFormClose = (soundUpdated: boolean) => {
    setIsSoundFormOpen(false);
    setEditingSound(null);
    if (soundUpdated) {
      refetchSounds();
    }
  };

  // Handle approval/rejection confirmation
  const handleConfirmApproval = () => {
    if (!userToApprove) return;
    
    approveUserMutation.mutate({
      userId: userToApprove.id,
      approved: approvalAction === "approve"
    });
  };

  // Open confirm dialog for approval/rejection
  const openConfirmDialog = (user: any, action: "approve" | "reject") => {
    setUserToApprove(user);
    setApprovalAction(action);
    setConfirmDialogOpen(true);
  };

  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Admin Panel</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="users" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="users" onClick={() => setTableTab("users")}>
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="sounds" onClick={() => setTableTab("sounds")}>
              <FileAudio className="mr-2 h-4 w-4" />
              Sounds
            </TabsTrigger>
            <TabsTrigger value="logs" onClick={() => setTableTab("logs")}>
              <FileAudio className="mr-2 h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="moderation" onClick={() => setTableTab("moderation")}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="settings" onClick={() => setTableTab("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder="Search users..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8"
                />
                <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Button onClick={() => setIsUserFormOpen(true)}>
                Add User
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-border" />
                </div>
              ) : (
                <div className="h-full overflow-auto">
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
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableCaption>A list of all users</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.fullName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.role === "admin" ? "destructive" : "outline"}
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.approved ? "success" : "secondary"}
                              >
                                {user.approved ? "Approved" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!user.approved && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openConfirmDialog(user, "approve")}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => openConfirmDialog(user, "reject")}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="sounds" className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Sound Management</h2>
              <Button onClick={() => setIsSoundFormOpen(true)}>
                Add Sound
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {isLoadingSounds ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-border" />
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableCaption>A list of all sounds</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Filename</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sounds.map((sound) => (
                        <TableRow key={sound.id}>
                          <TableCell className="font-medium">{sound.id}</TableCell>
                          <TableCell>{sound.name}</TableCell>
                          <TableCell>{sound.filename}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {sound.accessLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sound.category?.name || "Uncategorized"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSound(sound)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="logs" className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <h2 className="text-xl font-bold mb-4">Terms &amp; Conditions Acceptance Logs</h2>
              
              {isLoadingTermsLogs ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-border" />
                </div>
              ) : termsLogs.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">No terms acceptance logs found</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableCaption>History of terms and conditions acceptances</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Terms Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termsLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.id}</TableCell>
                          <TableCell>{log.username}</TableCell>
                          <TableCell>{log.ipAddress}</TableCell>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell>{log.termsVersion || "1.0"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="moderation" className="flex-1 flex flex-col">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4">User Strikes</h2>
                  {isLoadingUserStrikes ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-border" />
                    </div>
                  ) : userStrikes.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-muted-foreground">No user strikes found</p>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableCaption>User moderation strikes</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Strike Count</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userStrikes.map((strike) => (
                            <TableRow key={strike.id}>
                              <TableCell className="font-medium">{strike.id}</TableCell>
                              <TableCell>{strike.username}</TableCell>
                              <TableCell>{strike.reason}</TableCell>
                              <TableCell>{strike.strikeCount}</TableCell>
                              <TableCell>{formatDate(strike.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-4">Moderation Logs</h2>
                  {isLoadingModerationLogs ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-border" />
                    </div>
                  ) : moderationLogs.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-muted-foreground">No moderation logs found</p>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableCaption>Content moderation history</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {moderationLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">{log.id}</TableCell>
                              <TableCell>{log.username}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{log.content}</TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell>{log.reason}</TableCell>
                              <TableCell>{formatDate(log.timestamp)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                
                <BlockedWordsManager />
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="settings" className="flex-1">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4">Test Notifications</h2>
                  <TestNotification />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-4">Update Notification</h2>
                  <UpdateNotificationTester />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-4">Version Info</h2>
                  <div className="border rounded-md p-4">
                    <p>Current Version: <span className="font-semibold">{CURRENT_VERSION}</span></p>
                    <div className="mt-4">
                      <h3 className="font-semibold">Version History:</h3>
                      <ul className="mt-2 space-y-2">
                        {Object.entries(VERSION_HISTORY).map(([version, details], index) => (
                          <li key={index} className="text-sm">
                            <strong>{version}</strong> ({formatDate(details.date)})
                            <ul className="ml-4 mt-1">
                              {details.changes.map((change, i) => (
                                <li key={i} className="text-xs">{change}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* User Form Dialog */}
      <UserForm
        user={editingUser}
        open={isUserFormOpen}
        onClose={handleUserFormClose}
      />
      
      {/* Sound Form Dialog */}
      <SoundForm
        sound={editingSound}
        open={isSoundFormOpen}
        onClose={handleSoundFormClose}
      />
      
      {/* Approval Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalAction === "approve" 
                ? "Approve User Registration" 
                : "Reject User Registration"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalAction === "approve"
                ? `Are you sure you want to approve ${userToApprove?.username}'s registration? They will be able to log in to the system.`
                : `Are you sure you want to reject ${userToApprove?.username}'s registration? They will not be able to log in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApproval}
              className={approvalAction === "approve" ? "" : "bg-destructive hover:bg-destructive/90"}
            >
              {approvalAction === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}