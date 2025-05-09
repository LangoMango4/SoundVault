import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Original authentic FNAF assets directly from the game
// Animatronic character images
const freddy1 = "/fnaf_assets/freddy.png"; // Freddy Fazbear when stationary
const freddy2 = "/fnaf_assets/freddy_eyes.gif"; // Freddy with glowing eyes
const bonnie = "/fnaf_assets/bonnie.png"; // Bonnie
const bonnieAtDoor = "/fnaf_assets/bonnie_door.png"; // Bonnie at door
const chica = "/fnaf_assets/chica.png"; // Chica 
const chicaAtDoor = "/fnaf_assets/chica_door.png"; // Chica at door
const foxy = "/fnaf_assets/foxy.png"; // Foxy
const foxyPeeking = "/fnaf_assets/foxy_peeking.png"; // Foxy peeking out
const foxyRunning = "/fnaf_assets/foxy_running.gif"; // Foxy running down hall

// Environment assets
const door = "/fnaf_assets/door.png"; // Door
const officeBackground = "/fnaf_assets/office.jpg"; // FNAF office exact replica
const staticImage = "/fnaf_assets/static.gif"; // Static noise effect
const cameraMap = "/fnaf_assets/map.png"; // Original FNAF camera map
const mainMenuImage = "/fnaf_assets/menu.jpg"; // Title screen
const gameLogo = "/fnaf_assets/logo.png"; // FNAF logo

// Jumpscare animations - exact replicas from the original game
const freddyJumpscareImage = "/fnaf_assets/freddy_jumpscare.gif"; // Freddy jumpscare
const bonnieJumpscareImage = "/fnaf_assets/bonnie_jumpscare.gif"; // Bonnie jumpscare
const chicaJumpscareImage = "/fnaf_assets/chica_jumpscare.gif"; // Chica jumpscare
const foxyJumpscareImage = "/fnaf_assets/foxy_jumpscare.gif"; // Foxy jumpscare

// Camera room images - exact replicas of each room from the original game
const stage = "/fnaf_assets/cam1a.png"; // Stage - 1A
const stage_bonnie_missing = "/fnaf_assets/cam1a_bonnie_missing.png"; // Stage with Bonnie missing
const stage_chica_missing = "/fnaf_assets/cam1a_chica_missing.png"; // Stage with Chica missing
const stage_empty = "/fnaf_assets/cam1a_empty.png"; // Empty stage
const diningArea = "/fnaf_assets/cam1b.png"; // Dining Area - 1B
const diningArea_bonnie = "/fnaf_assets/cam1b_bonnie.png"; // Dining Area with Bonnie
const pirateCove1 = "/fnaf_assets/cam1c_stage1.png"; // Pirate Cove closed - 1C
const pirateCove2 = "/fnaf_assets/cam1c_stage2.png"; // Pirate Cove partially open
const pirateCove3 = "/fnaf_assets/cam1c_stage3.png"; // Pirate Cove open (Foxy gone)
const westHall = "/fnaf_assets/cam2a.png"; // West Hall - 2A
const westHall_bonnie = "/fnaf_assets/cam2a_bonnie.png"; // West Hall with Bonnie
const westHallCorner = "/fnaf_assets/cam2b.png"; // West Hall Corner - 2B
const eastHall = "/fnaf_assets/cam4a.png"; // East Hall - 4A
const eastHall_chica = "/fnaf_assets/cam4a_chica.png"; // East Hall with Chica
const eastHallCorner = "/fnaf_assets/cam4b.png"; // East Hall Corner - 4B
const supplycloset = "/fnaf_assets/cam3.png"; // Supply Closet - 3
const supplycloset_bonnie = "/fnaf_assets/cam3_bonnie.png"; // Supply Closet with Bonnie
const backstage = "/fnaf_assets/cam5.png"; // Backstage - 5
const backstage_bonnie = "/fnaf_assets/cam5_bonnie.png"; // Backstage with Bonnie
const kitchen = "/fnaf_assets/cam6.png"; // Kitchen (audio only) - 6
const bathrooms = "/fnaf_assets/cam7.png"; // Restrooms - 7
const bathrooms_chica = "/fnaf_assets/cam7_chica.png"; // Restrooms with Chica
const cameraBorder = "/fnaf_assets/camera_border.png"; // Camera feed border
const cameraButton = "/fnaf_assets/camera_button.png"; // Camera button

