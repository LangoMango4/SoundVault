import { Sound } from "@shared/schema";
import { SoundButton } from "./SoundButton";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface SoundGridProps {
  categorySlug: string;
}

export function SoundGrid({ categorySlug }: SoundGridProps) {
  const queryUrl = categorySlug === "all" 
    ? "/api/sounds" 
    : `/api/sounds?category=${categorySlug}`;
    
  const { data: sounds, isLoading, error } = useQuery<Sound[]>({
    queryKey: [queryUrl],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-destructive">Failed to load sounds: {error.message}</p>
      </div>
    );
  }

  if (!sounds || sounds.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">No sounds found in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {sounds.map((sound) => (
        <SoundButton key={sound.id} sound={sound} />
      ))}
    </div>
  );
}
