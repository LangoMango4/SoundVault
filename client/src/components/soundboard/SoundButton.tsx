import { Sound } from "@shared/schema";
import { useEffect, useState } from "react";
import { Howl } from "howler";
import { Music } from "lucide-react";

interface SoundButtonProps {
  sound: Sound;
}

export function SoundButton({ sound }: SoundButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [howl, setHowl] = useState<Howl | null>(null);

  // Create a Howl instance for the sound
  useEffect(() => {
    const soundHowl = new Howl({
      src: [`/api/sounds/files/${sound.filename}`],
      html5: true,
      onend: () => {
        setIsPlaying(false);
        setProgress(0);
      },
    });
    
    setHowl(soundHowl);
    
    // Cleanup on unmount
    return () => {
      soundHowl.unload();
    };
  }, [sound.filename]);

  // Update progress bar while playing
  useEffect(() => {
    if (!isPlaying || !howl) return;
    
    const interval = setInterval(() => {
      const seek = howl.seek() as number;
      const duration = howl.duration();
      setProgress((seek / duration) * 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, howl]);

  const handleClick = () => {
    if (!howl) return;
    
    if (isPlaying) {
      howl.stop();
      setIsPlaying(false);
      setProgress(0);
    } else {
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
      <div className="text-xs text-neutral-500">{sound.duration}s</div>
      {isPlaying && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-primary" 
          style={{ width: `${progress}%` }}
        />
      )}
    </button>
  );
}
