import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, PlayCircle, Loader2, Calendar, Clock, UserCircle, Tag, Monitor, Globe, Smartphone, CheckCircle, Search, Bell, AlertTriangle, Shield, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Sound, Category, TermsAcceptanceLog, ChatModerationLog, UserStrike } from "@shared/schema";
import { CURRENT_VERSION, VERSION_HISTORY } from "@/hooks/use-update-notification";
import { useUpdateNotification } from "@/hooks/use-update-notification";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserForm } from "./UserForm";
import { SoundForm } from "./SoundForm";
import { ScreenLockControl } from "./ScreenLockControl";
import { BatchSoundImport } from "./BatchSoundImport";
import UpdateNotificationTester from "./UpdateNotificationTester";
import { Howl } from "howler";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";



interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isScreenLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
}

export function AdminPanel({ 
  open, 
  onOpenChange,
  isScreenLocked = false,
  onLockChange
}: AdminPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [termsLogsLimit, setTermsLogsLimit] = useState(100);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isSoundFormOpen, setIsSoundFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "user" | "sound" | "termslog", id: number } | null>(null);
  const [searchParams, setSearchParams] = useState<{username?: string; version?: string; method?: string}>({});
  const [isSearching, setIsSearching] = useState(false);
  
  // Moderation state
  const [moderationLogsLimit, setModerationLogsLimit] = useState(100);

  // Users query
  const { 
    data: users,
    isLoading: usersLoading,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open && activeTab === "users",
  });

  // Sounds and categories queries
  const { 
    data: sounds,
    isLoading: soundsLoading,
  } = useQuery<Sound[]>({
    queryKey: ["/api/sounds"],
    enabled: open && activeTab === "sounds",
  });

  const { 
    data: categories
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });
  
  // Terms & Conditions logs query
  const {
    data: termsLogs,
    isLoading: termsLogsLoading,
    refetch: refetchTermsLogs
  } = useQuery<TermsAcceptanceLog[]>({
    queryKey: ["/api/terms/logs", termsLogsLimit],
    enabled: open && activeTab === "termslogs",
  });
  
  // Chat moderation logs query
  const {
    data: moderationLogs,
    isLoading: moderationLogsLoading,
    refetch: refetchModerationLogs
  } = useQuery<ChatModerationLog[]>({
    queryKey: ["/api/moderation/logs", moderationLogsLimit],
    enabled: open && activeTab === "moderation",
  });
  
  // User strikes query
  const {
    data: userStrikes,
    isLoading: userStrikesLoading,
    refetch: refetchUserStrikes
  } = useQuery<UserStrike[]>({
    queryKey: ["/api/moderation/strikes"],
    enabled: open && activeTab === "moderation",
  });
  
  // Search Terms & Conditions logs
  const searchTermsLogs = async () => {
    try {
      setIsSearching(true);
      const params = new URLSearchParams();
      
      if (searchParams.username?.trim()) {
        params.append("username", searchParams.username.trim());
      }
      
      if (searchParams.version?.trim()) {
        params.append("version", searchParams.version.trim());
      }
      
      if (searchParams.method?.trim() && searchParams.method !== 'all') {
        params.append("acceptanceMethod", searchParams.method.trim());
      }
      
      const response = await fetch(`/api/terms/logs/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      queryClient.setQueryData(["/api/terms/logs", termsLogsLimit], data);
      
      toast({
        title: "Search completed",
        description: `Found ${data.length} result${data.length !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Delete mutations
  const deleteTermsLogMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/terms/logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terms/logs"] });
      toast({
        title: "Success",
        description: "Log entry deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete log: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteSoundMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sounds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sounds"] });
      toast({
        title: "Success",
        description: "Sound deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete sound: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Chat moderation mutations
  const toggleChatRestrictionMutation = useMutation({
    mutationFn: async ({ userId, restrict }: { userId: number; restrict: boolean }) => {
      return await apiRequest("POST", `/api/moderation/strikes/user/${userId}/restrict`, { restrict });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/strikes"] });
      toast({
        title: "Success",
        description: "User chat restriction status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update chat restriction: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const clearStrikesMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/moderation/strikes/user/${userId}/clear`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/strikes"] });
      toast({
        title: "Success",
        description: "User strikes cleared successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to clear strikes: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Close forms when panel closes
  useEffect(() => {
    if (!open) {
      setIsUserFormOpen(false);
      setIsSoundFormOpen(false);
      setEditingUser(null);
    }
  }, [open]);

  // Handle deletion confirmation
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === "user") {
      deleteUserMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "sound") {
      deleteSoundMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "termslog") {
      deleteTermsLogMutation.mutate(itemToDelete.id);
    }
  };

  // Handle opening delete dialog
  const openDeleteDialog = (type: "user" | "sound" | "termslog", id: number) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  // Play sound
  const playSound = (sound: Sound) => {
    const howl = new Howl({
      src: [`/api/sounds/files/${sound.filename}`],
      html5: true,
    });
    howl.play();
  };

  // User columns for data table
  const userColumns = [
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "fullName",
      header: "Full Name",
    },
    {
      accessorKey: "accessLevel",
      header: "Access Level",
      cell: (user: User) => {
        const variant = 
          user.accessLevel === "full" ? "success" :
          user.accessLevel === "limited" ? "info" : "warning";
        
        const label = 
          user.accessLevel === "full" ? "Full Access" :
          user.accessLevel === "limited" ? "Limited Access" : "Basic Access";
          
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      header: "Actions",
      cell: (user: User) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingUser(user);
              setIsUserFormOpen(true);
            }}
          >
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog("user", user.id);
            }}
            disabled={user.role === "admin"}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Terms & Conditions logs columns for data table
  const termsLogsColumns = [
    {
      accessorKey: "username",
      header: "Username",
      cell: (log: TermsAcceptanceLog) => (
        <div className="flex items-center gap-1.5">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          {log.username}
        </div>
      )
    },
    {
      accessorKey: "version",
      header: "Version",
      cell: (log: TermsAcceptanceLog) => (
        <div className="flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {log.version}
        </div>
      )
    },
    {
      accessorKey: "acceptanceTime",
      header: "Date",
      cell: (log: TermsAcceptanceLog) => {
        const date = new Date(log.acceptanceTime);
        return (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {date.toLocaleDateString()}
          </div>
        );
      }
    },
    {
      accessorKey: "acceptanceTime",
      header: "Time",
      cell: (log: TermsAcceptanceLog) => {
        const date = new Date(log.acceptanceTime);
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {date.toLocaleTimeString()}
          </div>
        );
      }
    },
    {
      accessorKey: "acceptanceMethod",
      header: "Method",
      cell: (log: TermsAcceptanceLog) => (
        <div className="flex items-center gap-1.5">
          {log.acceptanceMethod === "web" ? (
            <>
              <Globe className="h-4 w-4 text-muted-foreground" />
              Web Interface
            </>
          ) : log.acceptanceMethod === "mobile" ? (
            <>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              Mobile App
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              {log.acceptanceMethod}
            </>
          )}
        </div>
      )
    },
    {
      header: "Actions",
      cell: (log: TermsAcceptanceLog) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog("termslog", log.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Chat moderation logs columns for data table
  const moderationLogsColumns = [
    {
      accessorKey: "username",
      header: "Username",
      cell: (log: ChatModerationLog) => (
        <div className="flex items-center gap-1.5">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          {log.username}
        </div>
      )
    },
    {
      accessorKey: "originalMessage",
      header: "Original Message",
      cell: (log: ChatModerationLog) => (
        <div className="max-w-[280px] truncate">
          <span className="font-medium text-yellow-500">{log.originalMessage}</span>
        </div>
      )
    },
    {
      accessorKey: "moderationType",
      header: "Type",
      cell: (log: ChatModerationLog) => {
        const variant = 
          log.moderationType === "profanity" ? "warning" :
          log.moderationType === "hate_speech" ? "destructive" : "default";
        
        const label = 
          log.moderationType === "profanity" ? "Profanity" :
          log.moderationType === "hate_speech" ? "Hate Speech" : 
          log.moderationType === "inappropriate" ? "Inappropriate" : log.moderationType;
          
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: (log: ChatModerationLog) => (
        <div className="max-w-[200px] truncate">
          {log.reason}
        </div>
      )
    },
    {
      accessorKey: "moderatedAt",
      header: "Date",
      cell: (log: ChatModerationLog) => {
        const date = new Date(log.moderatedAt);
        return (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {date.toLocaleDateString()}
          </div>
        );
      }
    },
    {
      accessorKey: "moderatedAt",
      header: "Time",
      cell: (log: ChatModerationLog) => {
        const date = new Date(log.moderatedAt);
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {date.toLocaleTimeString()}
          </div>
        );
      }
    },
  ];

  // User strikes columns for data table
  const userStrikesColumns = [
    {
      accessorKey: "username",
      header: "Username",
      cell: (strike: UserStrike) => (
        <div className="flex items-center gap-1.5">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          {strike.username}
        </div>
      )
    },
    {
      accessorKey: "strikesCount",
      header: "Strikes",
      cell: (strike: UserStrike) => {
        let variant = "default";
        if (strike.strikesCount >= 5) {
          variant = "destructive";
        } else if (strike.strikesCount >= 3) {
          variant = "warning";
        }
        
        return <Badge variant={variant}>{strike.strikesCount}</Badge>;
      }
    },
    {
      accessorKey: "isChatRestricted",
      header: "Chat Status",
      cell: (strike: UserStrike) => {
        return strike.isChatRestricted ? 
          <Badge variant="destructive">Restricted</Badge> : 
          <Badge variant="success">Active</Badge>;
      }
    },
    {
      accessorKey: "lastStrikeAt",
      header: "Last Strike",
      cell: (strike: UserStrike) => {
        if (!strike.lastStrikeAt) return "Never";
        
        const date = new Date(strike.lastStrikeAt);
        return (
          <div className="flex flex-col">
            <span>{date.toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</span>
          </div>
        );
      }
    },
    {
      header: "Actions",
      cell: (strike: UserStrike) => (
        <div className="flex space-x-2">
          <Button
            variant={strike.isChatRestricted ? "outline" : "ghost"}
            size="sm"
            className={strike.isChatRestricted ? "border-green-500 text-green-500 hover:bg-green-50" : ""}
            onClick={(e) => {
              e.stopPropagation();
              toggleChatRestrictionMutation.mutate({
                userId: strike.userId,
                restrict: !strike.isChatRestricted
              });
            }}
          >
            {strike.isChatRestricted ? "Restore Chat" : "Restrict Chat"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              clearStrikesMutation.mutate(strike.userId);
            }}
          >
            Clear Strikes
          </Button>
        </div>
      )
    },
  ];

  // Sound columns for data table
  const soundColumns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: (sound: Sound) => {
        const category = categories?.find(c => c.id === sound.categoryId);
        return category?.name || "-";
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: (sound: Sound) => `${sound.duration}s`,
    },
    {
      accessorKey: "accessLevel",
      header: "Access Level",
      cell: (sound: Sound) => {
        const variant = 
          sound.accessLevel === "all" ? "success" :
          sound.accessLevel === "limited" ? "info" : "warning";
        
        const label = 
          sound.accessLevel === "all" ? "All Users" :
          sound.accessLevel === "limited" ? "Limited Users" : "Admin Only";
          
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      header: "Actions",
      cell: (sound: Sound) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              playSound(sound);
            }}
          >
            <PlayCircle className="h-4 w-4 text-neutral-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog("sound", sound.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Admin Panel</DialogTitle>
          </DialogHeader>
          
          {/* Screen Lock Control */}
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-medium mb-4">Security Settings</h3>
            {onLockChange && (
              <ScreenLockControl
                isLocked={isScreenLocked}
                onLockChange={onLockChange}
              />
            )}
          </div>
            
          <Tabs 
            defaultValue="users" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="border-b rounded-none justify-start">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="sounds">Sounds</TabsTrigger>
              <TabsTrigger value="termslogs">Terms & Conditions Logs</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="flex-1 overflow-auto p-1">
              <div className="flex justify-between mb-6">
                <h3 className="text-lg font-medium">Manage Users</h3>
                <Button 
                  onClick={() => {
                    setEditingUser(null);
                    setIsUserFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </div>
              
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <DataTable columns={userColumns} data={users || []} />
              )}
            </TabsContent>
            
            <TabsContent value="sounds" className="flex-1 overflow-auto p-1">
              <div className="flex justify-between mb-6">
                <h3 className="text-lg font-medium">Manage Sounds</h3>
                <Button 
                  onClick={() => setIsSoundFormOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Sound
                </Button>
              </div>
              
              {/* Batch Sound Import Component */}
              <div className="mb-6">
                <BatchSoundImport />
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Sound Library</h3>
                {soundsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <DataTable columns={soundColumns} data={sounds || []} />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="termslogs" className="flex-1 overflow-auto p-1">
              <div className="flex justify-between mb-6">
                <h3 className="text-lg font-medium">Terms & Conditions Acceptance Logs</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      refetchTermsLogs();
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M8 16H3v5"/>
                    </svg>
                    Refresh
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This table shows all instances where users have accepted the Terms & Conditions. Logs are sorted by the most recent acceptance first.
                </p>
                
                {/* Search Form */}
                <div className="bg-card rounded-md border shadow-sm p-4">
                  <h4 className="font-medium mb-3">Search Logs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        placeholder="Search by username"
                        onChange={(e) => setSearchParams(prev => ({ ...prev, username: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Input 
                        id="version" 
                        placeholder="e.g. 1.2.0"
                        onChange={(e) => setSearchParams(prev => ({ ...prev, version: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="method">Acceptance Method</Label>
                      <Select onValueChange={(value) => setSearchParams(prev => ({ ...prev, method: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All methods</SelectItem>
                          <SelectItem value="web">Web Interface</SelectItem>
                          <SelectItem value="mobile">Mobile App</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchParams({});
                        refetchTermsLogs();
                      }}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={() => searchTermsLogs()}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {termsLogsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : termsLogs && termsLogs.length > 0 ? (
                  <DataTable columns={termsLogsColumns} data={termsLogs} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-2 rounded-full bg-muted p-3">
                      <svg className="h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15V6" />
                        <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                        <path d="M12 12H3" />
                        <path d="M16 6H3" />
                        <path d="M12 18H3" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium">No logs found</h3>
                    <p className="text-sm text-muted-foreground">
                      No Terms & Conditions acceptance logs have been recorded yet.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="moderation" className="flex-1 overflow-auto p-1">
              <div className="flex justify-between mb-6">
                <h3 className="text-lg font-medium">Chat Moderation</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      refetchModerationLogs();
                      refetchUserStrikes();
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M8 16H3v5"/>
                    </svg>
                    Refresh
                  </Button>
                </div>
              </div>
              
              <div className="space-y-8">
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
            
            <TabsContent value="system" className="flex-1 overflow-auto p-1">
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
              This action cannot be undone. This will permanently delete the {itemToDelete?.type}.
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
    </>
  );
}
