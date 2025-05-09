import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// CSS Import for authentic FNAF styling
import "@/assets/fnaf/main.css";

export function RealFiveNightsAtFreddys() {
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [power, setPower] = useState(100);
  const [hour, setHour] = useState(0);
  const [night, setNight] = useState(1);
  const [leftDoorClosed, setLeftDoorClosed] = useState(false);
  const [rightDoorClosed, setRightDoorClosed] = useState(false);
  const [leftLightOn, setLeftLightOn] = useState(false);
  const [rightLightOn, setRightLightOn] = useState(false);
  const [cameraView, setCameraView] = useState(false);
  const [currentCamera, setCurrentCamera] = useState("1A");
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [powerDrain, setPowerDrain] = useState(1);
  const [powerOutage, setPowerOutage] = useState(false);
  const [jumpscareAnimatronic, setJumpscareAnimatronic] = useState<string | null>(null);
  const [phoneCallPlaying, setPhoneCallPlaying] = useState(false);
  const [showControlInfo, setShowControlInfo] = useState(true);
  
  // Define animatronic type interfaces
  interface BaseAnimatronic {
    location: string;
    level: number; 
    moving: boolean;
    atDoor: boolean;
    path: string[];
    stage?: number; // Optional for base animatronics, required for Foxy
    running?: boolean; // Optional for base animatronics, required for Foxy
  }
  
  interface FoxyAnimatronic extends BaseAnimatronic {
    stage: number; // 0 = curtain closed, 1 = peeking, 2 = stepping out, 3 = gone
    running: boolean;
  }
  
  interface Animatronics {
    freddy: BaseAnimatronic;
    bonnie: BaseAnimatronic;
    chica: BaseAnimatronic;
    foxy: FoxyAnimatronic;
  }

  // Animatronic states - exactly like FNAF
  const [animatronics, setAnimatronics] = useState<Animatronics>({
    freddy: { 
      location: "1A", // Show Stage
      level: night, 
      moving: false,
      atDoor: false,
      path: ["1A", "1B", "7", "6", "4A", "4B", "Office"]
    },
    bonnie: { 
      location: "1A", // Show Stage
      level: night + 1, 
      moving: false,
      atDoor: false,
      path: ["1A", "1B", "5", "3", "2A", "2B", "Office"]
    },
    chica: { 
      location: "1A", // Show Stage
      level: night + 2, 
      moving: false,
      atDoor: false,
      path: ["1A", "1B", "7", "6", "4A", "4B", "Office"] 
    },
    foxy: { 
      location: "1C", // Pirate Cove
      level: 0, 
      moving: false,
      atDoor: false,
      stage: 0, // 0 = curtain closed, 1 = peeking, 2 = stepping out, 3 = gone
      running: false,
      path: ["1C", "2A", "Office"]
    }
  });
  
  // Game loop references
  const powerIntervalRef = useRef<number | null>(null);
  const hourIntervalRef = useRef<number | null>(null);
  const animatronicLoopRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Audio player function - authentic FNAF sounds
  const playSound = useCallback((sound: string, loop: boolean = false, volume: number = 0.5) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(sound);
      audio.volume = volume;
      audio.loop = loop;
      audio.play().catch(err => console.error("Error playing sound:", err));
      
      if (!loop) {
        audioRef.current = audio;
      }
    } catch (err) {
      console.error("Error creating audio:", err);
    }
  }, []);

  // Power management
  useEffect(() => {
    if (!isPlaying || gameOver || gameWon) return;
    
    let drain = 1; // Base power drain
    
    // Additional drain from active systems - just like original FNAF
    if (leftDoorClosed) drain += 1;
    if (rightDoorClosed) drain += 1;
    if (leftLightOn) drain += 0.5;
    if (rightLightOn) drain += 0.5;
    if (cameraView) drain += 1;
    
    setPowerDrain(drain);
    
    powerIntervalRef.current = window.setInterval(() => {
      setPower(prev => {
        const newPower = Math.max(0, prev - (drain / 360)); // Authentic FNAF power drain rate
        
        if (newPower <= 0 && !powerOutage) {
          handlePowerOutage();
        }
        
        return newPower;
      });
    }, 1000);
    
    return () => {
      if (powerIntervalRef.current) {
        clearInterval(powerIntervalRef.current);
        powerIntervalRef.current = null;
      }
    };
  }, [
    isPlaying, leftDoorClosed, rightDoorClosed, leftLightOn, 
    rightLightOn, cameraView, gameOver, gameWon, powerOutage
  ]);

  // Time progression
  useEffect(() => {
    if (!isPlaying || gameOver || gameWon) return;
    
    // Each hour lasts 89 seconds - authentic to FNAF
    hourIntervalRef.current = window.setInterval(() => {
      setHour(prev => {
        const newHour = prev + 1;
        if (newHour >= 6) {
          handleNightComplete();
          return 6;
        }
        
        // Play hour chime
        playSound("/src/assets/fnaf/sounds/hour_chime.mp3");
        
        return newHour;
      });
    }, 89000);
    
    return () => {
      if (hourIntervalRef.current) {
        clearInterval(hourIntervalRef.current);
        hourIntervalRef.current = null;
      }
    };
  }, [isPlaying, gameOver, gameWon, playSound]);

  // Animatronic AI loop - authentic FNAF behavior
  useEffect(() => {
    if (!isPlaying || gameOver || gameWon || powerOutage) return;
    
    const moveAnimatronics = () => {
      setAnimatronics(prev => {
        const newState = { ...prev };
        
        // Process each animatronic
        Object.keys(newState).forEach(character => {
          const animatronic = newState[character as keyof typeof newState];
          
          // Skip Freddy if camera is looking at him (authentic behavior)
          if (character === "freddy" && cameraView && currentCamera === animatronic.location) {
            return;
          }
          
          // Special Foxy logic
          if (character === "foxy") {
            // Foxy gets more active when not checked on
            if (!cameraView || currentCamera !== "1C") {
              animatronic.level += 0.5;
            } else {
              animatronic.level = Math.max(0, animatronic.level - 1);
            }
            
            // Determine Foxy's stage based on level
            if (animatronic.level >= 20) {
              // Foxy runs!
              animatronic.stage = 3;
              animatronic.running = true;
              animatronic.location = "2A"; // Running down hall
              
              // If left door is open, jumpscare!
              if (!leftDoorClosed) {
                // Delay for running animation
                setTimeout(() => {
                  setJumpscareAnimatronic("foxy");
                  setGameOver(true);
                }, 1000);
              } else {
                // Door stops Foxy, he bangs on it
                playSound("/src/assets/fnaf/sounds/door_knock.mp3");
                // Reset Foxy
                animatronic.level = 0;
                animatronic.stage = 0;
                animatronic.location = "1C";
                animatronic.running = false;
                
                // Drain extra power
                setPower(prev => Math.max(0, prev - 5));
              }
            } else if (animatronic.level >= 15) {
              animatronic.stage = 2; // Stepping out
            } else if (animatronic.level >= 10) {
              animatronic.stage = 1; // Peeking
            } else {
              animatronic.stage = 0; // Hidden
            }
            return;
          }
          
          // Normal animatronic movement logic
          const moveChance = (hour + 1) * (animatronic.level / 20) * 100;
          
          if (Math.random() * 100 < moveChance) {
            // Find current path index
            const currentIndex = animatronic.path.indexOf(animatronic.location);
            
            // If not at the end of the path
            if (currentIndex < animatronic.path.length - 1) {
              // Move to next location
              animatronic.location = animatronic.path[currentIndex + 1];
              
              // Check if now at office door
              if (animatronic.location === "2B" || animatronic.location === "4B") {
                animatronic.atDoor = true;
                
                // Freddy laugh when he moves
                if (character === "freddy") {
                  playSound("/src/assets/fnaf/sounds/freddy_laugh.mp3");
                }
              }
              
              // Check if reached office and door is open
              if (animatronic.location === "Office") {
                const doorClosed = character === "bonnie" ? leftDoorClosed : rightDoorClosed;
                
                if (!doorClosed) {
                  // Caught by animatronic!
                  setJumpscareAnimatronic(character);
                  setGameOver(true);
                } else {
                  // Door blocks, move back
                  animatronic.location = animatronic.path[currentIndex];
                }
              }
            }
          }
        });
        
        return newState;
      });
    };
    
    // Start the AI loop - speed varies based on night
    const interval = Math.max(3000 - (night * 400), 1000);
    animatronicLoopRef.current = window.setInterval(moveAnimatronics, interval);
    
    return () => {
      if (animatronicLoopRef.current) {
        clearInterval(animatronicLoopRef.current);
        animatronicLoopRef.current = null;
      }
    };
  }, [
    isPlaying, cameraView, currentCamera, leftDoorClosed, 
    rightDoorClosed, gameOver, gameWon, hour, night, powerOutage, playSound
  ]);

  // Keyboard controls - authentic FNAF experience
  useEffect(() => {
    if (!isPlaying || gameOver || gameWon) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (powerOutage) return;
      
      switch(e.key.toLowerCase()) {
        case 'a': // Left door
          toggleDoor("left");
          e.preventDefault();
          break;
        case 'd': // Right door
          toggleDoor("right");
          e.preventDefault();
          break;
        case 'q': // Left light
          setLeftLightOn(true);
          if (rightLightOn) setRightLightOn(false);
          e.preventDefault();
          break;
        case 'e': // Right light
          setRightLightOn(true);
          if (leftLightOn) setLeftLightOn(false);
          e.preventDefault();
          break;
        case 'c':
        case 'shift': // Camera toggle
          toggleCamera();
          e.preventDefault();
          break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          if (cameraView) {
            handleCameraSwitch(e.key);
          }
          e.preventDefault();
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (powerOutage) return;
      
      switch(e.key.toLowerCase()) {
        case 'q': // Left light off
          setLeftLightOn(false);
          e.preventDefault();
          break;
        case 'e': // Right light off
          setRightLightOn(false);
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver, gameWon, powerOutage, 
      leftLightOn, rightLightOn, cameraView]);

  // Door toggle function
  const toggleDoor = (side: "left" | "right") => {
    if (power <= 0 || powerOutage) return;
    
    if (side === "left") {
      setLeftDoorClosed(prev => !prev);
      playSound("/src/assets/fnaf/sounds/door.mp3");
    } else {
      setRightDoorClosed(prev => !prev);
      playSound("/src/assets/fnaf/sounds/door.mp3");
    }
  };

  // Camera toggle function
  const toggleCamera = () => {
    if (power <= 0 || powerOutage) return;
    
    setCameraView(prev => !prev);
    playSound("/src/assets/fnaf/sounds/camera_toggle.mp3");
    
    // Turn off lights when toggling camera
    setLeftLightOn(false);
    setRightLightOn(false);
  };

  // Camera switch function
  const handleCameraSwitch = (key: string) => {
    if (power <= 0 || powerOutage || !cameraView) return;
    
    const cameraMap: Record<string, string> = {
      '1': '1A', // Show Stage
      '2': '1B', // Dining Area
      '3': '1C', // Pirate Cove
      '4': '2A', // West Hall
      '5': '2B', // W. Hall Corner
      '6': '3',  // Supply Closet
      '7': '4A', // East Hall
      '8': '4B', // E. Hall Corner
      '9': '5',  // Backstage
    };
    
    if (cameraMap[key]) {
      setCurrentCamera(cameraMap[key]);
      playSound("/src/assets/fnaf/sounds/camera_switch.mp3");
    }
  };

  // Power outage handler - authentic to FNAF
  const handlePowerOutage = () => {
    // Stop all systems
    setPowerOutage(true);
    setLeftDoorClosed(false);
    setRightDoorClosed(false);
    setLeftLightOn(false);
    setRightLightOn(false);
    setCameraView(false);
    
    // Play power out sound
    playSound("/src/assets/fnaf/sounds/power_down.mp3");
    
    // Wait a moment before Freddy appears
    setTimeout(() => {
      // Play Freddy's music box
      playSound("/src/assets/fnaf/sounds/music_box.mp3", true, 0.3);
      
      // Show Freddy's eyes in the dark
      // Freddy will jumpscare after a random time period
      const fredyTime = 5000 + Math.random() * 15000;
      setTimeout(() => {
        setJumpscareAnimatronic("freddy");
        setGameOver(true);
      }, fredyTime);
    }, 2000);
  };

  // Night complete handler
  const handleNightComplete = () => {
    // Clear all intervals
    clearAllIntervals();
    
    // Play victory chime
    playSound("/src/assets/fnaf/sounds/6am.mp3");
    
    // Show victory screen
    setGameWon(true);
  };

  // Clear all game intervals
  const clearAllIntervals = () => {
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
    
    if (hourIntervalRef.current) {
      clearInterval(hourIntervalRef.current);
      hourIntervalRef.current = null;
    }
    
    if (animatronicLoopRef.current) {
      clearInterval(animatronicLoopRef.current);
      animatronicLoopRef.current = null;
    }
  };

  // Start new game
  const startGame = () => {
    // Reset game state
    setPower(100);
    setHour(0);
    setLeftDoorClosed(false);
    setRightDoorClosed(false);
    setLeftLightOn(false);
    setRightLightOn(false);
    setCameraView(false);
    setCurrentCamera("1A");
    setGameOver(false);
    setGameWon(false);
    setPowerOutage(false);
    setJumpscareAnimatronic(null);
    setIsPlaying(true);
    setShowControlInfo(false);
    
    // Reset animatronics
    setAnimatronics({
      freddy: { 
        location: "1A", 
        level: night, 
        moving: false,
        atDoor: false,
        path: ["1A", "1B", "7", "6", "4A", "4B", "Office"]
      },
      bonnie: { 
        location: "1A", 
        level: night + 1, 
        moving: false, 
        atDoor: false,
        path: ["1A", "1B", "5", "3", "2A", "2B", "Office"]
      },
      chica: { 
        location: "1A", 
        level: night + 2, 
        moving: false, 
        atDoor: false,
        path: ["1A", "1B", "7", "6", "4A", "4B", "Office"] 
      },
      foxy: { 
        location: "1C", 
        level: 0, 
        moving: false,
        stage: 0,
        running: false,
        atDoor: false,
        path: ["1C", "2A", "Office"]
      }
    });
    
    // Start ambient sound
    playSound("/src/assets/fnaf/sounds/ambient.mp3", true, 0.2);
    
    // Play phone call for night 1
    if (night === 1) {
      setTimeout(() => {
        setPhoneCallPlaying(true);
        playSound("/src/assets/fnaf/sounds/phone_call.mp3", false, 0.5);
        setTimeout(() => setPhoneCallPlaying(false), 30000); // Call lasts 30 seconds
      }, 3000);
    }
    
    // Show toast notification
    toast({
      title: `Night ${night} - 12 AM`,
      description: "Good luck! Watch your power and survive until 6 AM.",
      variant: "default",
    });
  };

  // Next night handler
  const startNextNight = () => {
    setNight(prev => prev + 1);
    setGameWon(false);
    startGame();
  };

  // Restart current night
  const restartNight = () => {
    startGame();
  };

  // Get camera feed image based on current camera and animatronic positions
  const getCameraFeed = () => {
    // Check which animatronics are in this room
    const animatronicsInRoom = Object.entries(animatronics)
      .filter(([name, data]) => data.location === currentCamera)
      .map(([name]) => name);
    
    // For each camera, return the appropriate image
    switch(currentCamera) {
      case "1A": // Show Stage
        if (animatronicsInRoom.length === 3) 
          return "/fnaf_assets/cam1a.png"; // All animatronics on stage
        else if (animatronicsInRoom.includes("freddy") && animatronicsInRoom.includes("chica"))
          return "/fnaf_assets/cam1a_bonnie_missing.png"; // Bonnie missing
        else if (animatronicsInRoom.includes("freddy") && animatronicsInRoom.includes("bonnie"))
          return "/fnaf_assets/cam1a_chica_missing.png"; // Chica missing
        else if (animatronicsInRoom.includes("freddy"))
          return "/fnaf_assets/cam1a_freddy_only.png"; // Only Freddy
        else
          return "/fnaf_assets/cam1a_empty.png"; // Empty stage
      
      case "1B": // Dining Area
        if (animatronicsInRoom.includes("bonnie"))
          return "/fnaf_assets/cam1b_bonnie.png"; // Bonnie in dining area
        else if (animatronicsInRoom.includes("chica"))
          return "/fnaf_assets/cam1b_chica.png"; // Chica in dining area
        else if (animatronicsInRoom.includes("freddy"))
          return "/fnaf_assets/cam1b_freddy.png"; // Freddy in dining area
        else
          return "/fnaf_assets/cam1b.png"; // Empty dining area
        
      case "1C": // Pirate Cove
        const foxyStage = animatronics.foxy.stage;
        if (foxyStage === 0)
          return "/fnaf_assets/cam1c_stage1.png"; // Curtain closed
        else if (foxyStage === 1)
          return "/fnaf_assets/cam1c_stage2.png"; // Foxy peeking
        else if (foxyStage === 2)
          return "/fnaf_assets/cam1c_stage3.png"; // Foxy stepping out
        else
          return "/fnaf_assets/cam1c_stage4.png"; // Foxy gone
      
      case "2A": // West Hall
        if (animatronics.foxy.running)
          return "/src/assets/fnaf/images/cam2a_foxy.png"; // Foxy running
        else if (animatronicsInRoom.includes("bonnie"))
          return "/src/assets/fnaf/images/cam2a_bonnie.png"; // Bonnie in west hall
        else
          return "/src/assets/fnaf/images/cam2a.png"; // Empty west hall
          
      case "2B": // West Hall Corner
        if (animatronicsInRoom.includes("bonnie"))
          return "/src/assets/fnaf/images/cam2b_bonnie.png"; // Bonnie in corner
        else
          return "/src/assets/fnaf/images/cam2b.png"; // Empty corner
      
      case "3": // Supply Closet
        if (animatronicsInRoom.includes("bonnie"))
          return "/src/assets/fnaf/images/cam3_bonnie.png"; // Bonnie in closet
        else
          return "/src/assets/fnaf/images/cam3.png"; // Empty closet
      
      case "4A": // East Hall
        if (animatronicsInRoom.includes("chica"))
          return "/src/assets/fnaf/images/cam4a_chica.png"; // Chica in east hall
        else if (animatronicsInRoom.includes("freddy"))
          return "/src/assets/fnaf/images/cam4a_freddy.png"; // Freddy in east hall
        else
          return "/src/assets/fnaf/images/cam4a.png"; // Empty east hall
      
      case "4B": // East Hall Corner
        if (animatronicsInRoom.includes("chica"))
          return "/src/assets/fnaf/images/cam4b_chica.png"; // Chica in corner
        else if (animatronicsInRoom.includes("freddy"))
          return "/src/assets/fnaf/images/cam4b_freddy.png"; // Freddy in corner
        else
          return "/src/assets/fnaf/images/cam4b.png"; // Empty corner
        
      case "5": // Backstage
        if (animatronicsInRoom.includes("bonnie"))
          return "/src/assets/fnaf/images/cam5_bonnie.png"; // Bonnie backstage
        else
          return "/src/assets/fnaf/images/cam5.png"; // Empty backstage
        
      case "6": // Kitchen (audio only)
        return "/src/assets/fnaf/images/cam6.png"; // Always black - "CAMERA DISABLED - AUDIO ONLY"
        
      case "7": // Restrooms
        if (animatronicsInRoom.includes("chica"))
          return "/src/assets/fnaf/images/cam7_chica.png"; // Chica in restrooms
        else if (animatronicsInRoom.includes("freddy"))
          return "/src/assets/fnaf/images/cam7_freddy.png"; // Freddy in restrooms
        else
          return "/src/assets/fnaf/images/cam7.png"; // Empty restrooms

      default:
        return "/src/assets/fnaf/images/static.gif";
    }
  };

  // Check if animatronic is visible in door window when light is on
  const isDoorwayOccupied = (side: "left" | "right") => {
    if (side === "left") {
      return animatronics.bonnie.atDoor || animatronics.bonnie.location === "Office";
    } else {
      return animatronics.chica.atDoor || animatronics.chica.location === "Office" || 
             animatronics.freddy.atDoor || animatronics.freddy.location === "Office";
    }
  };

  // Render menu screen
  const renderMenuScreen = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white p-8 fnaf-container">
        <h1 className="fnaf-title text-5xl mb-8">Five Nights at Freddy's</h1>
        
        <div className="w-[500px] h-[300px] bg-cover bg-center mb-8" 
             style={{ backgroundImage: "url('/src/assets/fnaf/images/menu.jpg')" }}>
        </div>
        
        <div className="flex flex-col gap-4 w-64">
          <Button 
            onClick={startGame}
            className="fnaf-button text-xl h-12"
          >
            NEW GAME
          </Button>
          
          <div className="flex items-center justify-between mb-2">
            <span>Night:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button 
                  key={n}
                  onClick={() => setNight(n)}
                  className={`fnaf-button w-8 h-8 mx-1 ${night === n ? 'active' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={() => setShowControlInfo(!showControlInfo)}
            className="fnaf-button"
          >
            {showControlInfo ? "HIDE CONTROLS" : "SHOW CONTROLS"}
          </Button>
        </div>
        
        {showControlInfo && (
          <div className="mt-8 bg-gray-900 p-4 border border-gray-700 max-w-lg">
            <h2 className="text-xl mb-2">Controls:</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>A - Left Door</div>
              <div>D - Right Door</div>
              <div>Q - Left Light</div>
              <div>E - Right Light</div>
              <div>C/Shift - Camera</div>
              <div>1-9 - Switch Camera</div>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Survive from 12 AM to 6 AM. Watch the animatronics on cameras and close doors to keep them out.
              But be careful - power is limited! Doors and lights drain power.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render game over screen with jumpscare
  const renderGameOver = () => {
    return (
      <div className="fnaf-jumpscare">
        {jumpscareAnimatronic && (
          <>
            <img 
              src={`/src/assets/fnaf/images/${jumpscareAnimatronic}_jumpscare.gif`} 
              alt="Jumpscare" 
              className="w-full h-full object-contain"
            />
            <audio 
              src="/src/assets/fnaf/sounds/jumpscare.mp3" 
              autoPlay 
            />
          </>
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 animate-fade-in" 
             style={{ animationDelay: '2.5s', animationDuration: '1s' }}>
          <h2 className="text-red-600 text-6xl mb-8 font-bold">GAME OVER</h2>
          <div className="flex space-x-4">
            <Button 
              onClick={restartNight}
              className="fnaf-button text-xl"
            >
              TRY AGAIN
            </Button>
            <Button 
              onClick={() => {
                setIsPlaying(false);
                setGameOver(false);
              }}
              className="fnaf-button text-xl"
            >
              MAIN MENU
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render victory screen
  const renderVictory = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl text-yellow-400 mb-4 fnaf-title">6 AM</h1>
          <h2 className="text-4xl text-green-500 mb-2">NIGHT {night} COMPLETE!</h2>
          <p className="text-xl text-gray-300">You survived the night!</p>
        </div>
        
        <div className="flex space-x-4 mt-8">
          <Button 
            onClick={startNextNight}
            className="fnaf-button text-xl"
          >
            NEXT NIGHT
          </Button>
          <Button 
            onClick={() => {
              setIsPlaying(false);
              setGameWon(false);
            }}
            className="fnaf-button text-xl"
          >
            MAIN MENU
          </Button>
        </div>
      </div>
    );
  };

  // Render camera view - exactly like FNAF
  const renderCameraView = () => {
    return (
      <div className="h-full bg-black text-white relative fnaf-container">
        {/* Camera feed with border */}
        <div className="w-full h-[70%] relative fnaf-camera">
          {/* Feed image */}
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${getCameraFeed()})` }}
          >
            {/* UI overlay */}
            <div className="absolute top-2 left-2 text-white text-sm font-bold bg-black bg-opacity-70 px-2 py-1">
              CAM {currentCamera}
            </div>
            
            {/* If kitchen, show "AUDIO ONLY" */}
            {currentCamera === "6" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-red-500 font-bold">CAMERA DISABLED</span>
                <span className="text-white">AUDIO ONLY</span>
              </div>
            )}
            
            {/* Static overlay */}
            <div className="fnaf-static"></div>
            <div className="fnaf-scanner"></div>
          </div>
        </div>
        
        {/* Camera controls */}
        <div className="w-full h-[30%] bg-gray-900 p-4 flex">
          {/* Camera map */}
          <div className="w-[60%] h-full relative">
            <img 
              src="/src/assets/fnaf/images/map.png" 
              alt="Camera Map" 
              className="w-full h-full object-contain"
            />
            
            {/* Camera selection buttons */}
            <div className="absolute inset-0">
              {[
                { id: "1A", name: "Show Stage", x: 25, y: 20 },
                { id: "1B", name: "Dining Area", x: 50, y: 30 },
                { id: "1C", name: "Pirate Cove", x: 15, y: 30 },
                { id: "2A", name: "West Hall", x: 25, y: 50 },
                { id: "2B", name: "W. Hall Corner", x: 15, y: 65 },
                { id: "3", name: "Supply Closet", x: 35, y: 50 },
                { id: "4A", name: "East Hall", x: 75, y: 50 },
                { id: "4B", name: "E. Hall Corner", x: 85, y: 65 },
                { id: "5", name: "Backstage", x: 30, y: 20 },
                { id: "6", name: "Kitchen", x: 65, y: 30 },
                { id: "7", name: "Restrooms", x: 70, y: 20 },
              ].map(camera => (
                <button 
                  key={camera.id}
                  className={`absolute w-5 h-5 rounded-full ${currentCamera === camera.id ? 'bg-red-600' : 'bg-green-600'}`}
                  style={{ left: `${camera.x}%`, top: `${camera.y}%` }}
                  onClick={() => {
                    setCurrentCamera(camera.id);
                    playSound("/src/assets/fnaf/sounds/camera_switch.mp3");
                  }}
                >
                  <span className="absolute -top-5 left-0 text-white text-xs">
                    {camera.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Info panel */}
          <div className="w-[40%] pl-4 flex flex-col justify-between">
            <div>
              <div className="text-sm">Night {night}</div>
              <div className="text-2xl text-yellow-500">{hour} AM</div>
              <div className="mt-2">
                <div className="text-sm">Power Left: {Math.round(power)}%</div>
                <div className="fnaf-power-bar mt-1">
                  <div className="fnaf-power-level" style={{ width: `${power}%` }}></div>
                </div>
                <div className="text-sm mt-1">Power Usage:</div>
                <div className="flex mt-1">
                  {Array.from({ length: Math.floor(powerDrain) }).map((_, i) => (
                    <div key={i} className="w-4 h-6 bg-green-600 mr-[2px]"></div>
                  ))}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={toggleCamera}
              className="fnaf-button"
            >
              Close Camera
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render office view - exactly like FNAF
  const renderOfficeView = () => {
    return (
      <div className="h-full relative overflow-hidden fnaf-office">
        {/* Office interior with interactive doors and lights */}
        <div className="h-full w-full flex items-center relative">
          {/* Left door and controls */}
          <div className="absolute left-0 top-0 h-full">
            {/* Door */}
            <div className={`fnaf-door ${leftDoorClosed ? 'closed' : 'open'}`}></div>
            
            {/* Light effect area */}
            <div className={`fnaf-light ${leftLightOn ? 'on' : ''}`}>
              {/* Show animatronic if at door and light is on */}
              {leftLightOn && isDoorwayOccupied("left") && (
                <img 
                  src="/src/assets/fnaf/images/bonnie_door.png" 
                  alt="Bonnie" 
                  className="absolute bottom-0 left-0 h-3/4"
                />
              )}
            </div>
            
            {/* Door controls */}
            <div className="absolute left-8 bottom-32 flex flex-col space-y-2">
              <button 
                onClick={() => toggleDoor("left")}
                className={`fnaf-button ${leftDoorClosed ? 'active' : ''}`}
              >
                DOOR
              </button>
              <button 
                onMouseDown={() => setLeftLightOn(true)}
                onMouseUp={() => setLeftLightOn(false)}
                onMouseLeave={() => setLeftLightOn(false)}
                className={`fnaf-button ${leftLightOn ? 'active' : ''}`}
              >
                LIGHT
              </button>
            </div>
          </div>
          
          {/* Center office area */}
          <div className="flex-1 h-full flex items-center justify-center">
            {/* Camera button */}
            <button 
              onClick={toggleCamera}
              className="fnaf-button absolute bottom-20"
            >
              TOGGLE CAMERA
            </button>
            
            {/* Phone call indicator */}
            {phoneCallPlaying && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-800 text-white px-3 py-1 rounded-full animate-pulse">
                Phone Call
              </div>
            )}
            
            {/* Power outage effects */}
            {powerOutage && (
              <div className="absolute inset-0 bg-black bg-opacity-90">
                {/* Freddy's eyes */}
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-8">
                    <div className="w-4 h-4 bg-blue-300 rounded-full animate-pulse"></div>
                    <div className="w-4 h-4 bg-blue-300 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right door and controls */}
          <div className="absolute right-0 top-0 h-full">
            {/* Door */}
            <div className={`fnaf-door ${rightDoorClosed ? 'closed' : 'open'}`}></div>
            
            {/* Light effect area */}
            <div className={`fnaf-light ${rightLightOn ? 'on' : ''}`}>
              {/* Show animatronic if at door and light is on */}
              {rightLightOn && isDoorwayOccupied("right") && (
                <img 
                  src="/src/assets/fnaf/images/chica_door.png" 
                  alt="Chica" 
                  className="absolute bottom-0 right-0 h-3/4"
                />
              )}
            </div>
            
            {/* Door controls */}
            <div className="absolute right-8 bottom-32 flex flex-col space-y-2">
              <button 
                onClick={() => toggleDoor("right")}
                className={`fnaf-button ${rightDoorClosed ? 'active' : ''}`}
              >
                DOOR
              </button>
              <button 
                onMouseDown={() => setRightLightOn(true)}
                onMouseUp={() => setRightLightOn(false)}
                onMouseLeave={() => setRightLightOn(false)}
                className={`fnaf-button ${rightLightOn ? 'active' : ''}`}
              >
                LIGHT
              </button>
            </div>
          </div>
        </div>
        
        {/* HUD overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 flex justify-between items-center">
          <div>
            <div className="text-xs text-yellow-500">Power left: {Math.round(power)}%</div>
            <div className="fnaf-power-bar w-32 mt-1">
              <div className="fnaf-power-level" style={{ width: `${power}%` }}></div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl text-yellow-500">{hour} AM</div>
            <div className="text-xs text-white">Night {night}</div>
          </div>
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
            The original survival horror game! Work as a night security guard at Freddy Fazbear's Pizza.
            Monitor the security cameras and survive five nights with the animatronic characters that roam at night.
          </p>
        </CardContent>
      </Card>
      
      <div 
        ref={gameContainerRef}
        className="flex-grow bg-black rounded-lg overflow-hidden"
      >
        {!isPlaying ? (
          renderMenuScreen()
        ) : gameOver ? (
          renderGameOver()
        ) : gameWon ? (
          renderVictory()
        ) : cameraView ? (
          renderCameraView()
        ) : (
          renderOfficeView()
        )}
      </div>
      
      {/* Global styles for authentic FNAF looks */}
      <style>{`
        @keyframes animate-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation-name: animate-fade-in;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}