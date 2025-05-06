import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Trophy } from "lucide-react";
import { LeaderboardComponent } from "../LeaderboardComponent";
import { useAuth } from "@/hooks/use-auth";

export function DinoDash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardRank, setLeaderboardRank] = useState<number | undefined>(undefined);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const { user } = useAuth();
  
  // Game state
  const gameState = useRef({
    dino: {
      x: 50,
      y: 0,
      width: 50,
      height: 50,
      jumping: false,
      velocity: 0,
      gravity: 0.5,
      jumpStrength: -10,
    },
    obstacles: [] as { x: number, y: number, width: number, height: number }[],
    ground: 0,
    speed: 5,
    obstacleTimer: 0,
    obstacleInterval: 60,
    score: 0,
    highScore: 0,
    animationFrame: 0,
  });

  // Initialize the game
  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 300;
    
    // Set ground level
    gameState.current.ground = canvas.height - 50;
    gameState.current.dino.y = gameState.current.ground - gameState.current.dino.height;
    
    // Setup keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameState.current.dino.jumping) {
        gameState.current.dino.jumping = true;
        gameState.current.dino.velocity = gameState.current.dino.jumpStrength;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Game loop
    let lastTimestamp = 0;
    
    const gameLoop = (timestamp: number) => {
      // Calculate delta time
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = '#ccc';
      ctx.fillRect(0, gameState.current.ground, canvas.width, 50);
      
      // Update dino position
      if (gameState.current.dino.jumping) {
        gameState.current.dino.velocity += gameState.current.dino.gravity;
        gameState.current.dino.y += gameState.current.dino.velocity;
        
        if (gameState.current.dino.y >= gameState.current.ground - gameState.current.dino.height) {
          gameState.current.dino.y = gameState.current.ground - gameState.current.dino.height;
          gameState.current.dino.jumping = false;
          gameState.current.dino.velocity = 0;
        }
      }
      
      // Draw dino
      ctx.fillStyle = '#333';
      ctx.fillRect(
        gameState.current.dino.x, 
        gameState.current.dino.y, 
        gameState.current.dino.width, 
        gameState.current.dino.height
      );
      
      // Spawn obstacles
      gameState.current.obstacleTimer++;
      
      if (gameState.current.obstacleTimer > gameState.current.obstacleInterval) {
        gameState.current.obstacleTimer = 0;
        gameState.current.obstacleInterval = Math.max(20, Math.floor(60 - gameState.current.score / 100));
        
        gameState.current.obstacles.push({
          x: canvas.width,
          y: gameState.current.ground - 30,
          width: 20 + Math.random() * 30,
          height: 30 + Math.random() * 20
        });
      }
      
      // Update and draw obstacles
      for (let i = gameState.current.obstacles.length - 1; i >= 0; i--) {
        const obstacle = gameState.current.obstacles[i];
        
        obstacle.x -= gameState.current.speed;
        
        if (obstacle.x + obstacle.width < 0) {
          gameState.current.obstacles.splice(i, 1);
          gameState.current.score++;
          setScore(gameState.current.score);
          
          // Increase speed
          if (gameState.current.score % 10 === 0) {
            gameState.current.speed += 0.5;
          }
          
          continue;
        }
        
        // Draw obstacle
        ctx.fillStyle = '#700';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Collision detection
        if (
          gameState.current.dino.x < obstacle.x + obstacle.width &&
          gameState.current.dino.x + gameState.current.dino.width > obstacle.x &&
          gameState.current.dino.y < obstacle.y + obstacle.height &&
          gameState.current.dino.y + gameState.current.dino.height > obstacle.y
        ) {
          // Game over
          if (gameState.current.score > gameState.current.highScore) {
            gameState.current.highScore = gameState.current.score;
          }
          
          setGameOver(true);
          return;
        }
      }
      
      // Draw score
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${gameState.current.score}`, 650, 30);
      ctx.fillText(`High Score: ${gameState.current.highScore}`, 650, 60);
      
      if (!gameOver) {
        gameState.current.animationFrame = requestAnimationFrame(gameLoop);
      }
    };
    
    gameState.current.animationFrame = requestAnimationFrame(gameLoop);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(gameState.current.animationFrame);
    };
  }, [gameStarted, gameOver]);
  
  const handleStartGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    gameState.current.score = 0;
    gameState.current.obstacles = [];
    gameState.current.speed = 5;
  };
  
  const handleRestartGame = () => {
    setGameOver(false);
    setScore(0);
    gameState.current.score = 0;
    gameState.current.obstacles = [];
    gameState.current.speed = 5;
  };
  
  // Submit score to leaderboard
  const submitScore = async () => {
    if (!user || isSubmittingScore || score <= 0) return;
    
    try {
      setIsSubmittingScore(true);
      const response = await fetch('/api/games/dino-dash/leaderboard/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: score,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboardRank(data.rank);
        setShowLeaderboard(true);
      } else {
        console.error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setIsSubmittingScore(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex justify-between items-center w-full max-w-3xl mb-4">
        <h1 className="text-2xl font-bold">Dino Dash</h1>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Dino Dash Leaderboard
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <LeaderboardComponent 
                gameId="dino-dash"
                currentScore={score}
                currentRank={leaderboardRank}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="relative border border-gray-300 bg-white">
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <h2 className="text-xl mb-4">Welcome to Dino Dash!</h2>
            <p className="mb-2">Press Space or Arrow Up to jump</p>
            <p className="mb-4">Avoid the obstacles and survive as long as possible</p>
            <Button onClick={handleStartGame}>Start Game</Button>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <h2 className="text-xl mb-2">Game Over!</h2>
            <p className="mb-4">Your score: {score}</p>
            <div className="flex gap-2">
              <Button onClick={handleRestartGame}>Play Again</Button>
              {user && score > 0 && (
                <Button 
                  variant="outline" 
                  onClick={submitScore} 
                  disabled={isSubmittingScore}
                >
                  {isSubmittingScore ? "Submitting..." : "Submit Score"}
                </Button>
              )}
            </div>
          </div>
        )}
        
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={300}
          style={{ display: 'block' }}
          onClick={() => {
            if (gameStarted && !gameState.current.dino.jumping) {
              gameState.current.dino.jumping = true;
              gameState.current.dino.velocity = gameState.current.dino.jumpStrength;
            }
          }}
        />
      </div>
      
      <div className="mt-4">
        <p className="text-center text-sm text-gray-600">
          Use Space, Arrow Up or click/tap to jump over obstacles.
        </p>
      </div>
    </div>
  );
}