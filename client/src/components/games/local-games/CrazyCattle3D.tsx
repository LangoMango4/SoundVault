import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { ErrorMessage } from "./ErrorMessage";
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Cow {
  position: number; // 0 = left, 1 = center, 2 = right lane
  speed: number;
  distance: number;
  element: React.RefObject<HTMLDivElement>;
  rotation: number;
  bounceHeight: number;
  color: string;
}

interface Obstacle {
  position: number; // 0 = left, 1 = center, 2 = right lane
  distance: number;
  type: 'rock' | 'fence' | 'pond' | 'bush' | 'haystack';
  element: React.RefObject<HTMLDivElement>;
}

interface GameState {
  score: number;
  highScore: number;
  distance: number;
  speed: number;
  level: number;
  lives: number;
  gameOver: boolean;
  isPaused: boolean;
  isStarted: boolean;
  soundEnabled: boolean;
}

// Original Crazy Cattle feel
const CATTLE_COLORS = [
  '#FFFFFF', // white
  '#8D5524', // brown
  '#000000', // black with white spots
  '#A0522D', // sienna
  '#D2691E'  // chocolate
];

const OBSTACLES = [
  { type: 'rock', width: 30, height: 20, color: '#8a8a8a' },
  { type: 'fence', width: 40, height: 15, color: '#ba8c63' },
  { type: 'pond', width: 35, height: 10, color: '#4a80bd' },
  { type: 'bush', width: 25, height: 25, color: '#2e8b57' },
  { type: 'haystack', width: 45, height: 30, color: '#DAA520' }
];

