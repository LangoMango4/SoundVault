import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type Player = 'X' | 'O' | null;
type BoardState = Player[];

interface GameData {
  wins: number;
  losses: number;
  draws: number;
  lastPlayed: string;
}

export function TicTacToe() {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [stats, setStats] = useState<GameData>({
    wins: 0,
    losses: 0,
    draws: 0,
    lastPlayed: new Date().toISOString(),
  });
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const { toast } = useToast();

  // Load game data from server
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const response = await fetch('/api/games/tictactoe');
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            setStats({
              wins: data.data.wins || 0,
              losses: data.data.losses || 0,
              draws: data.data.draws || 0,
              lastPlayed: data.lastPlayed || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };
    
    loadGameData();
  }, []);

  // Save game data to server
  const saveGameData = async (newStats: GameData) => {
    try {
      await apiRequest('POST', '/api/games/tictactoe/save', {
        data: {
          wins: newStats.wins,
          losses: newStats.losses,
          draws: newStats.draws,
        },
      });
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  };

  // Check for winner
  const calculateWinner = (squares: BoardState): Player | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // Check for a winner
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    // Check for a draw
    if (squares.every(square => square !== null)) {
      return 'draw';
    }

    return null;
  };

  // Computer move (simple AI)
  const computerMove = () => {
    if (winner || board.every(cell => cell !== null)) return;

    setIsThinking(true);

    // Add a slight delay to make it seem like the computer is thinking
    setTimeout(() => {
      const newBoard = [...board];
      
      // Try to win
      const winMove = findWinningMove(newBoard, 'O');
      if (winMove !== -1) {
        newBoard[winMove] = 'O';
        setBoard(newBoard);
        setIsThinking(false);
        setIsXNext(true);
        return;
      }
      
      // Block player's winning move
      const blockMove = findWinningMove(newBoard, 'X');
      if (blockMove !== -1) {
        newBoard[blockMove] = 'O';
        setBoard(newBoard);
        setIsThinking(false);
        setIsXNext(true);
        return;
      }
      
      // Take center if available
      if (newBoard[4] === null) {
        newBoard[4] = 'O';
        setBoard(newBoard);
        setIsThinking(false);
        setIsXNext(true);
        return;
      }
      
      // Take a corner if available
      const corners = [0, 2, 6, 8];
      const availableCorners = corners.filter(i => newBoard[i] === null);
      if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        newBoard[randomCorner] = 'O';
        setBoard(newBoard);
        setIsThinking(false);
        setIsXNext(true);
        return;
      }
      
      // Take any available move
      const availableMoves = newBoard.map((cell, i) => cell === null ? i : -1).filter(i => i !== -1);
      if (availableMoves.length > 0) {
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        newBoard[randomMove] = 'O';
      }
      
      setBoard(newBoard);
      setIsThinking(false);
      setIsXNext(true);
    }, 700); // 700ms delay for thinking
  };

  // Find a winning move for the given player
  const findWinningMove = (currentBoard: BoardState, player: Player): number => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const [a, b, c] of lines) {
      // Check if we can win in this line
      if (currentBoard[a] === player && currentBoard[b] === player && currentBoard[c] === null) {
        return c;
      }
      if (currentBoard[a] === player && currentBoard[c] === player && currentBoard[b] === null) {
        return b;
      }
      if (currentBoard[b] === player && currentBoard[c] === player && currentBoard[a] === null) {
        return a;
      }
    }

    return -1; // No winning move found
  };

  // Handle player's click
  const handleClick = (index: number) => {
    if (board[index] || winner || isThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
  };

  // Check for game end
  useEffect(() => {
    const gameWinner = calculateWinner(board);
    if (gameWinner) {
      setWinner(gameWinner);
      
      // Update stats
      const newStats = { ...stats };
      if (gameWinner === 'X') {
        newStats.wins += 1;
        toast({
          title: "Victory!",
          description: "You won the game!",
          duration: 3000,
        });
      } else if (gameWinner === 'O') {
        newStats.losses += 1;
      } else if (gameWinner === 'draw') {
        newStats.draws += 1;
      }
      
      newStats.lastPlayed = new Date().toISOString();
      setStats(newStats);
      saveGameData(newStats);
      return;
    }
    
    // Computer's turn
    if (!isXNext) {
      computerMove();
    }
  }, [board, isXNext]);

  // Reset the game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  // Render a square
  const renderSquare = (index: number) => {
    return (
      <button
        className={`w-20 h-20 text-4xl font-bold border border-gray-300 flex items-center justify-center transition-colors ${
          board[index] === 'X' 
            ? 'bg-blue-100 text-blue-700' 
            : board[index] === 'O' 
              ? 'bg-red-100 text-red-700' 
              : 'hover:bg-gray-50'
        }`}
        onClick={() => handleClick(index)}
        disabled={!!board[index] || !!winner || isThinking}
      >
        {board[index]}
      </button>
    );
  };

  // Game status message
  const getStatus = () => {
    if (winner === 'X') {
      return 'You won!';
    } else if (winner === 'O') {
      return 'Computer won!';
    } else if (winner === 'draw') {
      return 'Game ended in a draw!';
    } else if (isThinking) {
      return 'Computer is thinking...';
    } else {
      return isXNext ? 'Your turn' : 'Computer\'s turn';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Tic-Tac-Toe</h1>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-3 gap-1 mb-4">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
          </div>
          
          <div className="flex justify-between items-center w-full">
            <div className="text-lg font-medium mb-4">
              {getStatus()}
            </div>
            
            <Button 
              onClick={resetGame} 
              variant="outline"
              size="sm"
              className="mb-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> New Game
            </Button>
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-64 hidden md:block" />
        <Separator className="w-full md:hidden" />
        
        <Card className="p-4 w-full md:w-auto">
          <div className="flex items-center mb-3">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Game Stats</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Wins:</span>
              <span className="font-medium text-green-600">{stats.wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Losses:</span>
              <span className="font-medium text-red-600">{stats.losses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Draws:</span>
              <span className="font-medium">{stats.draws}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Games:</span>
              <span className="font-medium">{stats.wins + stats.losses + stats.draws}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Win Rate:</span>
              <span className="font-medium">
                {stats.wins + stats.losses + stats.draws > 0
                  ? `${Math.round((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Game saves automatically when completed.</p>
          </div>
        </Card>
      </div>
      
      <div className="mt-6 text-sm text-gray-600 max-w-md text-center">
        <p>You play as X, computer plays as O. Get three in a row to win!</p>
        <p className="mt-1">Click on an empty square to make your move.</p>
      </div>
    </div>
  );
}