// Sound effects directly from the original FNAF game
const doorSound = "/fnaf_assets/door.mp3"; // Door sound
const lightSound = "/fnaf_assets/light.mp3"; // Light switch sound
const cameraSound = "/fnaf_assets/camera_toggle.mp3"; // Camera toggle sound
const jumpscareSound = "/fnaf_assets/jumpscare.mp3"; // Jumpscare sound
const ambientSound = "/fnaf_assets/ambient.mp3"; // Ambient background sound
const powerDownSound = "/fnaf_assets/powerdown.mp3"; // Power outage sound
const fanSound = "/fnaf_assets/fan.mp3"; // Office fan sound
const foxyRunningSound = "/fnaf_assets/foxy_running.mp3"; // Foxy running sound
const freddyLaughSound = "/fnaf_assets/freddy_laugh.mp3"; // Freddy's laugh
const phoneCallSound = "/fnaf_assets/phone_call.mp3"; // Phone guy call
const musicBoxSound = "/fnaf_assets/music_box.mp3"; // Freddy's music box during power outage
const victorySound = "/fnaf_assets/6am.mp3"; // 6 AM chime
const footstepSound = "/fnaf_assets/footstep.mp3"; // Animatronic footstep
const garbleSound = "/fnaf_assets/garble.mp3"; // Kitchen audio sound (pots & pans)

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
  const [killerAnimatronic, setKillerAnimatronic] = useState<string>("freddy");
  const [isInstructions, setIsInstructions] = useState(true); // Show instructions on first load
  const [keyboardControlsActive, setKeyboardControlsActive] = useState(false); // Track if keyboard controls are active
  const [mouseLookPosition, setMouseLookPosition] = useState({ x: 0, y: 0 }); // Track mouse position for office view
  const gameContainerRef = useRef<HTMLDivElement>(null); // Reference to game container for mouse controls
  const [animatronics, setAnimatronics] = useState({
    freddy: { room: "1A", active: false, danger: false },
    bonnie: { room: "1A", active: false, danger: false },
    chica: { room: "1A", active: false, danger: false },
    foxy: { room: "1C", active: false, danger: false }
  });
  
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
  
  // Keyboard controls for making the game more interactive
  useEffect(() => {
    if (gameOver || gameWon || isInstructions) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (camera) {
        // Camera mode keyboard controls
        switch(e.key.toLowerCase()) {
          case 'escape':
          case 'c':
            toggleCamera();
            playSound(cameraSound);
            break;
          case '1': 
            switchCamera("1A");
            playSound(cameraSound);
            break;
          case '2': 
            switchCamera("1B");
            playSound(cameraSound);
            break;
          case '3': 
            switchCamera("1C");
            playSound(cameraSound);
            break;
          case '4': 
            switchCamera("2A");
            playSound(cameraSound);
            break;
          case '5': 
            switchCamera("2B");
            playSound(cameraSound);
            break;
        }
      } else {
        // Office mode keyboard controls
        switch(e.key.toLowerCase()) {
          case 'q': // Left door toggle
            if (power > 0) {
              toggleDoor("left");
              playSound(doorSound);
            }
            break;
          case 'e': // Right door toggle
            if (power > 0) {
              toggleDoor("right");
              playSound(doorSound);
            }
            break;
          case 'a': // Left light on
            if (power > 0 && !leftLightOn) {
              setLeftLightOn(true);
              setRightLightOn(false);
            }
            break;
          case 'd': // Right light on
            if (power > 0 && !rightLightOn) {
              setRightLightOn(true);
              setLeftLightOn(false);
            }
            break;
          case 'c': // Toggle camera
            if (power > 0) {
              toggleCamera();
              playSound(cameraSound);
            }
            break;
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameOver || gameWon) return;
      
      // Turn off lights when key released
      switch(e.key.toLowerCase()) {
        case 'a': // Left light off
          setLeftLightOn(false);
          break;
        case 'd': // Right light off
          setRightLightOn(false);
          break;
      }
    };
    
    // Activate keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    setKeyboardControlsActive(true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      setKeyboardControlsActive(false);
    };
  }, [camera, power, gameOver, gameWon, isInstructions, playSound]);
  
  // Mouse-based camera movement in office view
  useEffect(() => {
    if (gameOver || gameWon || camera || isInstructions) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!gameContainerRef.current) return;
      
      const rect = gameContainerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Update mouse position
      setMouseLookPosition({ x, y });
    };
    
    // Add mouse move event listener
    if (gameContainerRef.current) {
      gameContainerRef.current.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (gameContainerRef.current) {
        gameContainerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [camera, gameOver, gameWon, isInstructions]);

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
  
  // Render camera feed with 100% authentic FNAF security camera styling
  const renderCameraView = () => {
    const animatronicsInRoom = Object.entries(animatronics)
      .filter(([_, data]) => data.room === currentCam)
      .map(([name]) => name);
    
    // Get camera background image based on current camera - using real FNAF rooms
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
    
    // Play camera sound when switching views or cameras - just like original FNAF
    useEffect(() => {
      playSound(cameraSound);
    }, [camera, currentCam, playSound]);
    
    // Special Foxy behavior - like in original FNAF
    const getFoxyState = () => {
      if (currentCam !== "1C") return null;
      
      if (animatronics.foxy.active) {
        // Foxy is peeking out
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="https://static.wikia.nocookie.net/freddy-fazbears-pizza/images/d/d5/QBJASc2.png" 
              alt="Foxy peeking" 
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.4) contrast(1.2)' }}
            />
          </div>
        );
      }
      
      // Default pirate cove - curtains closed
      return null;
    };
    
    return (
      <div className="bg-black p-4 h-full fnaf-container">
        {/* Authentic FNAF Camera UI */}
        <div className="flex justify-between items-center mb-3 bg-gray-900 border border-gray-800 p-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse mr-2"></div>
            <div className="text-yellow-500 text-xs uppercase font-pixel">REC</div>
          </div>
          <div className="text-yellow-500 text-sm font-bold">CAM {currentCam}</div>
          <div className="text-red-500 text-xs font-bold">NIGHT 1 - {hour} AM</div>
        </div>
        
        {/* Camera feed screen with authentic FNAF flip animation and static effects */}
        <div className="camera-feed bg-gray-900 h-[350px] relative border-4 border-gray-800 overflow-hidden">
          {/* Main camera view with FNAF-style effects */}
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
              {/* Room identifier - authentic FNAF style */}
              <div className="absolute top-2 left-2 text-white text-sm font-bold bg-black bg-opacity-50 px-2 py-1 z-10 border border-gray-800">
                {currentCam} - {
                  currentCam === "1A" ? "Show Stage" : 
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
              
              {/* Special Foxy handling */}
              {getFoxyState()}
              
              {/* Render animatronics with proper positions - just like original FNAF */}
              {animatronicsInRoom.map(name => (
                <div key={name} className="absolute" style={{
                  bottom: '20px',
                  left: name === "bonnie" ? '30%' : name === "chica" ? '70%' : '50%',
                  transform: 'translate(-50%, 0%)',
                }}>
                  <img 
                    src={
                      name === "freddy" ? freddy1 :
                      name === "bonnie" ? bonnie :
                      name === "chica" ? chica :
                      name === "foxy" ? foxy : freddy1
                    } 
                    alt={name} 
                    className="h-[200px] object-contain"
                    style={{ 
                      filter: 'brightness(0.6) grayscale(0.5)', 
                      animation: 'camera-static 1s infinite'
                    }}
                  />
                </div>
              ))}
              
              {/* Kitchen has audio only - just like in original FNAF */}
              {currentCam === "6" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
                  <div className="text-center">
                    <div className="text-red-500 text-2xl mb-2 font-mono animate-pulse">CAMERA DISABLED</div>
                    <div className="text-gray-400 text-lg">AUDIO ONLY</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Scan line effect - authentic CRT camera look */}
          <div className="scan-line"></div>
          
          {/* Static overlay - exactly like FNAF camera feeds */}
          <div className="static-overlay"></div>
          
          {/* Camera static and CRT effects */}
          <div className="absolute inset-0 opacity-30 pointer-events-none z-10" 
               style={{ 
                 background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
                 animation: 'camera-static 0.2s infinite' 
               }}>
          </div>
          
          {/* Scanline effect - matches original FNAF game */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ 
                 background: 'linear-gradient(transparent 0%, rgba(255,255,255,0.2) 50%, transparent 51%, transparent 100%)',
                 backgroundSize: '100% 4px',
                 animation: 'camera-static 3s infinite' 
               }}>
          </div>
        </div>
        
        {/* Camera map and controls - styled exactly like FNAF */}
        <div className="mt-4 flex">
          {/* Camera map from original FNAF */}
          <div className="flex-grow relative">
            <img 
              src={cameraMap} 
              alt="Camera Map" 
              className="w-full h-[180px] object-contain border-2 border-gray-800"
            />
            
            {/* Camera selection dots - positioned accurately like FNAF */}
            <div className="absolute inset-0">
              {rooms.map(room => (
                <button 
                  key={room}
                  onClick={() => switchCamera(room)}
                  className={`absolute w-5 h-5 rounded-full ${currentCam === room ? 'bg-yellow-500' : 'bg-red-600'} hover:bg-yellow-300 transition-colors`}
                  disabled={power <= 0}
                  style={{
                    top: room === "1A" ? '30%' : 
                         room === "1B" ? '30%' : 
                         room === "1C" ? '25%' : 
                         room === "2A" ? '50%' : 
                         room === "2B" ? '65%' : 
                         room === "3" ? '40%' : 
                         room === "4A" ? '50%' : 
                         room === "4B" ? '65%' : 
                         room === "5" ? '20%' : 
                         room === "6" ? '35%' : 
                         room === "7" ? '40%' : '50%',
                    left: room === "1A" ? '25%' : 
                         room === "1B" ? '50%' : 
                         room === "1C" ? '10%' : 
                         room === "2A" ? '25%' : 
                         room === "2B" ? '15%' : 
                         room === "3" ? '35%' : 
                         room === "4A" ? '75%' : 
                         room === "4B" ? '85%' : 
                         room === "5" ? '35%' : 
                         room === "6" ? '65%' : 
                         room === "7" ? '70%' : '50%',
                  }}
                >
                  <span className="absolute top-[-20px] left-[-5px] text-white text-xs font-bold">
                    {room}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Power status and close button */}
          <div className="w-48 ml-4 bg-gray-900 p-2 border-2 border-gray-800 flex flex-col">
            <div className="text-red-500 text-xs mb-2 font-bold">POWER</div>
            <div className="text-sm text-white mb-1">REMAINING: {power}%</div>
            <Progress value={power} className="h-2 mb-2" indicatorClassName={power <= 20 ? 'bg-red-500' : 'bg-green-500'} />
            
            <div className="flex mt-2 items-center">
              <div className="text-xs text-yellow-500 mr-2">USAGE:</div>
              {/* Power usage indicators - authentic FNAF style */}
              <div className="flex">
                {Array.from({ length: Math.floor(powerDrain) }).map((_, i) => (
                  <div key={i} className="w-3 h-5 bg-green-600 mr-[2px]"></div>
                ))}
                {powerDrain % 1 !== 0 && (
                  <div className="w-3 h-5 bg-green-600 opacity-50"></div>
                )}
              </div>
            </div>
            
            <div className="mt-auto pt-4 flex">
              <Button 
                onClick={() => {
                  toggleCamera();
                  playSound(cameraSound);
                }} 
                className="security-btn flex-grow text-sm"
                variant="destructive"
                style={{
                  animation: 'monitor-click 0.1s',
                }}
              >
                CLOSE CAMERAS
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render office view - the main gameplay screen
  
  // Play door sound when toggling doors
  useEffect(() => {
    if (leftDoorClosed || rightDoorClosed) {
      playSound(doorSound);
    }
  }, [leftDoorClosed, rightDoorClosed, playSound]);
  
  // Play ambient sound for FNAF atmosphere
  useEffect(() => {
    let ambientAudio: HTMLAudioElement | null = null;
    
    if (power > 0 && !gameOver && !gameWon) {
      ambientAudio = new Audio(ambientSound);
      ambientAudio.volume = 0.2;
      ambientAudio.loop = true;
      ambientAudio.play().catch(err => console.error("Error playing ambient sound:", err));
    }
    
    return () => {
      if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
      }
    };
  }, [power <= 0, gameOver, gameWon]);
  
  // Adding fan sound - authentic FNAF office ambience
  useEffect(() => {
    const fanAudio = new Audio(fanSound);
    fanAudio.volume = 0.2;
    fanAudio.loop = true;
    
    if (power > 0 && !gameOver && !gameWon) {
      fanAudio.play().catch(err => console.error("Error playing fan sound:", err));
    }
    
    return () => {
      fanAudio.pause();
      fanAudio.currentTime = 0;
    };
  }, [gameOver, gameWon]);

  // Play power down sound when power reaches 0
  useEffect(() => {
    if (power <= 0) {
      playSound(powerDownSound);
    }
  }, [power <= 0]);

  // Play Foxy running sound when Foxy is moving to office
  useEffect(() => {
    if (animatronics.foxy.room === "2A") {
      playSound(foxyRunningSound);
    }
  }, [animatronics.foxy.room]);

  const renderOfficeView = () => {
    return (
      <div className="relative h-full flex flex-col fnaf-container">
        {/* FNAF Office view with authentic styling and effects */}
        <div className="flex-grow relative">
          <div className="h-full w-full relative overflow-hidden">
            {/* Main office scene with authentic FNAF office background */}
            <div 
              className="h-full w-full flex items-center justify-between"
              style={{
                backgroundImage: `url(${officeBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: power <= 20 ? 'brightness(0.4)' : 'brightness(0.6)',
              }}>
              
              {/* Fan animation - iconic FNAF office element */}
              <div className="absolute top-[25%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-16 h-16">
                <div className="w-full h-full rounded-full border-4 border-gray-700 animate-spin" 
                     style={{animationDuration: '3s', opacity: 0.7}}>
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400"></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-400" 
                       style={{transform: 'translateX(-50%) rotate(45deg)'}}></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-400" 
                       style={{transform: 'translateX(-50%) rotate(-45deg)'}}></div>
                </div>
              </div>
              
              {/* Poster - just like in the original FNAF */}
              <div className="absolute top-[10%] right-[40%] w-24 h-32 bg-yellow-100 p-1">
                <div className="text-center text-xs text-gray-800 font-bold">CELEBRATE!</div>
                <div className="flex justify-center items-center h-[80%]">
                  <div className="w-4 h-20 bg-purple-900 mx-1"></div>
                  <div className="w-4 h-20 bg-brown-700 mx-1"></div>
                  <div className="w-4 h-20 bg-yellow-900 mx-1"></div>
                </div>
              </div>
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
                      onClick={() => {
                        toggleCamera();
                        playSound(cameraSound);
                      }} 
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
  
  // Game over screen with 100% authentic FNAF jumpscare
  const renderGameOver = () => {
    // Get the correct jumpscare animation based on which animatronic caught the player
    const getJumpscareImage = () => {
      switch (killerAnimatronic) {
        case "freddy": return freddyJumpscareImage;
        case "bonnie": return bonnieJumpscareImage;
        case "chica": return chicaJumpscareImage;
        case "foxy": return foxyJumpscareImage;
        default: return freddyJumpscareImage;
      }
    };
    
    // Freddy's power outage sequence
    if (power <= 0 && killerAnimatronic === "freddy") {
      return (
        <div className="h-full bg-black flex flex-col items-center justify-center">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Flickering Freddy eyes & nose - just like in the original game */}
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex">
                <div className="w-6 h-6 rounded-full bg-blue-300 mx-6 animate-ping" 
                     style={{animationDuration: '0.7s', animationIterationCount: 6}}></div>
                <div className="w-6 h-6 rounded-full bg-blue-300 mx-6 animate-ping" 
                     style={{animationDuration: '0.7s', animationIterationCount: 6}}></div>
              </div>
              <div className="mt-8 w-4 h-4 rounded-full bg-red-500 mx-auto animate-ping"
                   style={{animationDuration: '0.7s', animationIterationCount: 6}}></div>
            </div>
            
            {/* Freddy's music box - authentic power outage sequence */}
            <audio 
              src="https://static.wikia.nocookie.net/freddy-fazbears-pizza/images/f/f8/Music_box.ogg"
              autoPlay 
              loop={false}
            />
            
            {/* Full screen jumpscare image with delay (exactly like original FNAF) */}
            <div className="absolute inset-0 flex items-center justify-center bg-black opacity-0" 
                 style={{animation: 'freddy-delay 6s forwards'}}>
              <img 
                src={getJumpscareImage()} 
                alt={`Freddy Jumpscare`} 
                className="max-h-full max-w-full object-contain"
                style={{animation: 'freddyAttack 0.5s ease-in-out'}}
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
            <div className="relative z-20 text-center mt-8 opacity-0" style={{animation: 'fade-in 8s forwards'}}>
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
    }
    
    // Regular jumpscare for other animatronics
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Full screen jumpscare GIF - exactly like in the original game */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img 
              src={getJumpscareImage()} 
              alt={`${killerAnimatronic.charAt(0).toUpperCase() + killerAnimatronic.slice(1)} Jumpscare`} 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          
          {/* CRT scanlines - authentic FNAF effect */}
          <div 
            className="absolute inset-0 pointer-events-none z-5" 
            style={{ 
              background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.1) 50%, transparent 51%, transparent 100%)',
              backgroundSize: '100% 3px',
              opacity: 0.2
            }}>
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
          <div className="relative z-20 text-center mt-8 opacity-0" style={{animation: 'fade-in 2s 1s forwards'}}>
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
  
  // Render game instructions for first-time players
  const renderInstructions = () => {
    return (
      <div className="h-full bg-black text-white flex flex-col items-center justify-center p-8 rounded-lg">
        <h2 className="text-4xl text-red-600 mb-6 font-bold">Five Nights at Freddy's</h2>
        
        <div className="max-w-2xl bg-gray-900 p-6 rounded-lg border-2 border-gray-800 mb-6">
          <h3 className="text-2xl mb-4 text-yellow-400">How to Play</h3>
          
          <div className="mb-4">
            <h4 className="text-xl text-red-400 mb-2">Survive until 6 AM</h4>
            <p className="mb-3">You are a night security guard at Freddy Fazbear's Pizza. The animatronic characters move at night and will try to reach your office.</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-xl text-red-400 mb-2">Keyboard Controls</h4>
            <ul className="grid grid-cols-2 gap-2">
              <li><span className="bg-red-900 px-2 py-1 rounded mr-2">Q</span> Toggle left door</li>
              <li><span className="bg-red-900 px-2 py-1 rounded mr-2">E</span> Toggle right door</li>
              <li><span className="bg-red-900 px-2 py-1 rounded mr-2">A</span> Left light (hold)</li>
              <li><span className="bg-red-900 px-2 py-1 rounded mr-2">D</span> Right light (hold)</li>
              <li><span className="bg-red-900 px-2 py-1 rounded mr-2">C</span> Toggle camera view</li>
              <li><span className="bg-red-900 px-2 py-1 rounded mr-2">1-5</span> Switch cameras</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="text-xl text-red-400 mb-2">Manage Your Power</h4>
            <p>Your office has limited power. Doors, lights, and cameras all drain power. If your power runs out, Freddy will come for you!</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-xl text-red-400 mb-2">Use Doors Wisely</h4>
            <p>Use the door lights to check if animatronics are outside, then close the doors to keep them out. Don't keep doors closed unnecessarily!</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setIsInstructions(false)} 
          className="px-8 py-6 text-lg bg-red-800 hover:bg-red-700 text-white font-bold"
        >
          START NIGHT 1
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
          
          {/* Control instructions */}
          <div className="mt-2 text-sm text-gray-600">
            <p>Keyboard controls: <strong>Q/E</strong> - Doors, <strong>A/D</strong> - Lights, <strong>C</strong> - Camera, <strong>1-5</strong> - Switch cameras</p>
          </div>
        </CardContent>
      </Card>
      
      <div 
        ref={gameContainerRef}
        className="flex-grow bg-black rounded-lg overflow-hidden relative"
      >
        {isInstructions ? (
          renderInstructions()
        ) : gameOver ? (
          renderGameOver()
        ) : gameWon ? (
          renderVictory()
        ) : camera ? (
          renderCameraView()
        ) : (
          renderOfficeView()
        )}
        
        {/* Full keyboard controls overlay that appears when game is active */}
        {!isInstructions && !gameOver && !gameWon && (
          <div className="absolute top-4 right-4 z-30 bg-black bg-opacity-70 p-2 rounded-lg border border-gray-700 text-white text-xs">
            <div className="mb-1 font-bold">CONTROLS:</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div><span className="bg-red-900 px-1 rounded mr-1">Q</span> Left Door</div>
              <div><span className="bg-red-900 px-1 rounded mr-1">E</span> Right Door</div>
              <div><span className="bg-red-900 px-1 rounded mr-1">A</span> Left Light</div>
              <div><span className="bg-red-900 px-1 rounded mr-1">D</span> Right Light</div>
              <div><span className="bg-red-900 px-1 rounded mr-1">C</span> Camera</div>
              <div><span className="bg-red-900 px-1 rounded mr-1">1-5</span> Cams</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add CSS for authentic FNAF animations and effects */}
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
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes freddyAttack {
          0% { transform: scale(0) rotate(0deg); filter: brightness(0.3); }
          20% { transform: scale(0.5) rotate(-3deg); filter: brightness(0.5); }
          40% { transform: scale(0.8) rotate(3deg); filter: brightness(0.7); }
          60% { transform: scale(1.0) rotate(-2deg); filter: brightness(0.8); }
          80% { transform: scale(1.1) rotate(1deg); filter: brightness(0.9); }
          100% { transform: scale(1.2) rotate(0deg); filter: brightness(1); }
        }
        
        @keyframes freddy-delay {
          0% { opacity: 0; }
          90% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes camera-flip {
          0% { transform: rotateX(0deg); opacity: 1; }
          15% { transform: rotateX(90deg); opacity: 0; }
          85% { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        
        @keyframes camera-noise {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes monitor-click {
          0% { transform: scale(1); }
          50% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        
        .fnaf-container {
          font-family: 'VT323', 'Courier New', monospace;
          color: #b9b9b9;
          text-shadow: 0 0 2px rgba(0,255,0,0.7);
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
          text-shadow: 0 0 3px rgba(200,200,200,0.5);
        }
        
        .security-btn:hover {
          background: #333;
          border-color: #555;
        }
        
        .security-btn.active {
          background: #553333;
          border-color: #664444;
        }
        
        .camera-feed {
          position: relative;
          transform-style: preserve-3d;
          perspective: 1000px;
          animation: camera-flip 0.5s ease-in-out;
          box-shadow: 0 0 20px rgba(0,0,0,0.9) inset;
        }
        
        .camera-btn {
          background: #131313;
          border: 1px solid #444;
          color: #eee;
          padding: 2px 4px;
          font-size: 0.7rem;
          transition: all 0.1s ease;
        }
        
        .camera-btn:hover {
          background: #333;
        }
        
        .camera-btn.active {
          background: #553322;
          border-color: #aa5522;
          color: #ffcc00;
        }
        
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255,255,255,0.1);
          z-index: 20;
          animation: scan-line 3s infinite linear;
        }
        
        .static-overlay {
          position: absolute;
          inset: 0;
          background-image: url(${staticImage});
          background-size: 200px;
          opacity: 0.1;
          mix-blend-mode: overlay;
          pointer-events: none;
          animation: camera-noise 0.5s infinite linear;
        }
        `}
      </style>
    </div>
  );
}