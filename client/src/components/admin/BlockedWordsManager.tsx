import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CustomBlockedWord } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  PlusCircle, 
  Loader2, 
  Trash,
  Edit,
  Save,
  X
} from "lucide-react";

type BlockedWordsManagerProps = {
  className?: string;
};

export default function BlockedWordsManager({ className }: BlockedWordsManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteWordId, setDeleteWordId] = useState<number | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newWordType, setNewWordType] = useState("exact");
  const [editingWord, setEditingWord] = useState<CustomBlockedWord | null>(null);
  const [editedWord, setEditedWord] = useState("");
  const [editedWordType, setEditedWordType] = useState("");

  // Fetch all custom blocked words
  const { data: blockedWords, isLoading } = useQuery<CustomBlockedWord[]>({
    queryKey: ["/api/moderation/blocked-words"],
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to load blocked words: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to add a new blocked word
  const addWordMutation = useMutation({
    mutationFn: async (data: { word: string; type: string }) => {
      const response = await fetch("/api/moderation/blocked-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: data.word,
          type: data.type,
          addedBy: user?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add blocked word");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/blocked-words"] });
      setNewWord("");
      toast({
        title: "Word added",
        description: "The blocked word has been added successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add blocked word: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to update a blocked word
  const updateWordMutation = useMutation({
    mutationFn: async (data: { id: number; word: string; type: string }) => {
      const response = await fetch(`/api/moderation/blocked-words/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: data.word,
          type: data.type,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update blocked word");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/blocked-words"] });
      setEditingWord(null);
      toast({
        title: "Word updated",
        description: "The blocked word has been updated successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update blocked word: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a blocked word
  const deleteWordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/moderation/blocked-words/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete blocked word");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/blocked-words"] });
      setDeleteDialogOpen(false);
      setDeleteWordId(null);
      toast({
        title: "Word removed",
        description: "The blocked word has been removed successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete blocked word: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) {
      toast({
        title: "Error",
        description: "Word cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    addWordMutation.mutate({
      word: newWord.trim(),
      type: newWordType,
    });
  };

  const handleEditWord = (word: CustomBlockedWord) => {
    setEditingWord(word);
    setEditedWord(word.word);
    setEditedWordType(word.type);
  };

  const handleSaveEdit = () => {
    if (!editingWord) return;
    
    if (!editedWord.trim()) {
      toast({
        title: "Error",
        description: "Word cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    updateWordMutation.mutate({
      id: editingWord.id,
      word: editedWord.trim(),
      type: editedWordType,
    });
  };

  const handleCancelEdit = () => {
    setEditingWord(null);
  };

  const handleDeleteWord = (id: number) => {
    setDeleteWordId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteWordId !== null) {
      deleteWordMutation.mutate(deleteWordId);
    }
  };

  const blockedWordsColumns = [
    {
      accessorKey: "word",
      header: "Word",
      cell: (word: CustomBlockedWord) => {
        if (editingWord && editingWord.id === word.id) {
          return (
            <Input
              value={editedWord}
              onChange={(e) => setEditedWord(e.target.value)}
              className="w-full"
            />
          );
        }
        return <span>{word.word}</span>;
      },
    },
    {
      accessorKey: "type",
      header: "Match Type",
      cell: (word: CustomBlockedWord) => {
        if (editingWord && editingWord.id === word.id) {
          return (
            <Select
              value={editedWordType}
              onValueChange={setEditedWordType}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Match Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="startsWith">Starts With</SelectItem>
                <SelectItem value="endsWith">Ends With</SelectItem>
              </SelectContent>
            </Select>
          );
        }
        
        // Convert type to readable form
        let displayType = word.type;
        switch (word.type) {
          case "exact":
            displayType = "Exact Match";
            break;
          case "contains":
            displayType = "Contains";
            break;
          case "startsWith":
            displayType = "Starts With";
            break;
          case "endsWith":
            displayType = "Ends With";
            break;
        }
        
        return <span>{displayType}</span>;
      },
    },
    {
      header: "Actions",
      cell: (word: CustomBlockedWord) => {
        if (editingWord && editingWord.id === word.id) {
          return (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateWordMutation.isPending}
              >
                {updateWordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditWord(word)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteWord(word.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Custom Blocked Words</h4>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Add custom words to be filtered in chat messages. You can specify different matching types for more flexible moderation.
      </p>
      
      <Card className="p-4">
        <form onSubmit={handleAddWord} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="new-word" className="sr-only">Word</Label>
            <Input
              id="new-word"
              placeholder="Add new word to block..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="word-type" className="sr-only">Match Type</Label>
            <Select
              value={newWordType}
              onValueChange={setNewWordType}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Match Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="startsWith">Starts With</SelectItem>
                <SelectItem value="endsWith">Ends With</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            disabled={addWordMutation.isPending || !newWord.trim()}
          >
            {addWordMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Add Word
          </Button>
        </form>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : blockedWords && blockedWords.length > 0 ? (
        <DataTable columns={blockedWordsColumns} data={blockedWords} />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
          <div className="mb-2 rounded-full bg-muted p-3">
            <svg 
              className="h-6 w-6 text-muted-foreground" 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" />
              <path d="M15 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1" />
              <path d="M8 11v5a4 4 0 0 0 8 0v-5" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No blocked words</h3>
          <p className="text-sm text-muted-foreground">
            Add custom words to enhance chat moderation.
          </p>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove this word from the custom blocked words list.
              The word will no longer be filtered in chat messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}