export function CrazyCattle3D() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: 0,
    distance: 0,
    speed: 5,
    level: 1,
    lives: 3,
    gameOver: false,
    isPaused: false,
    isStarted: false,
    soundEnabled: true
  });
  
  const [cow, setCow] = useState<Cow>({
    position: 1, // Start in center
    speed: 0,
    distance: 0,
    element: React.createRef(),
    rotation: 0,
    bounceHeight: 0,
    color: CATTLE_COLORS[Math.floor(Math.random() * CATTLE_COLORS.length)]
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [leaderboard, setLeaderboard] = useState<{username: string, score: number}[]>([]);
  
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  
  // Sound references
  const mooSoundRef = useRef<HTMLAudioElement | null>(null);
  const collisionSoundRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  
  // Setup audio elements
  useEffect(() => {
    mooSoundRef.current = new Audio('/attached_assets/cow-moo.mp3');
    collisionSoundRef.current = new Audio('/attached_assets/boom.mp3');
    bgMusicRef.current = new Audio('/attached_assets/crazy-cattle-bg.mp3');
    
    if (bgMusicRef.current) {
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.4;
    }
    
    return () => {
      // Clean up audio on component unmount
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, []);
  
  // Handle sound toggle
  useEffect(() => {
    if (bgMusicRef.current) {
      if (gameState.soundEnabled && gameState.isStarted && !gameState.isPaused && !gameState.gameOver) {
        bgMusicRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        bgMusicRef.current.pause();
      }
    }
  }, [gameState.soundEnabled, gameState.isStarted, gameState.isPaused, gameState.gameOver]);
  
  // Fetch high score and leaderboard on component mount
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await apiRequest('GET', '/api/game-data/crazy-cattle');
        const data = await res.json();
        
        if (data.highScore) {
          setGameState(prev => ({
            ...prev,
            highScore: data.highScore
          }));
        }
        
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to fetch game data:', err);
      }
    };
    
    fetchGameData();
  }, []);
  
  // Save high score when game ends
  useEffect(() => {
    if (gameState.gameOver && user && gameState.score > 0) {
      const saveScore = async () => {
        try {
          await apiRequest('POST', '/api/game-data/crazy-cattle', {
            score: gameState.score,
            data: {
              level: gameState.level,
              distance: gameState.distance
            }
          });
          
          // Refresh leaderboard
          const res = await apiRequest('GET', '/api/game-data/crazy-cattle');
          const data = await res.json();
          
          if (data.leaderboard) {
            setLeaderboard(data.leaderboard);
          }
        } catch (err) {
          console.error('Failed to save score:', err);
        }
      };
      
      saveScore();
    }
  }, [gameState.gameOver, gameState.score, user]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isStarted || gameState.gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (cow.position > 0 && !gameState.isPaused) {
            // Play moo sound
            if (gameState.soundEnabled && mooSoundRef.current) {
              mooSoundRef.current.currentTime = 0;
              mooSoundRef.current.play().catch(() => {});
            }
            
            setCow(prev => ({
              ...prev,
              position: prev.position - 1,
              rotation: -15 // Tilt cow when turning
            }));
          }
          break;
        case 'ArrowRight':
          if (cow.position < 2 && !gameState.isPaused) {
            // Play moo sound
            if (gameState.soundEnabled && mooSoundRef.current) {
              mooSoundRef.current.currentTime = 0;
              mooSoundRef.current.play().catch(() => {});
            }
            
            setCow(prev => ({
              ...prev,
              position: prev.position + 1,
              rotation: 15 // Tilt cow when turning
            }));
          }
          break;
        case 'ArrowUp':
          // Speed boost
          if (!gameState.isPaused) {
            setGameState(prev => ({
              ...prev,
              speed: Math.min(prev.speed + 2, 15)
            }));
          }
          break;
        case 'ArrowDown':
          // Slow down
          if (!gameState.isPaused) {
            setGameState(prev => ({
              ...prev,
              speed: Math.max(prev.speed - 2, 3)
            }));
          }
          break;
        case ' ':
          togglePause();
          break;
        case 'Escape':
          if (gameState.isStarted) {
            togglePause();
          }
          break;
        case 'm':
          toggleSound();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isStarted, gameState.gameOver, gameState.isPaused, cow.position, gameState.soundEnabled]);
  
  // Main game loop
  const gameLoop = (time: number) => {
    if (lastTimeRef.current === undefined) {
      lastTimeRef.current = time;
    }
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    if (!gameState.isPaused && gameState.isStarted && !gameState.gameOver) {
      // Update distance/score
      const distanceIncrement = gameState.speed * deltaTime * 0.01;
      const newDistance = gameState.distance + distanceIncrement;
      const newScore = Math.floor(newDistance * 10);
      
      // Check for level up
      const newLevel = Math.floor(newDistance / 100) + 1;
      
      // Update cow bounce animation
      setCow(prev => ({
        ...prev,
        rotation: prev.rotation * 0.9, // Gradually return to normal
        bounceHeight: Math.abs(Math.sin(newDistance * 0.3)) * 5,
        distance: newDistance
      }));
      
      // Update obstacles
      const newObstacles = [...obstacles];
      
      // Move existing obstacles
      for (let i = newObstacles.length - 1; i >= 0; i--) {
        newObstacles[i].distance -= distanceIncrement;
        
        // Remove obstacles that are too far behind
        if (newObstacles[i].distance < -10) {
          newObstacles.splice(i, 1);
          continue;
        }
        
        // Check for collision with cow
        if (
          Math.abs(newObstacles[i].distance - cow.distance) < 5 &&
          newObstacles[i].position === cow.position
        ) {
          // Collision occurred
          const newLives = gameState.lives - 1;
          
          // Play collision sound
          if (gameState.soundEnabled && collisionSoundRef.current) {
            collisionSoundRef.current.currentTime = 0;
            collisionSoundRef.current.play().catch(() => {});
          }
          
          if (newLives <= 0) {
            setGameState(prev => ({
              ...prev,
              lives: 0,
              gameOver: true,
              highScore: Math.max(prev.highScore, newScore)
            }));
            
            // Show Windows-style error message
            setError({
              show: true,
              message: `Game Over! Your cow has been terminated. Final score: ${newScore}`
            });
            return;
          } else {
            // Remove the obstacle and reduce lives
            newObstacles.splice(i, 1);
            setGameState(prev => ({
              ...prev,
              lives: newLives
            }));
            
            toast({
              title: "Moo-ch! 🐄",
              description: `Your cow hit an obstacle! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`,
              variant: "destructive"
            });
          }
        }
      }
      
      // Maybe add a new obstacle (more frequent at higher levels)
      const obstacleChance = 0.005 * gameState.level * (gameState.speed / 5);
      if (Math.random() < obstacleChance && newObstacles.length < 5) {
        // Select random obstacle type from the OBSTACLES array
        const obstacleInfo = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
        
        const newObstacle: Obstacle = {
          position: Math.floor(Math.random() * 3),
          distance: cow.distance + 100 + Math.random() * 50,
          type: obstacleInfo.type as 'rock' | 'fence' | 'pond' | 'bush' | 'haystack',
          element: React.createRef()
        };
        newObstacles.push(newObstacle);
      }
      
      setObstacles(newObstacles);
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        distance: newDistance,
        score: newScore,
        level: newLevel,
        // Gradually increase speed based on level
        speed: Math.min(5 + (newLevel * 0.5), 15)
      }));
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Start/stop the game loop when needed
  useEffect(() => {
    if (gameState.isStarted && !gameState.gameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState.isStarted, gameState.gameOver, gameState.isPaused]);
  
  const startGame = () => {
    setGameState({
      score: 0,
      highScore: gameState.highScore,
      distance: 0,
      speed: 5,
      level: 1,
      lives: 3,
      gameOver: false,
      isPaused: false,
      isStarted: true,
      soundEnabled: gameState.soundEnabled
    });
    
    setCow({
      position: 1, // Start in center
      speed: 0,
      distance: 0,
      element: React.createRef(),
      rotation: 0,
      bounceHeight: 0,
      color: CATTLE_COLORS[Math.floor(Math.random() * CATTLE_COLORS.length)]
    });
    
    setObstacles([]);
    setError({ show: false, message: '' });
  };
  
  const togglePause = () => {
    if (!gameState.isStarted || gameState.gameOver) return;
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };
  
  const toggleSound = () => {
    setGameState(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };
  
  // Handle movement button clicks
  const moveLeft = () => {
    if (cow.position > 0 && gameState.isStarted && !gameState.gameOver && !gameState.isPaused) {
      // Play moo sound
      if (gameState.soundEnabled && mooSoundRef.current) {
        mooSoundRef.current.currentTime = 0;
        mooSoundRef.current.play().catch(() => {});
      }
      
      setCow(prev => ({
        ...prev,
        position: prev.position - 1,
        rotation: -15
      }));
    }
  };
  
  const moveRight = () => {
    if (cow.position < 2 && gameState.isStarted && !gameState.gameOver && !gameState.isPaused) {
      // Play moo sound
      if (gameState.soundEnabled && mooSoundRef.current) {
        mooSoundRef.current.currentTime = 0;
        mooSoundRef.current.play().catch(() => {});
      }
      
      setCow(prev => ({
        ...prev,
        position: prev.position + 1,
        rotation: 15
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Crazy Cattle 3D</h2>
          <p className="text-gray-600">Guide your cow through the countryside</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">Lives:</span>
            <div className="flex">
              {[...Array(gameState.lives)].map((_, i) => (
                <div key={i} className="text-red-500 text-xl">♥</div>
              ))}
              {[...Array(3 - gameState.lives)].map((_, i) => (
                <div key={i + gameState.lives} className="text-gray-300 text-xl">♥</div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <span><strong>Score:</strong> {gameState.score}</span>
            <span><strong>High Score:</strong> {gameState.highScore}</span>
            <span><strong>Level:</strong> {gameState.level}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Game view */}
        <div className="flex-1 relative overflow-hidden border rounded-md bg-gradient-to-b from-blue-300 to-blue-600" 
             ref={gameContainerRef} 
             style={{
               perspective: '800px',
               perspectiveOrigin: '50% 30%',
             }}>
          
          {/* Sun */}
          <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-yellow-300 shadow-lg"></div>
          
          {/* Clouds */}
          <div className="absolute top-12 left-12 w-24 h-8 rounded-full bg-white opacity-80"></div>
          <div className="absolute top-20 left-32 w-16 h-6 rounded-full bg-white opacity-70"></div>
          <div className="absolute top-16 right-32 w-20 h-7 rounded-full bg-white opacity-75"></div>
          
          {/* Hills in the distance */}
          <div className="absolute bottom-[45%] left-0 w-full h-24">
            <div className="absolute bottom-0 left-0 w-[30%] h-full rounded-t-full bg-green-700 opacity-80"></div>
            <div className="absolute bottom-0 left-[25%] w-[40%] h-[80%] rounded-t-full bg-green-700 opacity-70"></div>
            <div className="absolute bottom-0 right-0 w-[35%] h-[90%] rounded-t-full bg-green-700 opacity-75"></div>
          </div>
          
          {/* Game road */}
          <div 
            ref={roadRef}
            className="absolute bottom-0 left-0 w-full h-[60%] bg-green-800"
            style={{
              transform: 'rotateX(60deg)',
              transformOrigin: 'bottom',
            }}
          >
            {/* Road stripes */}
            <div className="absolute inset-0 flex justify-between">
              <div className="w-1/3 h-full border-r-4 border-dashed border-white opacity-50"></div>
              <div className="w-1/3 h-full border-r-4 border-dashed border-white opacity-50"></div>
            </div>
            
            {/* Obstacles */}
            {obstacles.map((obstacle, index) => {
              // Calculate distance-based size and position
              const scale = Math.max(0.1, 1 - (obstacle.distance - cow.distance) / 100);
              const obstacleInfo = OBSTACLES.find(o => o.type === obstacle.type) || OBSTACLES[0];
              
              let left = '50%';
              if (obstacle.position === 0) left = '16.7%';
              if (obstacle.position === 2) left = '83.3%';
              
              const bottom = `${Math.max(5, (1 - (obstacle.distance - cow.distance) / 100) * 80)}%`;
              
              // Determine the obstacle appearance
              let obstacleElement;
              switch(obstacle.type) {
                case 'rock':
                  obstacleElement = (
                    <div className="w-full h-full rounded-md bg-gray-600 shadow-md border-2 border-gray-700"></div>
                  );
                  break;
                case 'fence':
                  obstacleElement = (
                    <div className="w-full h-full flex flex-col justify-between overflow-hidden">
                      <div className="h-1/3 bg-amber-700"></div>
                      <div className="h-1/3 flex justify-around">
                        <div className="w-1/6 h-full bg-amber-700"></div>
                        <div className="w-1/6 h-full bg-amber-700"></div>
                        <div className="w-1/6 h-full bg-amber-700"></div>
                        <div className="w-1/6 h-full bg-amber-700"></div>
                      </div>
                      <div className="h-1/3 bg-amber-700"></div>
                    </div>
                  );
                  break;
                case 'pond':
                  obstacleElement = (
                    <div className="w-full h-full rounded-full bg-blue-500 shadow-md border-2 border-blue-600 overflow-hidden">
                      <div className="w-full h-1/4 bg-blue-300 opacity-40 transform translate-y-1"></div>
                    </div>
                  );
                  break;
                case 'bush':
                  obstacleElement = (
                    <div className="w-full h-full rounded-full bg-green-600 shadow-md border-2 border-green-700"></div>
                  );
                  break;
                case 'haystack':
                  obstacleElement = (
                    <div className="w-full h-full rounded-t-full bg-yellow-700 shadow-md border-2 border-yellow-800"></div>
                  );
                  break;
                default:
                  obstacleElement = (
                    <div className="w-full h-full rounded-md bg-red-500 shadow-md"></div>
                  );
              }
              
              return (
                <div 
                  key={index}
                  ref={obstacle.element}
                  className="absolute transform -translate-x-1/2"
                  style={{
                    left,
                    bottom,
                    width: obstacleInfo.width * scale,
                    height: obstacleInfo.height * scale,
                    zIndex: Math.floor(obstacle.distance * -1)
                  }}
                >
                  {obstacleElement}
                </div>
              );
            })}
            
            {/* Cow */}
            <div 
              ref={cow.element}
              className="absolute bottom-[20%] transform -translate-x-1/2"
              style={{
                left: cow.position === 0 ? '16.7%' : cow.position === 1 ? '50%' : '83.3%',
                width: 30,
                height: 30,
                transform: `translateX(-50%) translateY(${-cow.bounceHeight}px) rotateX(-60deg) rotateZ(${cow.rotation}deg)`,
                zIndex: 50
              }}
            >
              <div className="relative w-full h-full">
                {/* Cow body - using the cow's color */}
                <div 
                  className="absolute inset-0 rounded-lg shadow-md"
                  style={{ backgroundColor: cow.color }}
                ></div>
                
                {/* Cow head */}
                <div className="absolute bottom-[80%] left-1/2 w-[60%] h-[60%] bg-white rounded-t-lg transform -translate-x-1/2">
                  {/* Eyes */}
                  <div className="absolute top-[20%] left-[20%] w-[15%] h-[20%] bg-black rounded-full"></div>
                  <div className="absolute top-[20%] right-[20%] w-[15%] h-[20%] bg-black rounded-full"></div>
                  
                  {/* Snout */}
                  <div className="absolute bottom-[20%] left-1/2 w-[60%] h-[30%] bg-pink-300 rounded-md transform -translate-x-1/2">
                    <div className="absolute top-1/2 left-1/4 w-[20%] h-[30%] bg-black rounded-full"></div>
                    <div className="absolute top-1/2 right-1/4 w-[20%] h-[30%] bg-black rounded-full"></div>
                  </div>
                </div>
                
                {/* Spots (if white cow) */}
                {cow.color === '#FFFFFF' && (
                  <>
                    <div className="absolute top-[20%] left-[10%] w-[25%] h-[25%] bg-black rounded-full"></div>
                    <div className="absolute bottom-[15%] right-[20%] w-[30%] h-[30%] bg-black rounded-full"></div>
                  </>
                )}
                
                {/* Horns (for non-white cows) */}
                {cow.color !== '#FFFFFF' && (
                  <>
                    <div className="absolute top-[-10%] left-[15%] w-[10%] h-[30%] bg-gray-300 rounded-t-lg transform -rotate-15"></div>
                    <div className="absolute top-[-10%] right-[15%] w-[10%] h-[30%] bg-gray-300 rounded-t-lg transform rotate-15"></div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Game overlay */}
          {!gameState.isStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-6">
              <h2 className="text-3xl font-bold mb-4">Crazy Cattle 3D</h2>
              <p className="mb-6 text-center max-w-md">
                Guide your cow through obstacles! Use arrow keys to move left and right. Press Space to pause the game.
              </p>
              <Button onClick={startGame} className="text-lg">Start Game</Button>
            </div>
          )}
          
          {gameState.isPaused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
              <h2 className="text-3xl font-bold mb-4">Game Paused</h2>
              <Button onClick={togglePause} className="text-lg">Resume</Button>
            </div>
          )}
          
          {gameState.gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-6">
              <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
              <p className="mb-2">Your Score: {gameState.score}</p>
              <p className="mb-6">High Score: {gameState.highScore}</p>
              <Button onClick={startGame} className="text-lg">Play Again</Button>
            </div>
          )}
          
          {/* Mobile controls */}
          <div className="absolute bottom-4 left-0 w-full flex justify-between px-6">
            <Button variant="outline" size="lg" onClick={moveLeft} className="bg-white bg-opacity-50 h-16 w-16">
              <ArrowLeft size={24} />
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={togglePause} 
                className="bg-white bg-opacity-50"
                disabled={!gameState.isStarted || gameState.gameOver}
              >
                {gameState.isPaused ? <Play size={16} /> : <Pause size={16} />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSound} 
                className="bg-white bg-opacity-50"
              >
                {gameState.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </Button>
            </div>
            
            <Button variant="outline" size="lg" onClick={moveRight} className="bg-white bg-opacity-50 h-16 w-16">
              <ArrowRight size={24} />
            </Button>
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="w-64 ml-4 border rounded-md p-4 overflow-auto hidden md:block">
          <h3 className="text-lg font-bold mb-2">Leaderboard</h3>
          {leaderboard.length > 0 ? (
            <ul className="divide-y">
              {leaderboard.slice(0, 10).map((entry, i) => (
                <li key={i} className="py-2 flex justify-between">
                  <span>{i + 1}. {entry.username}</span>
                  <span className="font-medium">{entry.score}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No scores yet. Be the first to play!</p>
          )}
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">How to Play:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>← → : Move cow left/right</li>
              <li>↑ : Increase speed</li>
              <li>↓ : Decrease speed</li>
              <li>Space: Pause/Resume</li>
              <li>M: Toggle sound</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Windows-style error message */}
      {error.show && (
        <ErrorMessage 
          title="Cow Collision"
          message={error.message} 
          onClose={() => {
            setError({ show: false, message: '' });
          }}
        />
      )}
      
      {/* Hidden audio elements */}
      <audio id="moo-sound" src="/attached_assets/cow-moo.mp3" preload="auto" style={{ display: 'none' }}></audio>
      <audio id="collision-sound" src="/attached_assets/boom.mp3" preload="auto" style={{ display: 'none' }}></audio>
      <audio id="bg-music" src="/attached_assets/crazy-cattle-bg.mp3" preload="auto" loop style={{ display: 'none' }}></audio>
    </div>
  );
}