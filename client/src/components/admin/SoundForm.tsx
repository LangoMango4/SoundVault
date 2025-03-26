import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSoundSchema, Category } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Extended schema with validation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  accessLevel: z.string().min(1, "Access level is required"),
  file: z.instanceof(FileList).refine(files => files.length > 0, "Sound file is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface SoundFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}

export function SoundForm({ open, onOpenChange, categories }: SoundFormProps) {
  const { toast } = useToast();
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      accessLevel: "all",
      file: undefined,
    },
  });

  // Create sound mutation
  const createSoundMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("categoryId", values.categoryId);
      formData.append("accessLevel", values.accessLevel);
      
      // Get duration of audio file
      const file = values.file[0];
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        audio.onloadedmetadata = async () => {
          try {
            // Round to 1 decimal place
            const duration = Math.round(audio.duration * 10) / 10;
            formData.append("duration", duration.toString());
            formData.append("file", file);
            
            const res = await fetch("/api/sounds", {
              method: "POST",
              body: formData,
              credentials: "include",
            });
            
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(errorText);
            }
            
            resolve(await res.json());
          } catch (error) {
            reject(error);
          }
        };
        
        audio.onerror = () => {
          reject(new Error("Failed to load audio file"));
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sounds"] });
      toast({
        title: "Success",
        description: "Sound created successfully",
      });
      onOpenChange(false);
      form.reset();
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
        setAudioPreview(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create sound: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createSoundMutation.mutate(values);
  };
  
  // Handle file change for preview
  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      // Clean up previous preview URL
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
      
      // Create new preview URL
      const url = URL.createObjectURL(files[0]);
      setAudioPreview(url);
    }
  };
  
  // Clean up preview URL when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open && audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview(null);
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Sound</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sound Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Sound File</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="audio/*"
                      onChange={(e) => {
                        onChange(e.target.files);
                        handleFileChange(e.target.files);
                      }}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                  
                  {audioPreview && (
                    <div className="pt-2">
                      <audio controls className="w-full">
                        <source src={audioPreview} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
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
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="limited">Limited Users</SelectItem>
                      <SelectItem value="admin">Admin Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createSoundMutation.isPending}
              >
                {createSoundMutation.isPending ? "Uploading..." : "Add Sound"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
