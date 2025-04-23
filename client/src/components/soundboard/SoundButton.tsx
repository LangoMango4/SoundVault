import { Sound } from "@shared/schema";
import { useEffect, useState } from "react";
import { Howl, Howler } from "howler";
import { Music } from "lucide-react";

// Create a global event bus for sound events
const globalSoundEvents = new EventTarget();
const SOUND_PLAY_EVENT = 'sound-play';

interface SoundButtonProps {
  sound: Sound;
}

export function SoundButton({ sound }: SoundButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [howl, setHowl] = useState<Howl | null>(null);

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

  const handleClick = () => {
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
      
      // Play this sound
      howl.play();
      setIsPlaying(true);
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
      <div className="font-medium text-sm">{sound.name}</div>
    </button>
  );
}
