import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Calculator, Clock, Trophy, RefreshCw, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GameData {
  id?: number;
  userId: number;
  highScore: number;
  gameType: string;
  data: any;
  lastPlayed: string;
}

interface PuzzleQuestion {
  question: string;
  answer: number;
  options?: number[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export function MathPuzzle() {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60); // 60 seconds game
  const [currentQuestion, setCurrentQuestion] = useState<PuzzleQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [difficultyLocked, setDifficultyLocked] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  const { toast } = useToast();

  // Load high score from the server
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const response = await fetch('/api/games/math-puzzle');
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
      await apiRequest('POST', '/api/games/math-puzzle/save', {
        highScore: newScore,
      });
      setHighScore(newScore);
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };

  // Generate a random math question based on difficulty
  const generateQuestion = useCallback((): PuzzleQuestion => {
    let question = '';
    let answer = 0;
    let options: number[] = [];
    
    // Generate question based on difficulty
    switch (difficulty) {
      case 'easy':
        // Simple addition or subtraction with small numbers
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operation = Math.random() > 0.5 ? '+' : '-';
        question = `${num1} ${operation} ${num2}`;
        answer = operation === '+' ? num1 + num2 : num1 - num2;
        break;
        
      case 'medium':
        // Multiplication, division, or mixed operations
        const op = Math.floor(Math.random() * 3);
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        
        if (op === 0) {
          // Multiplication
          question = `${a} × ${b}`;
          answer = a * b;
        } else if (op === 1) {
          // Division with no remainder
          const product = a * b;
          question = `${product} ÷ ${a}`;
          answer = b;
        } else {
          // Mixed addition and multiplication
          const c = Math.floor(Math.random() * 10) + 1;
          question = `${a} + ${b} × ${c}`;
          answer = a + (b * c);
        }
        break;
        
      case 'hard':
        // Complex expressions, powers, or equations
        const hardType = Math.floor(Math.random() * 3);
        
        if (hardType === 0) {
          // Complex expression
          const n1 = Math.floor(Math.random() * 20) + 5;
          const n2 = Math.floor(Math.random() * 10) + 1;
          const n3 = Math.floor(Math.random() * 15) + 5;
          question = `(${n1} + ${n2}) × ${n3} - ${n2}`;
          answer = (n1 + n2) * n3 - n2;
        } else if (hardType === 1) {
          // Square or cube
          const base = Math.floor(Math.random() * 10) + 2;
          const power = Math.random() > 0.5 ? 2 : 3;
          question = power === 2 
            ? `${base}²` 
            : `${base}³`;
          answer = Math.pow(base, power);
        } else {
          // Find the missing number
          const x = Math.floor(Math.random() * 10) + 1;
          const y = Math.floor(Math.random() * 20) + 10;
          const result = x * y;
          question = `If ${x} × ? = ${result}, what is the missing number?`;
          answer = y;
        }
        break;
    }
    
    // Generate wrong options for multiple choice
    const wrongAnswers = new Set<number>();
    const min = Math.max(1, answer - 10);
    const max = answer + 10;
    
    while (wrongAnswers.size < 3) {
      const wrong = Math.floor(Math.random() * (max - min + 1)) + min;
      if (wrong !== answer) {
        wrongAnswers.add(wrong);
      }
    }
    
    options = [...wrongAnswers, answer];
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    return { question, answer, options, difficulty };
  }, [difficulty]);

