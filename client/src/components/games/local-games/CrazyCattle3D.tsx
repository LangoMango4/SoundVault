import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { ErrorMessage } from './ErrorMessage';

// Define cow model structure
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
  type: 'rock' | 'fence' | 'pond';
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
}

const colors = [
  '#8D5524', // brown
  '#FFFFFF', // white
  '#E5E5E5', // gray
  '#000000', // black
  '#E7C591'  // tan
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
  });
  
  const [cow, setCow] = useState<Cow>({
    position: 1, // Start in center
    speed: 0,
    distance: 0,
    element: React.createRef(),
    rotation: 0,
    bounceHeight: 0,
    color: colors[Math.floor(Math.random() * colors.length)]
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [leaderboard, setLeaderboard] = useState<{username: string, score: number}[]>([]);
  
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  
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
    if (gameState.gameOver && user) {
      const saveScore = async () => {
        try {
          await apiRequest('POST', '/api/game-data/crazy-cattle', {
            score: gameState.score,
            username: user.username
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
      if (!gameState.isStarted || gameState.gameOver || gameState.isPaused) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (cow.position > 0) {
            setCow(prev => ({
              ...prev,
              position: prev.position - 1,
              rotation: -15 // Tilt cow when turning
            }));
          }
          break;
        case 'ArrowRight':
          if (cow.position < 2) {
            setCow(prev => ({
              ...prev,
              position: prev.position + 1,
              rotation: 15 // Tilt cow when turning
            }));
          }
          break;
        case 'ArrowUp':
          // Speed boost
          setGameState(prev => ({
            ...prev,
            speed: Math.min(prev.speed + 2, 15)
          }));
          break;
        case 'ArrowDown':
          // Slow down
          setGameState(prev => ({
            ...prev,
            speed: Math.max(prev.speed - 2, 3)
          }));
          break;
        case ' ':
          togglePause();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isStarted, gameState.gameOver, gameState.isPaused, cow.position]);
  
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
          if (newLives <= 0) {
            setGameState(prev => ({
              ...prev,
              lives: 0,
              gameOver: true,
              highScore: Math.max(prev.highScore, newScore)
            }));
            return;
          } else {
            // Remove the obstacle and reduce lives
            newObstacles.splice(i, 1);
            setGameState(prev => ({
              ...prev,
              lives: newLives
            }));
            
            toast({
              title: "Ouch!",
              description: `Your cow hit an obstacle! ${newLives} lives remaining.`,
              variant: "destructive"
            });
          }
        }
      }
      
      // Maybe add a new obstacle
      if (Math.random() < 0.01 * gameState.speed && newObstacles.length < 5) {
        const obstacleTypes = ['rock', 'fence', 'pond'] as const;
        const newObstacle: Obstacle = {
          position: Math.floor(Math.random() * 3),
          distance: cow.distance + 100 + Math.random() * 50,
          type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)],
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
        speed: Math.min(prev.speed + deltaTime * 0.0001, 15) // Gradually increase speed
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
    });
    
    setCow({
      position: 1, // Start in center
      speed: 0,
      distance: 0,
      element: React.createRef(),
      rotation: 0,
      bounceHeight: 0,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
    
    setObstacles([]);
  };
  
  const togglePause = () => {
    if (!gameState.isStarted || gameState.gameOver) return;
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };
  
  // Handle movement button clicks
  const moveLeft = () => {
    if (cow.position > 0 && gameState.isStarted && !gameState.gameOver && !gameState.isPaused) {
      setCow(prev => ({
        ...prev,
        position: prev.position - 1,
        rotation: -15
      }));
    }
  };
  
  const moveRight = () => {
    if (cow.position < 2 && gameState.isStarted && !gameState.gameOver && !gameState.isPaused) {
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
          <p className="text-gray-600">Race your cow through obstacles</p>
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
        <div className="flex-1 relative overflow-hidden border rounded-md" ref={gameContainerRef} 
             style={{
               perspective: '1000px',
               perspectiveOrigin: '50% 50%',
             }}>
          
          {/* Sky and ground */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-300 to-blue-600"></div>
          
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
              // Calculate visual position based on distance
              const zPos = 1 - (obstacle.distance - cow.distance) / 100;
              const scale = 0.5 + zPos * 0.5;
              const xPos = (obstacle.position - 1) * 33.3;
              
              const getObstacleStyle = () => {
                switch(obstacle.type) {
                  case 'rock':
                    return {
                      backgroundColor: '#8a8a8a',
                      borderRadius: '50%',
                      width: '30px',
                      height: '20px',
                    };
                  case 'fence':
                    return {
                      backgroundColor: '#ba8c63',
                      width: '40px',
                      height: '15px',
                      borderTop: '2px solid #6b4226',
                      borderBottom: '2px solid #6b4226',
                    };
                  case 'pond':
                    return {
                      backgroundColor: '#4a80bd',
                      borderRadius: '50%',
                      width: '35px',
                      height: '25px',
                    };
                }
              };
              
              return (
                <div 
                  key={index}
                  ref={obstacle.element}
                  className="absolute transform -translate-x-1/2"
                  style={{
                    left: `${50 + xPos}%`,
                    bottom: `${zPos * 100}%`,
                    transform: `scale(${scale})`,
                    zIndex: Math.floor(zPos * 100),
                    ...getObstacleStyle()
                  }}
                ></div>
              );
            })}
          </div>
          
          {/* The cow */}
          {gameState.isStarted && (
            <div
              ref={cow.element}
              className="absolute transform -translate-x-1/2"
              style={{
                left: `${50 + (cow.position - 1) * 33.3}%`,
                bottom: '20%',
                width: '40px',
                height: '30px',
                backgroundColor: cow.color,
                borderRadius: '50% 30% 40% 30%',
                transform: `rotateZ(${cow.rotation}deg) translateY(-${cow.bounceHeight}px)`,
                transition: 'left 0.2s ease-out',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              {/* Cow features */}
              <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white rounded-full"></div>
              <div className="absolute bottom-1/4 right-0 w-1/4 h-1/4 bg-black rounded-full"></div>
              <div className="absolute bottom-1/4 left-0 w-1/4 h-1/4 bg-black rounded-full"></div>
            </div>
          )}
          
          {/* Game overlay messages */}
          {!gameState.isStarted && !gameState.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-center p-4">
              <div>
                <h2 className="text-2xl font-bold mb-4">Crazy Cattle 3D</h2>
                <p className="mb-6">
                  Help your cow navigate through obstacles! <br />
                  Use arrow keys or buttons to move. <br />
                  Collect points and avoid hitting rocks, fences and ponds.
                </p>
                <Button onClick={startGame} size="lg">
                  Start Game
                </Button>
              </div>
            </div>
          )}
          
          {gameState.isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
                <Button onClick={togglePause} className="mx-2">Resume</Button>
                <Button variant="destructive" onClick={() => setGameState(prev => ({ ...prev, gameOver: true }))}>End Game</Button>
              </div>
            </div>
          )}
          
          {gameState.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-center p-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl mb-4">Your score: {gameState.score}</p>
                {gameState.score >= gameState.highScore && gameState.score > 0 && (
                  <p className="text-xl text-yellow-300 mb-4">New High Score!</p>
                )}
                <Button onClick={startGame} size="lg" className="mx-2">
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Leaderboard */}
        <div className="w-64 ml-4 border rounded-md p-4 hidden md:block">
          <h3 className="font-bold text-lg mb-2 text-center">Leaderboard</h3>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="font-bold mr-2 w-5 text-center">{index + 1}.</span>
                    <span className={user?.username === entry.username ? 'font-bold text-primary' : ''}>
                      {entry.username}
                    </span>
                  </div>
                  <span>{entry.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">No scores yet!</p>
          )}
        </div>
      </div>
      
      {/* Mobile controls */}
      {gameState.isStarted && !gameState.gameOver && (
        <div className="mt-4 flex justify-between">
          <div className="flex gap-2">
            <Button size="lg" onClick={moveLeft}>
              ⬅️ Left
            </Button>
            <Button size="lg" onClick={moveRight}>
              Right ➡️
            </Button>
          </div>
          <div>
            <Button 
              variant={gameState.isPaused ? "default" : "outline"}
              onClick={togglePause}
            >
              {gameState.isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Progress bar showing current speed */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Speed</span>
          <span>{Math.round(gameState.speed)} km/h</span>
        </div>
        <Progress value={(gameState.speed / 15) * 100} className="h-2" />
      </div>
      
      {/* Leaderboard for mobile */}
      <div className="mt-4 md:hidden">
        <h3 className="font-bold text-lg mb-2">Leaderboard</h3>
        {leaderboard.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {leaderboard.slice(0, 6).map((entry, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-center">
                <div className="font-bold">{index + 1}. {entry.username}</div>
                <div>{entry.score}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No scores yet!</p>
        )}
      </div>
      
      {/* Error dialog */}
      <ErrorMessage 
        show={error.show}
        onClose={() => setError({ show: false, message: '' })}
        message={error.message}
      />
    </div>
  );
}
