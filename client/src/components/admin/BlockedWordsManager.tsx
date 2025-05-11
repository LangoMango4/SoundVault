import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BlockedWordsManagerProps {
  className?: string;
}

export default function BlockedWordsManager({ className }: BlockedWordsManagerProps) {
  const [newWord, setNewWord] = useState("");
  const { toast } = useToast();
  
  // Fetch custom blocked words
  const { 
    data: blockedWords = [], 
    isLoading,
  } = useQuery({
    queryKey: ['/api/moderation/blocked-words'],
    queryFn: async () => {
      const response = await fetch('/api/moderation/blocked-words');
      if (!response.ok) {
        throw new Error('Failed to fetch blocked words');
      }
      return response.json();
    },
  });
  
  // Add new blocked word
  const addBlockedWordMutation = useMutation({
    mutationFn: async (word: string) => {
      await apiRequest("POST", "/api/moderation/blocked-words", { word });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/blocked-words'] });
      setNewWord("");
      toast({
        title: "Word added",
        description: "The blocked word has been added to the list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add word",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Remove blocked word
  const removeBlockedWordMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/moderation/blocked-words/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/blocked-words'] });
      toast({
        title: "Word removed",
        description: "The blocked word has been removed from the list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove word",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    
    addBlockedWordMutation.mutate(newWord.trim());
  };
  
  return (
    <div className={className}>
      <h4 className="text-lg font-medium mb-4">Custom Blocked Words</h4>
      <p className="text-sm text-muted-foreground mb-4">
        Add custom words to be filtered in chat messages. These words will be automatically filtered 
        along with the default moderation rules.
      </p>
      
      <form onSubmit={handleAddWord} className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Enter word to block..."
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" disabled={!newWord.trim() || addBlockedWordMutation.isPending}>
          {addBlockedWordMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Word
        </Button>
      </form>
      
      <div className="border rounded-md p-4 bg-muted/30">
        <h5 className="text-sm font-medium mb-3">Current Blocked Words</h5>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : blockedWords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {blockedWords.map((word: any) => (
              <Badge key={word.id} variant="outline" className="pl-3 pr-2 py-1.5 flex items-center gap-1">
                {word.word}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent hover:text-destructive"
                  onClick={() => removeBlockedWordMutation.mutate(word.id)}
                  disabled={removeBlockedWordMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No custom blocked words have been added yet.</p>
        )}
      </div>
    </div>
  );
}