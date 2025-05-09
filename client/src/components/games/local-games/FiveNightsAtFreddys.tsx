import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Authentic FNAF assets from the original game
const freddy1 = "https://i.imgur.com/JWwmJJT.png"; // Freddy Fazbear
const bonnie = "https://i.imgur.com/Y8Vce6E.png"; // Bonnie
const chica = "https://i.imgur.com/lkOLyY0.png"; // Chica 
const foxy = "https://i.imgur.com/1THViSv.png"; // Foxy
const door = "https://i.imgur.com/19j1JQ9.png"; // Door
const officeBackground = "https://i.imgur.com/jvDJdVQ.png"; // Office background
const staticImage = "https://i.imgur.com/rA8AY7l.gif"; // Static effect
const cameraMap = "https://i.imgur.com/X4Qez5X.png"; // Camera map
// Jumpscare images
const freddyJumpscareImage = "https://i.imgur.com/vNfAS0P.png"; // Freddy jumpscare
const bonnieJumpscareImage = "https://i.imgur.com/83UaJfv.png"; // Bonnie jumpscare
const chicaJumpscareImage = "https://i.imgur.com/WfA5T7S.png"; // Chica jumpscare
const foxyJumpscareImage = "https://i.imgur.com/Qi7HTUJ.png"; // Foxy jumpscare
// Camera room images
const stage = "https://i.imgur.com/AQDENbl.png"; // Stage - 1A
const diningArea = "https://i.imgur.com/ZNYcn65.png"; // Dining Area - 1B
const pirateCove = "https://i.imgur.com/Zg1krn9.png"; // Pirate Cove - 1C
const westHall = "https://i.imgur.com/oTVIulJ.png"; // West Hall - 2A
const eastHall = "https://i.imgur.com/L11JEvF.png"; // East Hall - 4A
// Sound effects
const doorSound = "https://www.myinstants.com/media/sounds/fnaf-metal-door.mp3";
const cameraSound = "https://www.myinstants.com/media/sounds/camera-change-fnaf.mp3";
const jumpscareSound = "https://www.myinstants.com/media/sounds/fnaf-scream5.mp3";
const ambientSound = "https://www.myinstants.com/media/sounds/fnaf_background_music_low_power.mp3";

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
  
  // Render camera feed with authentic FNAF security camera styling
  const renderCameraView = () => {
    const animatronicsInRoom = Object.entries(animatronics)
      .filter(([_, data]) => data.room === currentCam)
      .map(([name]) => name);
    
    // Get camera background image based on current camera
    const getCameraBackground = () => {
      switch (currentCam) {
        case "1A": return stage;
        case "1B": return diningArea;
        case "1C": return pirateCove;
        case "2A": return westHall;
        case "4A": return eastHall;
        default: return null; // Use default dark room for other cameras
      }
    };
    
    // Play camera sound when switching to camera view
    useEffect(() => {
      if (camera) {
        playSound(cameraSound);
      }
    }, [camera, currentCam, playSound]);
    
    return (
      <div className="bg-black p-4 h-full fnaf-container">
        {/* Camera header with recording indicator */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse mr-2"></div>
            <div className="text-yellow-500 text-xs uppercase font-mono">REC</div>
          </div>
          <div className="text-yellow-500 text-sm font-bold">CAM {currentCam}</div>
          <div className="text-yellow-500 text-xs">POWER: {power}%</div>
        </div>
        
        {/* Camera feed screen with border and static effects */}
        <div className="camera-screen bg-gray-900 h-[350px] flex items-center justify-center relative border-4 border-gray-800 overflow-hidden">
          {/* Camera static and noise overlay */}
          <div className="absolute inset-0 opacity-30 pointer-events-none z-10" 
               style={{ 
                 background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
                 animation: 'camera-static 0.2s infinite' 
               }}>
          </div>
          
          {/* Scanline effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ 
                 background: 'linear-gradient(transparent 0%, rgba(255,255,255,0.2) 50%, transparent 51%, transparent 100%)',
                 backgroundSize: '100% 4px',
                 animation: 'camera-static 3s infinite' 
               }}>
          </div>
          
          {/* Room background - using authentic FNAF camera backgrounds */}
          <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
            <div 
              className="relative w-full h-full flex items-center justify-center"
              style={{
                backgroundImage: getCameraBackground() ? `url(${getCameraBackground()})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.3) contrast(1.2) grayscale(0.4)',
              }}
            >
              {/* Room identifier */}
              <div className="absolute top-2 left-2 text-white text-xs opacity-50">
                CAM {currentCam} - {
                  currentCam === "1A" ? "Stage" : 
                  currentCam === "1B" ? "Dining Area" : 
                  currentCam === "1C" ? "Pirate Cove" : 
                  currentCam === "2A" ? "West Hall" : 
                  currentCam === "2B" ? "W. Hall Corner" : 
                  currentCam === "3" ? "Supply Closet" : 
                  currentCam === "4A" ? "East Hall" : 
                  currentCam === "4B" ? "E. Hall Corner" : 
                  currentCam === "5" ? "Backstage" : 
                  currentCam === "6" ? "Kitchen" : 
                  currentCam === "7" ? "Restrooms" : "Unknown"
                }
              </div>
              
              {/* Render animatronics in the current room with glitch effects */}
              {animatronicsInRoom.map(name => (
                <div key={name} className="absolute" style={{
                  animation: 'power-flicker 3s infinite',
                  filter: 'brightness(0.4) contrast(1.5)',
                  transform: 'scale(0.9)',
                  zIndex: 5,
                }}>
                  <img 
                    src={
                      name === 'freddy' ? freddy1 : 
                      name === 'bonnie' ? bonnie : 
                      name === 'chica' ? chica : foxy
                    } 
                    alt={name.charAt(0).toUpperCase() + name.slice(1)} 
                    className="h-[300px] object-contain"
                  />
                </div>
              ))}
              
              {/* Empty room message if no animatronics */}
              {animatronicsInRoom.length === 0 && !getCameraBackground() && (
                <div className="text-gray-500 text-sm italic">
                  {currentCam === "6" ? "AUDIO ONLY" : "No activity detected"}
                </div>
              )}
            </div>
          </div>
          
          {/* Camera UI overlay */}
          <div className="absolute bottom-2 right-2 text-yellow-500 text-xs">
            NIGHT 1 - {hour}:00 AM
          </div>
        </div>
        
        {/* Camera selection panel with FNAF camera map */}
        <div className="mt-4 bg-gray-900 p-3 border-2 border-gray-800">
          <div className="text-yellow-500 text-xs uppercase mb-2 text-center">Camera Selection</div>
          
          {/* FNAF camera map UI */}
          <div className="relative mb-3">
            <img src={cameraMap} alt="Camera Map" className="w-full h-auto opacity-60 max-h-[120px] object-contain" />
            
            {/* Camera selection buttons positioned on the map */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {rooms.map(room => (
                <Button 
                  key={room}
                  variant="outline"
                  onClick={() => {
                    switchCamera(room);
                    playSound(cameraSound);
                  }}
                  className={`security-btn text-xs py-1 px-1 m-1 opacity-70 hover:opacity-100 ${currentCam === room ? 'active opacity-100' : ''}`}
                  style={{
                    fontSize: '0.65rem',
                  }}
                >
                  {room}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <Button 
              onClick={() => {
                toggleCamera();
                playSound(cameraSound);
              }}
              variant="outline" 
              className="security-btn uppercase text-sm w-full"
            >
              Back to Office
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render office view - the main gameplay screen
  const renderOfficeView = () => {
    return (
      <div className="relative h-full bg-gray-900 flex flex-col fnaf-container">
        {/* FNAF Office view with flickering effects */}
        <div className="flex-grow relative">
          <div className="office-background h-full w-full relative overflow-hidden">
            {/* Main office scene - a dark environment */}
            <div className="h-full w-full bg-gray-950 flex items-center justify-between">
              {/* Left side - door, light and warning */}
              <div className="w-1/3 flex flex-col justify-center items-center relative">
                {/* Door area */}
                <div className="h-[60%] w-full flex items-center justify-start relative">
                  <div 
                    className={`absolute left-0 top-0 h-full w-[12px] bg-gray-700 ${leftDoorClosed ? 'bg-red-900' : ''}`}
                    style={{ boxShadow: leftDoorClosed ? '0 0 15px rgba(255,0,0,0.5)' : 'none' }}
                  ></div>
                  
                  {leftDoorClosed && (
                    <div className="absolute left-[12px] top-0 bottom-0 w-[40px] bg-gray-800">
                      <img src={door} alt="Left Door" className="h-full object-cover" />
                    </div>
                  )}
                  
                  {/* Light effect when on */}
                  {leftLightOn && !leftDoorClosed && (
                    <div className="absolute left-[12px] top-0 bottom-0 w-[120px] bg-yellow-800 opacity-30"></div>
                  )}
                  
                  {/* Show danger warning with animatronic image */}
                  {(animatronics.bonnie.danger || animatronics.foxy.danger) && leftLightOn && !leftDoorClosed && (
                    <div className="absolute left-[40px] bottom-0 h-[80%]">
                      <img 
                        src={animatronics.bonnie.danger ? bonnie : foxy} 
                        alt={animatronics.bonnie.danger ? "Bonnie" : "Foxy"} 
                        className="h-full object-contain"
                        style={{ filter: 'brightness(0.4) contrast(1.3)' }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Left door controls */}
                <div className="mt-auto mb-4 space-y-2 p-2 border-2 border-gray-700 bg-gray-800 rounded">
                  <div className="text-center text-xs text-gray-400 mb-1">LEFT DOOR</div>
                  <Button 
                    onClick={() => toggleDoor("left")} 
                    className={`security-btn w-full ${leftDoorClosed ? 'active' : ''}`}
                    variant="outline"
                  >
                    {leftDoorClosed ? "DOOR: CLOSED" : "DOOR: OPEN"}
                  </Button>
                  <Button 
                    onClick={() => toggleLight("left")} 
                    className={`security-btn w-full ${leftLightOn ? 'active' : ''}`}
                    variant="outline"
                  >
                    {leftLightOn ? "LIGHT: ON" : "LIGHT: OFF"}
                  </Button>
                </div>
              </div>
              
              {/* Center view - main office and camera controls */}
              <div className="flex-grow flex flex-col items-center justify-between">
                {/* Main screen area */}
                <div className="flex-grow flex items-center justify-center relative w-full">
                  {power <= 20 && (
                    <div 
                      className="absolute inset-0 bg-black pointer-events-none z-10" 
                      style={{ 
                        opacity: 0.7 - (power / 100) * 0.7,
                        animation: 'power-flicker 2s infinite'
                      }}
                    ></div>
                  )}
                  
                  {/* Camera button positioned at the bottom */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button 
                      onClick={toggleCamera} 
                      variant="outline" 
                      className="security-btn px-8 py-4 text-lg uppercase"
                    >
                      Monitor Cameras
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right side - door, light and warning */}
              <div className="w-1/3 flex flex-col justify-center items-center relative">
                {/* Door area */}
                <div className="h-[60%] w-full flex items-center justify-end relative">
                  <div 
                    className={`absolute right-0 top-0 h-full w-[12px] bg-gray-700 ${rightDoorClosed ? 'bg-red-900' : ''}`}
                    style={{ boxShadow: rightDoorClosed ? '0 0 15px rgba(255,0,0,0.5)' : 'none' }}
                  ></div>
                  
                  {rightDoorClosed && (
                    <div className="absolute right-[12px] top-0 bottom-0 w-[40px] bg-gray-800">
                      <img src={door} alt="Right Door" className="h-full object-cover transform scale-x-[-1]" />
                    </div>
                  )}
                  
                  {/* Light effect when on */}
                  {rightLightOn && !rightDoorClosed && (
                    <div className="absolute right-[12px] top-0 bottom-0 w-[120px] bg-yellow-800 opacity-30"></div>
                  )}
                  
                  {/* Show danger warning with animatronic image */}
                  {(animatronics.chica.danger || animatronics.freddy.danger) && rightLightOn && !rightDoorClosed && (
                    <div className="absolute right-[40px] bottom-0 h-[80%]">
                      <img 
                        src={animatronics.chica.danger ? chica : freddy1} 
                        alt={animatronics.chica.danger ? "Chica" : "Freddy"} 
                        className="h-full object-contain"
                        style={{ filter: 'brightness(0.4) contrast(1.3)' }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Right door controls */}
                <div className="mt-auto mb-4 space-y-2 p-2 border-2 border-gray-700 bg-gray-800 rounded">
                  <div className="text-center text-xs text-gray-400 mb-1">RIGHT DOOR</div>
                  <Button 
                    onClick={() => toggleDoor("right")} 
                    className={`security-btn w-full ${rightDoorClosed ? 'active' : ''}`}
                    variant="outline"
                  >
                    {rightDoorClosed ? "DOOR: CLOSED" : "DOOR: OPEN"}
                  </Button>
                  <Button 
                    onClick={() => toggleLight("right")} 
                    className={`security-btn w-full ${rightLightOn ? 'active' : ''}`}
                    variant="outline"
                  >
                    {rightLightOn ? "LIGHT: ON" : "LIGHT: OFF"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Static overlay for authentic feel */}
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
                opacity: 0.05,
                mixBlendMode: 'overlay',
              }}>
            </div>
          </div>
        </div>
        
        {/* HUD - power and time in the authentic FNAF style */}
        <div className="bg-black p-3 text-white flex justify-between items-center border-t-4 border-gray-800">
          <div className="flex flex-col">
            <div className="text-xs text-yellow-500 mb-1">POWER LEFT: {power}%</div>
            <Progress value={power} max={100} className="w-36 h-3 bg-gray-800 rounded-none">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-green-500" 
                style={{ width: `${power}%` }}
              ></div>
            </Progress>
            
            <div className="flex mt-2 items-center">
              <div className="text-xs text-yellow-500 mr-2">USAGE:</div>
              {/* Power usage indicators in authentic green blocks */}
              <div className="flex">
                {Array.from({ length: Math.floor(powerDrain) }).map((_, i) => (
                  <div key={i} className="w-3 h-5 bg-green-600 mr-[2px]"></div>
                ))}
                {powerDrain % 1 !== 0 && (
                  <div className="w-3 h-5 bg-green-600 opacity-50"></div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-500">{hour} AM</div>
            <div className="text-sm text-gray-400">NIGHT 1</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Sound effect player for FNAF sounds
  const playSound = useCallback((sound: string) => {
    try {
      const audio = new Audio(sound);
      audio.volume = 0.5;
      audio.play().catch(err => console.error("Error playing sound:", err));
    } catch (err) {
      console.error("Error creating audio:", err);
    }
  }, []);
  
  // Track which animatronic caused game over
  const [killerAnimatronic, setKillerAnimatronic] = useState<string>("freddy");
  
  // Play jumpscare sound on game over
  useEffect(() => {
    if (gameOver) {
      // Find animatronic in the office if any
      const officeAnimatronics = Object.entries(animatronics)
        .filter(([_, data]) => data.room === "Office")
        .map(([name]) => name);
      
      // Default to Freddy if power ran out
      const killer = officeAnimatronics.length > 0 ? officeAnimatronics[0] : "freddy";
      setKillerAnimatronic(killer);
      
      // Play jumpscare sound
      playSound(jumpscareSound);
    }
  }, [gameOver, animatronics, playSound]);
  
  // Game over screen with authentic jumpscare
  const renderGameOver = () => {
    // Get the correct jumpscare image based on which animatronic caught the player
    const getJumpscareImage = () => {
      switch (killerAnimatronic) {
        case "freddy": return freddyJumpscareImage;
        case "bonnie": return bonnieJumpscareImage;
        case "chica": return chicaJumpscareImage;
        case "foxy": return foxyJumpscareImage;
        default: return freddyJumpscareImage;
      }
    };
    
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Full screen jumpscare image */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img 
              src={getJumpscareImage()} 
              alt={`${killerAnimatronic.charAt(0).toUpperCase() + killerAnimatronic.slice(1)} Jumpscare`} 
              className="max-h-full max-w-full object-contain"
              style={{ 
                animation: 'jumpScare 0.3s forwards',
              }}
            />
          </div>
          
          {/* Static overlay effect */}
          <div 
            className="absolute inset-0 pointer-events-none z-10" 
            style={{ 
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              opacity: 0.3,
              mixBlendMode: 'overlay',
            }}>
          </div>
          
          {/* Game over text with delayed appearance */}
          <div className="relative z-20 text-center mt-8">
            <h2 className="text-red-600 text-5xl mb-8 animate-pulse font-bold mt-16">GAME OVER</h2>
            <div className="mt-32">
              <Button onClick={restartGame} variant="destructive" size="lg" className="px-8 py-6 text-lg">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Victory screen
  const renderVictory = () => {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-yellow-400 text-5xl mb-4 font-pixel">6 AM</h2>
          <div className="border-t border-b border-yellow-400 py-4 my-6">
            <h1 className="text-green-400 text-6xl mb-6 animate-pulse font-bold">
              YOU SURVIVED!
            </h1>
            <p className="text-gray-300 text-xl mb-8">Night 1 Complete</p>
          </div>
          
          <div className="mt-8">
            <p className="text-gray-400 mb-6 text-lg">
              But they'll be more active tomorrow night...
            </p>
            <Button onClick={restartGame} variant="default" size="lg" className="px-8 py-4 text-lg bg-green-800 hover:bg-green-700">
              Continue to Night 2
            </Button>
          </div>
        </div>
        
        {/* Static overlay for authentic feel */}
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ 
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
            opacity: 0.1,
            mixBlendMode: 'overlay',
          }}>
        </div>
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
      
      {/* Add CSS for the camera static effect */}
      <style>
        {`
        @keyframes camera-static {
          0% { opacity: 0.1; }
          50% { opacity: 0.2; }
          100% { opacity: 0.1; }
        }
        
        @keyframes power-flicker {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          60% { opacity: 0.8; }
          70% { opacity: 0.6; }
          80% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        
        @keyframes jumpScare {
          0% { transform: scale(0.8); filter: brightness(0.3); }
          25% { transform: scale(0.9) rotate(-1deg); filter: brightness(0.5); }
          50% { transform: scale(1) rotate(1deg); filter: brightness(0.7); }
          75% { transform: scale(1.1) rotate(-1deg); filter: brightness(0.9); }
          100% { transform: scale(1.2); filter: brightness(1); }
        }
        
        .fnaf-container {
          font-family: 'Courier New', monospace;
          color: #b9b9b9;
        }
        
        .office-background {
          background-color: #0a0a0a;
          background-image: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(20,20,20,0.8) 100%);
        }
        
        .security-btn {
          border: 2px solid #444;
          background: #222;
          color: #ddd;
          transition: all 0.2s ease;
        }
        
        .security-btn:hover {
          background: #333;
          border-color: #555;
        }
        
        .security-btn.active {
          background: #553333;
          border-color: #664444;
        }
        `}
      </style>
    </div>
  );
}