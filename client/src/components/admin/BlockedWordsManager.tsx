import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CustomBlockedWord } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, Plus, Trash2, Edit, Check } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

interface BlockedWordsManagerProps {
  className?: string;
}

type ModerationType = 'profanity' | 'hate_speech' | 'inappropriate' | 'concerning' | 'personal_info';

export function BlockedWordsManager({ className }: BlockedWordsManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<CustomBlockedWord | null>(null);
  const [wordInput, setWordInput] = useState("");
  const [typeInput, setTypeInput] = useState<ModerationType>("profanity");
  
  // Query to get all custom blocked words
  const { 
    data: blockedWords,
    isLoading: blockedWordsLoading,
    refetch: refetchBlockedWords
  } = useQuery<CustomBlockedWord[]>({
    queryKey: ["/api/moderation/blocked-words"],
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to load blocked words: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to add a new blocked word
  const addWordMutation = useMutation({
    mutationFn: async (data: { word: string; type: string }) => {
      const response = await apiRequest("POST", "/api/moderation/blocked-words", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/blocked-words"] });
      setIsAddDialogOpen(false);
      setWordInput("");
      setTypeInput("profanity");
      toast({
        title: "Word Added",
        description: `"${wordInput}" has been added to the blocklist.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Word",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to update a blocked word
  const updateWordMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<CustomBlockedWord> }) => {
      const { id, updates } = data;
      const response = await apiRequest("PATCH", `/api/moderation/blocked-words/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/blocked-words"] });
      setEditingWord(null);
      setIsAddDialogOpen(false);
      toast({
        title: "Word Updated",
        description: "Blocked word has been updated successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Word",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to delete a blocked word
  const deleteWordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/moderation/blocked-words/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/blocked-words"] });
      toast({
        title: "Word Deleted",
        description: "Blocked word has been removed successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Word",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!wordInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a word to block",
        variant: "destructive",
      });
      return;
    }
    
    if (editingWord) {
      // Update existing word
      updateWordMutation.mutate({
        id: editingWord.id,
        updates: {
          word: wordInput,
          type: typeInput
        }
      });
    } else {
      // Add new word
      addWordMutation.mutate({
        word: wordInput,
        type: typeInput
      });
    }
  };
  
  // Open add/edit dialog
  const openDialog = (word?: CustomBlockedWord) => {
    if (word) {
      setEditingWord(word);
      setWordInput(word.word);
      setTypeInput(word.type as ModerationType);
    } else {
      setEditingWord(null);
      setWordInput("");
      setTypeInput("profanity");
    }
    setIsAddDialogOpen(true);
  };
  
  // Table columns for displaying blocked words
  const columns = [
    {
      accessorKey: "word",
      header: "Blocked Word",
      cell: (word: CustomBlockedWord) => <span className="font-medium">{word.word}</span>
    },
    {
      accessorKey: "type",
      header: "Category",
      cell: (word: CustomBlockedWord) => {
        let variant: "default" | "destructive" | "outline" | "secondary" | "success" = "default";
        
        switch(word.type) {
          case "profanity":
            variant = "default";
            break;
          case "hate_speech":
            variant = "destructive";
            break;
          case "inappropriate":
            variant = "secondary";
            break;
          case "concerning":
            variant = "outline";
            break;
          case "personal_info":
            variant = "success";
            break;
        }
        
        // Format the label
        const label = word.type
          .replace("_", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
        
        return <Badge variant={variant}>{label}</Badge>;
      }
    },
    {
      header: "Actions",
      cell: (word: CustomBlockedWord) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDialog(word)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteWordMutation.mutate(word.id)}
            disabled={deleteWordMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium">Custom Blocked Words</h4>
        <Button
          onClick={() => openDialog()}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Word
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Add specific words or phrases that should be blocked in chat messages.
        The system will automatically detect and filter these words.
      </p>
      
      {blockedWordsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : blockedWords && blockedWords.length > 0 ? (
        <DataTable columns={columns} data={blockedWords} />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
          <div className="mb-2 rounded-full bg-muted p-3">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No custom blocked words</h3>
          <p className="text-sm text-muted-foreground">
            You haven't added any custom blocked words yet.
          </p>
          <Button
            onClick={() => openDialog()}
            variant="outline"
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first word
          </Button>
        </div>
      )}
      
      {/* Add/Edit Word Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWord ? "Edit Blocked Word" : "Add Blocked Word"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="word">Word or Phrase</Label>
                <Input
                  id="word"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Enter word to block"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Category</Label>
                <Select
                  value={typeInput}
                  onValueChange={(value) => setTypeInput(value as ModerationType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profanity">Profanity</SelectItem>
                    <SelectItem value="hate_speech">Hate Speech</SelectItem>
                    <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                    <SelectItem value="concerning">Concerning Content</SelectItem>
                    <SelectItem value="personal_info">Personal Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit"
                disabled={addWordMutation.isPending || updateWordMutation.isPending}
              >
                {(addWordMutation.isPending || updateWordMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingWord ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}