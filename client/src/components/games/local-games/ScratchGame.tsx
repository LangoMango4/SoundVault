import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ScratchGame() {
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mark as loaded after a short delay (gives iframe time to load)
    const timer = setTimeout(() => {
      setIsLoaded(true);
      toast({
        title: "Game loaded",
        description: "Have fun playing!",
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto gap-4">
      <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b">
          <h2 className="text-xl font-bold text-slate-800">Scratch Ninja Run</h2>
          <p className="text-sm text-slate-500">
            Play as a ninja and dodge obstacles to get a high score!
          </p>
        </div>
        <div className="flex justify-center p-4 bg-white">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-700 border-l-blue-600 border-r-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-blue-700 font-medium">Loading game...</p>
              </div>
            </div>
          )}
          <iframe 
            src="https://scratch.mit.edu/projects/105500895/embed" 
            allowTransparency={true} 
            width="485" 
            height="402" 
            frameBorder="0" 
            scrolling="no" 
            allowFullScreen={true}
            title="Scratch Ninja Run"
            className="border rounded shadow-sm"
          ></iframe>
        </div>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg">How to Play</h3>
            <p className="text-sm text-gray-600 mt-1">
              Press the space bar to jump over obstacles and avoid hitting them.
              Try to get the highest score possible!
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Controls:</span>
              <span className="font-medium">Space Bar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Game Type:</span>
              <span className="font-medium">Scratch Game</span>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Created on Scratch by ChrisDuffey.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}