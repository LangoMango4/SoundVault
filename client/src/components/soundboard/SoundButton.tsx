import { Sound } from "@shared/schema";
import { useEffect, useState, useRef } from "react";
import { Howl, Howler } from "howler";
import { Edit, Music, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Create a global event bus for sound events
const globalSoundEvents = new EventTarget();
const SOUND_PLAY_EVENT = 'sound-play';

interface SoundButtonProps {
  sound: Sound;
}

export function SoundButton({ sound }: SoundButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [howl, setHowl] = useState<Howl | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(sound.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create a Howl instance for the sound
  useEffect(() => {
    const soundHowl = new Howl({
      src: [`/api/sounds/files/${sound.filename}`],
      html5: true,
      onend: () => {
        setIsPlaying(false);
      },
    });
    
    setHowl(soundHowl);
    
    // Cleanup on unmount
    return () => {
      soundHowl.unload();
    };
  }, [sound.filename]);

  // Listen for other sounds being played
  useEffect(() => {
    const handleOtherSoundPlay = (event: Event) => {
      // If this is not the sound that triggered the event and this sound is playing
      if (howl && isPlaying && (event as CustomEvent).detail !== sound.id) {
        howl.stop();
        setIsPlaying(false);
      }
    };

    globalSoundEvents.addEventListener(SOUND_PLAY_EVENT, handleOtherSoundPlay);
    
    return () => {
      globalSoundEvents.removeEventListener(SOUND_PLAY_EVENT, handleOtherSoundPlay);
    };
  }, [howl, isPlaying, sound.id]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Check if the site is deployed (not localhost)
  const isDeployed = !window.location.hostname.includes('localhost') && 
                     !window.location.hostname.includes('127.0.0.1');

  const handleClick = () => {
    // Don't play sound if we're editing the name
    if (isEditing) return;
    
    if (!howl) return;
    
    if (isPlaying) {
      howl.stop();
      setIsPlaying(false);
    } else {
      // Stop all other sounds first
      Howler.stop();
      
      // Notify other sound buttons that this sound is playing
      globalSoundEvents.dispatchEvent(
        new CustomEvent(SOUND_PLAY_EVENT, { detail: sound.id })
      );
      
      // Only play the sound if not deployed
      if (!isDeployed) {
        howl.play();
      }
      setIsPlaying(true);
    }
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the button click
    setIsEditing(true);
  };

  const saveNewName = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the button click
    
    if (newName.trim() === '') {
      toast({
        title: "Error",
        description: "Sound name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest('PUT', `/api/sounds/${sound.id}/rename`, { name: newName });
      
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['/api/sounds'] });
      
      toast({
        title: "Success",
        description: "Sound name updated successfully"
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sound name",
        variant: "destructive"
      });
    }
  };

  return (
    <button
      className={`relative flex flex-col items-center justify-center bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg p-4 h-32 shadow-sm overflow-hidden transition-all ${
        isPlaying ? "bg-primary/10" : ""
      }`}
      onClick={handleClick}
    >
      <Music className="h-6 w-6 text-primary mb-2" />
      
      {isDeployed && (
        <div className="absolute top-1 right-1">
          <span className="text-xs text-gray-400 italic">Sound disabled</span>
        </div>
      )}
      
      {isEditing ? (
        <div 
          className="flex items-center space-x-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveNewName(e as any);
              } else if (e.key === 'Escape') {
                setIsEditing(false);
                setNewName(sound.name);
              }
            }}
          />
          <Save 
            className="h-5 w-5 text-green-600 cursor-pointer hover:text-green-800"
            onClick={saveNewName}
          />
        </div>
      ) : (
        <div className="flex items-center font-medium text-sm">
          <span>{sound.name}</span>
          {user && user.role === "admin" && (
            <Edit 
              className="h-3.5 w-3.5 ml-1 text-gray-400 cursor-pointer hover:text-gray-600"
              onClick={startEditing}
            />
          )}
        </div>
      )}
    </button>
  );
}
