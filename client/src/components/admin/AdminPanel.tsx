import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, PlayCircle, Loader2, Calendar, Clock, UserCircle, Tag, Monitor } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Sound, Category, TermsAcceptanceLog } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserForm } from "./UserForm";
import { SoundForm } from "./SoundForm";
import { ScreenLockControl } from "./ScreenLockControl";
import { BatchSoundImport } from "./BatchSoundImport";
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
  const [itemToDelete, setItemToDelete] = useState<{ type: "user" | "sound", id: number } | null>(null);

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

  // Delete mutations
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
    } else {
      deleteSoundMutation.mutate(itemToDelete.id);
    }
  };

  // Handle opening delete dialog
  const openDeleteDialog = (type: "user" | "sound", id: number) => {
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
      accessorKey: "userAgent",
      header: "Browser",
      cell: (log: TermsAcceptanceLog) => (
        <div className="flex items-center gap-1.5 max-w-[200px] truncate" title={log.userAgent || ""}>
          <Monitor className="h-4 w-4 text-muted-foreground" />
          {log.userAgent ? log.userAgent.split(" ").slice(0, 2).join(" ") : "Unknown"}
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
