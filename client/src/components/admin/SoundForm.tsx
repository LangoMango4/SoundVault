import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface SoundFormProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  sound?: any;
}

export function SoundForm({ open, onOpenChange, sound }: SoundFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      name: "",
      categoryId: "",
      accessLevel: "basic",
    },
  });
  
  // Fetch categories for dropdown
  const { 
    data: categories = [],
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    enabled: open,
  });
  
  const addSoundMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedFile) {
        throw new Error("Please select a sound file");
      }
      
      // Use FormData to upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", data.name);
      formData.append("categoryId", data.categoryId);
      formData.append("accessLevel", data.accessLevel);
      
      // Use fetch directly here because apiRequest doesn't support FormData
      const response = await fetch("/api/sounds", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload sound");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sounds'] });
      toast({
        title: "Sound uploaded",
        description: "The sound has been uploaded successfully",
      });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload sound",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const onSubmit = (data: any) => {
    addSoundMutation.mutate(data);
  };
  
  useEffect(() => {
    if (!open) {
      // Reset the form when the dialog closes
      form.reset();
      setSelectedFile(null);
    }
  }, [open, form]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Sound</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sound Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sound name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="admin">Admin Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Sound File</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </FormControl>
              <FormMessage />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected file: {selectedFile.name}
                </p>
              )}
            </FormItem>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={
                  addSoundMutation.isPending || 
                  !selectedFile || 
                  !form.formState.isValid
                }
              >
                {addSoundMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Uploading...
                  </>
                ) : (
                  "Upload Sound"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}