import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import freddy1 from "@assets/image_1746600099301.png";
import bonnie from "@assets/image_1746602271306.png";
import chica from "@assets/image_1746608432045.png";
import foxy from "@assets/image_1746608559028.png";
import door from "@assets/image_1746608655462.png";

export function FiveNightsAtFreddys() {
  const [power, setPower] = useState(100);
  const [hour, setHour] = useState(0);
  const [leftDoorClosed, setLeftDoorClosed] = useState(false);
  const [rightDoorClosed, setRightDoorClosed] = useState(false);
  const [leftLightOn, setLeftLightOn] = useState(false);
  const [rightLightOn, setRightLightOn] = useState(false);
  const [camera, setCamera] = useState(false);
  const [currentCam, setCurrentCam] = useState("1A");
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [powerDrain, setPowerDrain] = useState(1);
  const [animatronics, setAnimatronics] = useState({
    freddy: { room: "1A", active: false, danger: false },
    bonnie: { room: "1A", active: false, danger: false },
    chica: { room: "1A", active: false, danger: false },
    foxy: { room: "1C", active: false, danger: false }
  });
  
  const gameLoopRef = useRef<number | null>(null);
  const powerIntervalRef = useRef<number | null>(null);
  const hourIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  // Room mappings for game logic
  const rooms = [
    "1A", "1B", "1C", "2A", "2B", "3", "4A", "4B", "5", "6", "7"
  ];
  
  // Animatronic paths
  const paths = {
    freddy: ["1A", "1B", "7", "6", "4A", "2A", "Office"],
    bonnie: ["1A", "1B", "5", "2A", "3", "Office"],
    chica: ["1A", "1B", "7", "6", "4A", "4B", "Office"],
    foxy: ["1C", "2A", "Office"]
  };
  
  useEffect(() => {
    // Start time progression - each hour is 45 seconds in real time
    hourIntervalRef.current = window.setInterval(() => {
      setHour(prev => {
        const newHour = prev + 1;
        if (newHour >= 6) {
          // Player won!
          clearAllIntervals();
          setGameWon(true);
          toast({
            title: "You survived the night!",
            description: "You made it to 6 AM. Congratulations!",
            variant: "default",
          });
        }
        return newHour;
      });
    }, 45000); // 45 seconds per in-game hour
    
    // Power decreases over time based on usage
    powerIntervalRef.current = window.setInterval(() => {
      setPower(prev => {
        const newPower = Math.max(0, prev - powerDrain);
        if (newPower <= 0) {
          // Power outage, game over
          clearAllIntervals();
          setLeftDoorClosed(false);
          setRightDoorClosed(false);
          setLeftLightOn(false);
          setRightLightOn(false);
          setCamera(false);
          
          // Give a short delay before game over to create tension
          setTimeout(() => {
            setGameOver(true);
            toast({
              title: "Power out!",
              description: "The power has run out. You're in danger...",
              variant: "destructive",
            });
          }, 3000);
        }
        return newPower;
      });
    }, 1000); // Power decreases every second
    
    // Start the main game loop for animatronic movement
    gameLoopRef.current = window.setInterval(() => {
      moveAnimatronics();
    }, 5000); // Check for animatronic movement every 5 seconds
    
    // Cleanup on unmount
    return () => {
      clearAllIntervals();
    };
  }, []);
  
  // Calculate power drain based on what's active
  useEffect(() => {
    let drain = 1; // Base drain
    if (leftDoorClosed) drain += 1;
    if (rightDoorClosed) drain += 1;
    if (leftLightOn) drain += 0.5;
    if (rightLightOn) drain += 0.5;
    if (camera) drain += 1;
    
    setPowerDrain(drain);
  }, [leftDoorClosed, rightDoorClosed, leftLightOn, rightLightOn, camera]);
  
  const clearAllIntervals = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
    if (hourIntervalRef.current) {
      clearInterval(hourIntervalRef.current);
      hourIntervalRef.current = null;
    }
  };
  
  const moveAnimatronics = () => {
    setAnimatronics(prev => {
      const newState = { ...prev };
      
      // Increase activity based on the hour (gets more difficult as the night progresses)
      const hourDifficulty = hour + 1;
      
      // For each animatronic, roll for movement
      Object.keys(newState).forEach(character => {
        const animatronic = newState[character as keyof typeof newState];
        
        // Chance to activate increases with hour
        if (!animatronic.active) {
          const activationChance = hourDifficulty * 5 + 10; // 15% at hour 1, 35% at hour 5
          if (Math.random() * 100 < activationChance) {
            animatronic.active = true;
          }
        } 
        // If active, chance to move to next room
        else if (character !== "foxy" || !checkDoor("left")) { // Foxy is blocked by left door
          const currentIndex = paths[character as keyof typeof paths].indexOf(animatronic.room);
          
          // Don't move if already at office
          if (animatronic.room === "Office") {
            if (!checkDoor(character === "bonnie" ? "left" : "right")) {
              // Game over if door isn't closed
              clearAllIntervals();
              setGameOver(true);
              toast({
                title: "Game Over!",
                description: `${character.charAt(0).toUpperCase() + character.slice(1)} got you!`,
                variant: "destructive",
              });
            }
          } 
          // Otherwise, chance to move closer
          else {
            const moveChance = hourDifficulty * 5 + 15; // 20% at hour 1, 40% at hour 5
            if (Math.random() * 100 < moveChance) {
              const nextRoom = paths[character as keyof typeof paths][currentIndex + 1];
              animatronic.room = nextRoom;
              
              // If moved to a room adjacent to office, mark as danger
              if (nextRoom === paths[character as keyof typeof paths][paths[character as keyof typeof paths].length - 2]) {
                animatronic.danger = true;
              }
            }
          }
        }
      });
      
      return newState;
    });
  };
  
  const toggleDoor = (side: "left" | "right") => {
    if (power <= 0) return; // Can't use doors without power
    
    if (side === "left") {
      setLeftDoorClosed(prev => !prev);
      setLeftLightOn(false); // Turn off light when toggling door
    } else {
      setRightDoorClosed(prev => !prev);
      setRightLightOn(false); // Turn off light when toggling door
    }
  };
  
  const toggleLight = (side: "left" | "right") => {
    if (power <= 0) return; // Can't use lights without power
    
    if (side === "left") {
      setLeftLightOn(prev => !prev);
    } else {
      setRightLightOn(prev => !prev);
    }
  };
  
  const toggleCamera = () => {
    if (power <= 0) return; // Can't use camera without power
    
    setCamera(prev => !prev);
    setLeftLightOn(false);
    setRightLightOn(false);
  };
  
  const switchCamera = (cam: string) => {
    if (power <= 0) return; // Can't switch cameras without power
    
    setCurrentCam(cam);
  };
  
  const checkDoor = (side: "left" | "right") => {
    return side === "left" ? leftDoorClosed : rightDoorClosed;
  };
  
  const restartGame = () => {
    // Reset all game state
    setPower(100);
    setHour(0);
    setLeftDoorClosed(false);
    setRightDoorClosed(false);
    setLeftLightOn(false);
    setRightLightOn(false);
    setCamera(false);
    setCurrentCam("1A");
    setGameOver(false);
    setGameWon(false);
    setAnimatronics({
      freddy: { room: "1A", active: false, danger: false },
      bonnie: { room: "1A", active: false, danger: false },
      chica: { room: "1A", active: false, danger: false },
      foxy: { room: "1C", active: false, danger: false }
    });
    
    // Restart the game intervals
    hourIntervalRef.current = window.setInterval(() => {
      setHour(prev => {
        const newHour = prev + 1;
        if (newHour >= 6) {
          // Player won!
          clearAllIntervals();
          setGameWon(true);
          toast({
            title: "You survived the night!",
            description: "You made it to 6 AM. Congratulations!",
            variant: "default",
          });
        }
        return newHour;
      });
    }, 45000);
    
    powerIntervalRef.current = window.setInterval(() => {
      setPower(prev => {
        const newPower = Math.max(0, prev - powerDrain);
        if (newPower <= 0) {
          // Power outage, game over
          clearAllIntervals();
          setLeftDoorClosed(false);
          setRightDoorClosed(false);
          setLeftLightOn(false);
          setRightLightOn(false);
          setCamera(false);
          
          // Give a short delay before game over to create tension
          setTimeout(() => {
            setGameOver(true);
            toast({
              title: "Power out!",
              description: "The power has run out. You're in danger...",
              variant: "destructive",
            });
          }, 3000);
        }
        return newPower;
      });
    }, 1000);
    
    gameLoopRef.current = window.setInterval(() => {
      moveAnimatronics();
    }, 5000);
    
    toast({
      title: "New game started",
      description: "Watch the power level and survive until 6 AM!",
      variant: "default",
    });
  };
  
  // Render camera feed
  const renderCameraView = () => {
    const animatronicsInRoom = Object.entries(animatronics)
      .filter(([_, data]) => data.room === currentCam)
      .map(([name]) => name);
    
    return (
      <div className="bg-black p-4 h-full">
        <div className="flex justify-between mb-4">
          <div className="text-green-500 text-sm">CAM {currentCam}</div>
          <div className="text-green-500 text-sm">POWER: {power}%</div>
        </div>
        
        <div className="camera-screen bg-gray-900 h-[350px] flex items-center justify-center relative border-2 border-gray-700">
          {/* Camera static effect */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
                 animation: 'camera-static 0.5s infinite' 
               }}>
          </div>
          
          {/* Render animatronics in the current room */}
          {animatronicsInRoom.includes('freddy') && (
            <img 
              src={freddy1} 
              alt="Freddy" 
              className="h-4/5 absolute" 
              style={{ filter: 'brightness(0.7) contrast(1.2)' }}
            />
          )}
          
          {animatronicsInRoom.includes('bonnie') && (
            <img 
              src={bonnie} 
              alt="Bonnie" 
              className="h-4/5 absolute" 
              style={{ filter: 'brightness(0.7) contrast(1.2)' }}
            />
          )}
          
          {animatronicsInRoom.includes('chica') && (
            <img 
              src={chica} 
              alt="Chica" 
              className="h-4/5 absolute" 
              style={{ filter: 'brightness(0.7) contrast(1.2)' }}
            />
          )}
          
          {animatronicsInRoom.includes('foxy') && (
            <img 
              src={foxy} 
              alt="Foxy" 
              className="h-4/5 absolute" 
              style={{ filter: 'brightness(0.7) contrast(1.2)' }}
            />
          )}
          
          {/* Empty room message if no animatronics */}
          {animatronicsInRoom.length === 0 && (
            <div className="text-gray-400 text-lg">No activity detected</div>
          )}
        </div>
        
        {/* Camera controls */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {rooms.map(room => (
            <Button 
              key={room}
              variant={currentCam === room ? "default" : "outline"}
              onClick={() => switchCamera(room)}
              className="text-xs"
            >
              CAM {room}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  // Render office view
  const renderOfficeView = () => {
    return (
      <div className="relative h-full bg-gray-800 flex flex-col">
        {/* Office view */}
        <div className="flex-grow relative flex justify-center">
          <div className="office-background flex items-center justify-center h-full w-full">
            {/* Office scene - doors on left and right */}
            <div className="relative w-full h-full flex justify-between">
              {/* Left door and controls */}
              <div className="door-left flex flex-col justify-center items-center p-2">
                <div className="relative">
                  {leftDoorClosed && (
                    <img src={door} alt="Left Door" className="h-[300px] object-contain" />
                  )}
                  
                  {/* Show danger warning */}
                  {(animatronics.bonnie.danger || animatronics.foxy.danger) && leftLightOn && !leftDoorClosed && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-600 text-2xl font-bold animate-pulse">
                      DANGER!
                    </div>
                  )}
                </div>
                
                <div className="door-controls mt-2 space-y-2">
                  <Button onClick={() => toggleDoor("left")} variant={leftDoorClosed ? "destructive" : "outline"}>
                    {leftDoorClosed ? "Open Door" : "Close Door"}
                  </Button>
                  <Button onClick={() => toggleLight("left")} variant={leftLightOn ? "default" : "outline"}>
                    {leftLightOn ? "Light On" : "Light Off"}
                  </Button>
                </div>
              </div>
              
              {/* Center content */}
              <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                <h3 className="text-white text-xl mb-2">Office</h3>
                <p className="text-gray-400 mb-4">Watch your power!</p>
                <Button onClick={toggleCamera} variant={camera ? "destructive" : "default"}>
                  {camera ? "Close Cameras" : "Check Cameras"}
                </Button>
              </div>
              
              {/* Right door and controls */}
              <div className="door-right flex flex-col justify-center items-center p-2">
                <div className="relative">
                  {rightDoorClosed && (
                    <img src={door} alt="Right Door" className="h-[300px] object-contain transform scale-x-[-1]" />
                  )}
                  
                  {/* Show danger warning */}
                  {(animatronics.chica.danger || animatronics.freddy.danger) && rightLightOn && !rightDoorClosed && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-600 text-2xl font-bold animate-pulse">
                      DANGER!
                    </div>
                  )}
                </div>
                
                <div className="door-controls mt-2 space-y-2">
                  <Button onClick={() => toggleDoor("right")} variant={rightDoorClosed ? "destructive" : "outline"}>
                    {rightDoorClosed ? "Open Door" : "Close Door"}
                  </Button>
                  <Button onClick={() => toggleLight("right")} variant={rightLightOn ? "default" : "outline"}>
                    {rightLightOn ? "Light On" : "Light Off"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status bar */}
        <div className="p-4 bg-black text-white grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm mb-1">Power Left: {power}%</div>
            <Progress value={power} className="h-2" />
          </div>
          <div className="text-center">
            <div className="text-sm">Usage: {powerDrain}x</div>
            <div className="flex justify-center space-x-1 mt-1">
              {[...Array(Math.floor(powerDrain))].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-green-500"></div>
              ))}
              {powerDrain % 1 !== 0 && (
                <div className="w-3 h-3 bg-green-500 opacity-50"></div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{hour} AM</div>
            <div className="text-sm">Night 1</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Game over screen
  const renderGameOver = () => {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center">
        <h2 className="text-red-600 text-4xl mb-8 animate-pulse">GAME OVER</h2>
        <img 
          src={freddy1} 
          alt="Freddy Jumpscare" 
          className="h-64 mb-8 animate-bounce"
        />
        <Button onClick={restartGame} variant="default" size="lg">
          Try Again
        </Button>
      </div>
    );
  };
  
  // Victory screen
  const renderVictory = () => {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center">
        <h2 className="text-green-500 text-4xl mb-8">YOU SURVIVED!</h2>
        <div className="text-white text-xl mb-8">6 AM - Night Complete</div>
        <Button onClick={restartGame} variant="default" size="lg">
          Play Again
        </Button>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-2xl font-bold mb-2">Five Nights at Freddy's</h2>
          <p className="text-gray-700">
            Survive five nights as a security guard. Monitor the security cameras and conserve power 
            while watching for animatronic characters that move at night. Close the doors to stay safe,
            but watch your power usage!
          </p>
        </CardContent>
      </Card>
      
      <div className="flex-grow bg-black rounded-lg overflow-hidden">
        {gameOver ? (
          renderGameOver()
        ) : gameWon ? (
          renderVictory()
        ) : camera ? (
          renderCameraView()
        ) : (
          renderOfficeView()
        )}
      </div>
      
      {/* Add some global CSS for the camera static effect */}
      <style jsx global>{`
        @keyframes camera-static {
          0% { opacity: 0.1; }
          50% { opacity: 0.2; }
          100% { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}