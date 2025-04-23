import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, FileAudio, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Category } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DownloadedSound {
  filename: string;
  name: string;
  registered: boolean;
  id?: number;
  error?: string;
}

export function BatchSoundImport() {
  const { toast } = useToast();
  const [downloadedSounds, setDownloadedSounds] = useState<DownloadedSound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("1"); // Default category
  const [registrationProgress, setRegistrationProgress] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch downloaded sounds
  useEffect(() => {
    async function fetchDownloadedSounds() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/sounds/downloaded");
        
        if (!response.ok) {
          throw new Error("Failed to fetch downloaded sounds");
        }
        
        const data = await response.json();
        setDownloadedSounds(data.sounds);
      } catch (error) {
        console.error("Error fetching downloaded sounds:", error);
        toast({
          title: "Error",
          description: "Failed to fetch downloaded sounds",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDownloadedSounds();
  }, [toast]);

  // Register individual sound mutation
  const registerSoundMutation = useMutation({
    mutationFn: async ({ sound, categoryId }: { sound: DownloadedSound, categoryId: string }) => {
      const formData = new FormData();
      formData.append("name", sound.name);
      formData.append("filename", sound.filename);
      formData.append("categoryId", categoryId);
      formData.append("accessLevel", "all");
      formData.append("duration", "0.0"); // Default duration
      
      const response = await fetch("/api/sounds/import", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sounds"] });
    },
  });

  // Register all downloaded sounds
  const registerAllSounds = async () => {
    setIsRegistering(true);
    setRegistrationProgress(0);
    
    const unregisteredSounds = downloadedSounds.filter(sound => !sound.registered);
    let successCount = 0;
    
    // Create a copy of the sounds array to update during registration
    const updatedSounds = [...downloadedSounds];
    
    for (let i = 0; i < unregisteredSounds.length; i++) {
      try {
        const sound = unregisteredSounds[i];
        const result = await registerSoundMutation.mutateAsync({
          sound,
          categoryId: selectedCategory,
        });
        
        // Update the sound in our local state
        const index = updatedSounds.findIndex(s => s.filename === sound.filename);
        updatedSounds[index] = {
          ...sound,
          registered: true,
          id: result.id,
        };
        
        successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        
        // Update the sound with error information
        const index = updatedSounds.findIndex(s => s.filename === unregisteredSounds[i].filename);
        updatedSounds[index] = {
          ...unregisteredSounds[i],
          registered: false,
          error: message,
        };
        
        console.error(`Error registering sound ${unregisteredSounds[i].name}:`, message);
      }
      
      // Update progress
      setRegistrationProgress(Math.round(((i + 1) / unregisteredSounds.length) * 100));
      setDownloadedSounds(updatedSounds);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    toast({
      title: "Registration Complete",
      description: `Successfully registered ${successCount} out of ${unregisteredSounds.length} sounds`,
      variant: successCount === unregisteredSounds.length ? "default" : "destructive",
    });
    
    setIsRegistering(false);
  };

  // Get stats
  const totalSounds = downloadedSounds.length;
  const registeredSounds = downloadedSounds.filter(s => s.registered).length;
  const unregisteredSounds = totalSounds - registeredSounds;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5" />
          Import Downloaded Sounds
        </CardTitle>
        <CardDescription>
          Register downloaded sounds to make them available in the soundboard
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <p>Loading downloaded sounds...</p>
          </div>
        ) : downloadedSounds.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No sounds found</AlertTitle>
            <AlertDescription>
              No downloaded sounds were found. Use the download script to download sounds first.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Found {totalSounds} sounds: {registeredSounds} registered, {unregisteredSounds} unregistered
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={isRegistering}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={registerAllSounds}
                  disabled={isRegistering || unregisteredSounds === 0}
                  className="min-w-32"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isRegistering ? `Registering (${registrationProgress}%)` : `Register ${unregisteredSounds} Sounds`}
                </Button>
              </div>
            </div>
            
            {isRegistering && (
              <Progress value={registrationProgress} className="mb-4" />
            )}
            
            <ScrollArea className="h-[400px] border rounded-md p-2">
              <div className="space-y-2">
                {downloadedSounds.map((sound, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md border
                      ${sound.registered ? "bg-green-50 border-green-200" : 
                        sound.error ? "bg-red-50 border-red-200" : "bg-white"}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <FileAudio className="h-4 w-4 text-muted-foreground" />
                      <span>{sound.name}</span>
                    </div>
                    <div className="flex items-center">
                      {sound.registered ? (
                        <div className="flex items-center text-green-600 gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Registered</span>
                        </div>
                      ) : sound.error ? (
                        <div className="flex items-center text-red-600 gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">{sound.error}</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRegistering}
                          onClick={() => registerSoundMutation.mutate({
                            sound,
                            categoryId: selectedCategory
                          })}
                        >
                          Register
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}