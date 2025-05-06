import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

interface GameState {
  id?: number;
  userId: number;
  highScore: number;
  gameType: string;
  data: any;
  lastPlayed: string;
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  // Game settings
  const canvasSize = { width: 400, height: 400 };
  const gridSize = 20;
  const initialSnake = [
    { x: 5 * gridSize, y: 5 * gridSize },
    { x: 4 * gridSize, y: 5 * gridSize },
    { x: 3 * gridSize, y: 5 * gridSize },
  ];
  
  // Game state managed with refs to avoid rerenders during game loop
  const snakeRef = useRef<Position[]>(initialSnake);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Position>({ x: 0, y: 0 });
  const speedRef = useRef<number>(150); // milliseconds per move
  const gameLoopRef = useRef<number | null>(null);
  
  // Load high score from the server
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const response = await fetch('/api/games/snake');
        if (response.ok) {
          const data = await response.json();
          if (data && data.highScore !== undefined) {
            setHighScore(data.highScore);
          }
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };
    
    loadGameData();
  }, []);
  
  // Save high score to the server
  const saveHighScore = async (newScore: number) => {
    if (newScore <= highScore) return;
    
    try {
      await apiRequest('POST', '/api/games/snake/save', {
        highScore: newScore,
      });
      setHighScore(newScore);
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };
  
  // Place food at random position
  const placeFood = useCallback(() => {
    const maxX = canvasSize.width / gridSize - 1;
    const maxY = canvasSize.height / gridSize - 1;
    
    // Generate random position
    let newFoodPos: Position;
    do {
      newFoodPos = {
        x: Math.floor(Math.random() * maxX) * gridSize,
        y: Math.floor(Math.random() * maxY) * gridSize
      };
      // Check if the food position overlaps with the snake
    } while (snakeRef.current.some(segment => 
      segment.x === newFoodPos.x && segment.y === newFoodPos.y
    ));
    
    foodRef.current = newFoodPos;
  }, [canvasSize.height, canvasSize.width, gridSize]);
  
  // Draw game on canvas
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw grid (light)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x < canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
    
    // Draw food
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
      foodRef.current.x + gridSize / 2,
      foodRef.current.y + gridSize / 2,
      gridSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw snake
    snakeRef.current.forEach((segment, index) => {
      // Head is darker
      ctx.fillStyle = index === 0 ? '#2E8B57' : '#3CB371';
      
      // Draw rounded snake segment
      ctx.beginPath();
      ctx.roundRect(
        segment.x,
        segment.y,
        gridSize,
        gridSize,
        index === 0 ? 8 : 5 // Head is more rounded
      );
      ctx.fill();
      
      // Draw eyes on head
      if (index === 0) {
        ctx.fillStyle = '#fff';
        
        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        const eyeOffset = 5;
        const eyeSize = 3;
        
        switch(directionRef.current) {
          case 'UP':
            leftEyeX = segment.x + eyeOffset;
            leftEyeY = segment.y + eyeOffset;
            rightEyeX = segment.x + gridSize - eyeOffset - eyeSize;
            rightEyeY = segment.y + eyeOffset;
            break;
          case 'DOWN':
            leftEyeX = segment.x + eyeOffset;
            leftEyeY = segment.y + gridSize - eyeOffset - eyeSize;
            rightEyeX = segment.x + gridSize - eyeOffset - eyeSize;
            rightEyeY = segment.y + gridSize - eyeOffset - eyeSize;
            break;
          case 'LEFT':
            leftEyeX = segment.x + eyeOffset;
            leftEyeY = segment.y + eyeOffset;
            rightEyeX = segment.x + eyeOffset;
            rightEyeY = segment.y + gridSize - eyeOffset - eyeSize;
            break;
          case 'RIGHT':
            leftEyeX = segment.x + gridSize - eyeOffset - eyeSize;
            leftEyeY = segment.y + eyeOffset;
            rightEyeX = segment.x + gridSize - eyeOffset - eyeSize;
            rightEyeY = segment.y + gridSize - eyeOffset - eyeSize;
            break;
        }
        
        ctx.beginPath();
        ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
        ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
      }
    });
    
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 25);
    ctx.fillText(`High Score: ${highScore}`, 10, 50);
    
    // Draw game over or paused text
    if (gameOver || isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        gameOver ? 'Game Over' : 'Paused',
        canvasSize.width / 2,
        canvasSize.height / 2
      );
      ctx.font = '16px sans-serif';
      ctx.fillText(
        gameOver 
          ? `Final Score: ${score}` 
          : 'Press Space to Resume',
        canvasSize.width / 2,
        canvasSize.height / 2 + 30
      );
    }
  }, [canvasSize.height, canvasSize.width, gameOver, gridSize, highScore, isPaused, score]);
  
  // Game loop
  const gameLoop = useCallback(() => {
    if (gameOver || isPaused) return;
    
    // Update snake position
    const head = { ...snakeRef.current[0] };
    directionRef.current = nextDirectionRef.current;
    
    // Move based on direction
    switch (directionRef.current) {
      case 'UP':
        head.y -= gridSize;
        break;
      case 'DOWN':
        head.y += gridSize;
        break;
      case 'LEFT':
        head.x -= gridSize;
        break;
      case 'RIGHT':
        head.x += gridSize;
        break;
    }
    
    // Check collisions with walls
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= canvasSize.width ||
      head.y >= canvasSize.height
    ) {
      handleGameOver();
      return;
    }
    
    // Check self-collision
    if (snakeRef.current.some(segment => segment.x === head.x && segment.y === head.y)) {
      handleGameOver();
      return;
    }
    
    // Add new head
    const newSnake = [head, ...snakeRef.current];
    
    // Check if snake ate food
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      // Increase score
      const newScore = score + 10;
      setScore(newScore);
      
      // Place new food
      placeFood();
      
      // Increase speed slightly
      speedRef.current = Math.max(speedRef.current - 2, 70);
    } else {
      // Remove tail if no food eaten
      newSnake.pop();
    }
    
    // Update snake
    snakeRef.current = newSnake;
    
    // Draw game
    drawGame();
    
    // Schedule next frame
    gameLoopRef.current = window.setTimeout(gameLoop, speedRef.current);
  }, [canvasSize.height, canvasSize.width, drawGame, gameOver, gridSize, handleGameOver, isPaused, placeFood, score]);
  
  // Handle game over
  function handleGameOver() {
    setGameOver(true);
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    
    if (score > highScore) {
      saveHighScore(score);
      toast({
        title: "New High Score!",
        description: `You set a new high score of ${score} points!`,
        duration: 5000,
      });
    }
  }
  
  // Start game
  const startGame = useCallback(() => {
    // Reset game state
    snakeRef.current = [...initialSnake];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    speedRef.current = 150;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    
    // Place initial food
    placeFood();
    
    // Start game loop
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    setGameStarted(true);
    gameLoopRef.current = window.setTimeout(gameLoop, speedRef.current);
  }, [gameLoop, placeFood]);
  
  // Reset game
  const resetGame = () => {
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    setGameStarted(false);
    setGameOver(true);
  };
  
  // Pause/resume game
  const togglePause = () => {
    if (gameOver) return;
    
    if (isPaused) {
      setIsPaused(false);
      gameLoopRef.current = window.setTimeout(gameLoop, speedRef.current);
    } else {
      setIsPaused(true);
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
      drawGame(); // Redraw to show paused state
    }
  };
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) {
        if (e.code === 'Space' || e.code === 'Enter') {
          startGame();
        }
        return;
      }
      
      if (gameOver) {
        if (e.code === 'Space' || e.code === 'Enter') {
          startGame();
        }
        return;
      }
      
      if (e.code === 'Space') {
        togglePause();
        return;
      }
      
      if (isPaused) return;
      
      // Prevent snake from reversing direction (can't go directly opposite)
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'KeyA':
          if (directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameStarted, isPaused, startGame]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, []);
  
  // For mobile controls
  const handleDirectionButton = (direction: Direction) => {
    if (gameOver || isPaused || !gameStarted) return;
    
    // Same logic as keyboard, prevent reversing
    switch (direction) {
      case 'UP':
        if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
        break;
      case 'DOWN':
        if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
        break;
      case 'LEFT':
        if (directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
        break;
      case 'RIGHT':
        if (directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
        break;
    }
  };
  
  // Initial canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Draw initial screen
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw welcome screen
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x < canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
    
    // Draw welcome text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Snake Game', canvasSize.width / 2, canvasSize.height / 2 - 30);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press Space or click Start to begin', canvasSize.width / 2, canvasSize.height / 2 + 10);
    ctx.fillText('Use Arrow Keys or WASD to move', canvasSize.width / 2, canvasSize.height / 2 + 40);
  }, [canvasSize.height, canvasSize.width, gridSize]);
  
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Snake Game</h1>
      
      <div className="relative mb-4">
        <canvas 
          ref={canvasRef} 
          className="border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex justify-center gap-2">
          {!gameStarted ? (
            <Button onClick={startGame}>Start Game</Button>
          ) : (
            <>
              <Button onClick={togglePause} variant="outline">
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button onClick={resetGame} variant="destructive">
                <RefreshCw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </>
          )}
        </div>
        
        {/* Mobile controls */}
        <Card className="mt-4 p-4">
          <div className="grid grid-cols-3 gap-2 justify-items-center">
            <div></div>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => handleDirectionButton('UP')}
              disabled={!gameStarted || gameOver}
            >
              <ArrowUp />
            </Button>
            <div></div>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => handleDirectionButton('LEFT')}
              disabled={!gameStarted || gameOver}
            >
              <ArrowLeft />
            </Button>
            <div></div>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => handleDirectionButton('RIGHT')}
              disabled={!gameStarted || gameOver}
            >
              <ArrowRight />
            </Button>
            
            <div></div>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => handleDirectionButton('DOWN')}
              disabled={!gameStarted || gameOver}
            >
              <ArrowDown />
            </Button>
            <div></div>
          </div>
        </Card>
        
        <div className="text-sm text-gray-600 mt-2 text-center">
          <p>Use arrow keys, WASD, or the on-screen controls to move.</p>
          <p>Press Space to pause/resume the game.</p>
        </div>
      </div>
    </div>
  );
}