  // Start the game
  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameStarted(true);
    setGameOver(false);
    setDifficultyLocked(true);
    setCurrentQuestion(generateQuestion());
    setFeedback(null);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setUserAnswer('');
  };

  // Reset the game
  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setDifficultyLocked(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setUserAnswer('');
  };

  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (!currentQuestion || userAnswer.trim() === '') return;
    
    const numAnswer = parseFloat(userAnswer);
    const isCorrect = numAnswer === currentQuestion.answer;
    setTotalAnswered(prev => prev + 1);
    
    if (isCorrect) {
      // Calculate points based on difficulty and time left
      let points = 0;
      switch (currentQuestion.difficulty) {
        case 'easy':
          points = 10;
          break;
        case 'medium':
          points = 20;
          break;
        case 'hard':
          points = 30;
          break;
      }
      
      setScore(prevScore => prevScore + points);
      setCorrectAnswers(prev => prev + 1);
      setFeedback({ correct: true, message: `Correct! +${points} points` });
    } else {
      setFeedback({ 
        correct: false, 
        message: `Incorrect. The answer was ${currentQuestion.answer}.` 
      });
    }
    
    // Clear feedback after a short delay and show next question
    setTimeout(() => {
      setFeedback(null);
      setCurrentQuestion(generateQuestion());
      setUserAnswer('');
    }, 1500);
  };

  // Multiple choice answer selection
  const handleOptionSelect = (option: number) => {
    setUserAnswer(option.toString());
    setTimeout(() => {
      handleSubmitAnswer();
    }, 300); // Brief delay to show selection
  };

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          setGameOver(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [gameStarted, gameOver]);

  // Game over logic
  useEffect(() => {
    if (gameOver && gameStarted) {
      // Check if score is a new high score
      if (score > highScore) {
        saveHighScore(score);
        toast({
          title: "New High Score!",
          description: `Congratulations! You set a new high score of ${score} points!`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Game Over",
          description: `Your final score: ${score} points.`,
          duration: 3000,
        });
      }
    }
  }, [gameOver, gameStarted, highScore, score, toast]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Calculator className="w-6 h-6" /> 
        Math Challenge
      </h1>
      
      {!gameStarted ? (
        <Card className="w-full max-w-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Math Challenge!</h2>
          <p className="mb-4 text-gray-600">
            Test your math skills by solving as many problems as you can in 60 seconds.
            Choose your difficulty level below:
          </p>
          
          <div className="flex gap-3 justify-center mb-6">
            <Button 
              variant={difficulty === 'easy' ? 'default' : 'outline'}
              onClick={() => setDifficulty('easy')}
              disabled={difficultyLocked}
            >
              Easy
            </Button>
            <Button 
              variant={difficulty === 'medium' ? 'default' : 'outline'}
              onClick={() => setDifficulty('medium')}
              disabled={difficultyLocked}
            >
              Medium
            </Button>
            <Button 
              variant={difficulty === 'hard' ? 'default' : 'outline'}
              onClick={() => setDifficulty('hard')}
              disabled={difficultyLocked}
            >
              Hard
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={startGame} size="lg">
              Start Game
            </Button>
          </div>
        </Card>
      ) : (
        <div className="w-full max-w-lg">
          {/* Game stats bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Score: {score}</span>
            </div>
            
            <div className="flex gap-4">
              <span className="font-medium text-blue-600">Level: {difficulty}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-red-500" />
                <span className={`font-medium ${timeLeft < 10 ? 'text-red-600' : ''}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>
          
          {/* Time progress bar */}
          <Progress value={(timeLeft / 60) * 100} className="h-2 mb-6" />
          
          {gameOver ? (
            <Card className="p-6 text-center">
              <h2 className="text-xl font-bold mb-2">Game Over!</h2>
              <div className="mb-4">
                <p className="text-lg">Your score: <span className="font-bold text-primary">{score}</span></p>
                <p className="text-sm text-gray-600">High score: {highScore}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <Button onClick={startGame} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Button onClick={resetGame} variant="outline">
                  Change Difficulty
                </Button>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-gray-600">Correct Answers</p>
                  <p className="text-xl font-bold text-green-600">{correctAnswers}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-xl font-bold text-blue-600">
                    {totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0}%
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              {currentQuestion && (
                <div className="flex flex-col">
                  {/* Question display */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 mb-2">Solve this problem:</p>
                    <div className="text-2xl font-bold">{currentQuestion.question}</div>
                  </div>
                  
                  {/* Feedback */}
                  {feedback && (
                    <div className={`text-center mb-4 p-2 rounded-md ${
                      feedback.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        {feedback.correct && <ThumbsUp className="w-4 h-4" />}
                        {feedback.message}
                      </div>
                    </div>
                  )}
                  
                  {/* Answer input for easy/medium */}
                  {(difficulty === 'easy' || difficulty === 'medium') && !feedback && (
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          placeholder="Enter your answer" 
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                          autoFocus
                          className="text-lg"
                        />
                        <Button onClick={handleSubmitAnswer} disabled={!userAnswer.trim()}>
                          Submit
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Multiple choice for hard problems */}
                  {difficulty === 'hard' && !feedback && currentQuestion.options && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {currentQuestion.options.map((option, index) => (
                        <Button 
                          key={index}
                          variant="outline"
                          className="text-lg py-6"
                          onClick={() => handleOptionSelect(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600 max-w-md text-center">
        <p>Answer math questions as quickly as possible!</p>
        <p className="mt-1">Points awarded based on difficulty: Easy (10), Medium (20), Hard (30).</p>
      </div>
    </div>
  );
}
