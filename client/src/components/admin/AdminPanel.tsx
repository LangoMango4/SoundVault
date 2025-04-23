import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, PlayCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Sound, Category } from "@shared/schema";
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isSoundFormOpen, setIsSoundFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "user" | "sound", id: number } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<Record<number, boolean>>({});

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
              <TabsTrigger value="config">Config</TabsTrigger>
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
            
            <TabsContent value="config" className="flex-1 overflow-auto p-1">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Config People</h3>
                
                <div className="rounded-md bg-neutral-50 p-4 mb-6">
                  <h4 className="font-medium mb-2">User Credentials</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-neutral-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password (Click eye to view)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usersLoading ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center">
                              <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                            </td>
                          </tr>
                        ) : (
                          users?.map((user) => (
                            <tr key={user.id} className="hover:bg-neutral-50">
                              <td className="px-4 py-2">{user.username}</td>
                              <td className="px-4 py-2">{user.fullName}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center">
                                  <code className="text-xs font-mono break-all bg-neutral-100 p-1 rounded mr-2">
                                    {passwordVisibility[user.id] ? user.password : (user.password ? user.password.slice(0, 15) + "..." : "********")}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setPasswordVisibility(prev => ({
                                        ...prev,
                                        [user.id]: !prev[user.id]
                                      }));
                                    }}
                                  >
                                    {passwordVisibility[user.id] ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant={user.role === "admin" ? "success" : "secondary"}>
                                  {user.role}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab("users")}>
                    Manage Users
                  </Button>
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
        categories={categories || []}
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
