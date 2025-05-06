import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { Leaderboard } from "../Leaderboard";

// Words related to math, school, and general knowledge
const words = [
  { word: "MATHEMATICS", hint: "The study of numbers, shapes, and patterns" },
  { word: "ALGEBRA", hint: "Branch of mathematics with letters and symbols" },
  { word: "GEOMETRY", hint: "Mathematics of shapes, sizes and positions" },
  { word: "FRACTION", hint: "A numerical quantity that is not a whole number" },
  { word: "EQUATION", hint: "Mathematical statement with an equals sign" },
  { word: "POLYGON", hint: "A closed figure with straight sides" },
  { word: "DENOMINATOR", hint: "The bottom number in a fraction" },
  { word: "CALCULATION", hint: "Process of working out an answer" },
  { word: "DIVISION", hint: "Mathematical operation using the ÷ symbol" },
  { word: "MULTIPLICATION", hint: "Mathematical operation using the × symbol" },
];

export function WordScramble() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);
  const [hint, setHint] = useState(false);
  const [saveHighScoreFailed, setSaveHighScoreFailed] = useState(false);
  const { toast } = useToast();

  const scrambleWord = (word: string) => {
    const wordArray = word.split("");
    for (let i = wordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordArray[i], wordArray[j]] = [wordArray[j], wordArray[i]];
    }
    return wordArray.join("");
  };

  // Function to save high score to the database
  const saveHighScore = async (finalScore: number) => {
    try {
      // Prepare game data with score
      const gameData = {
        gameType: 'word-scramble',
        data: { wordCount: words.length, correctWords: finalScore },
        highScore: finalScore
      };

      // Send to API
      const response = await apiRequest('POST', '/api/games/word-scramble/save', gameData);
      if (!response.ok) {
        throw new Error('Failed to save high score');
      }
      
      // Success message
      toast({
        title: 'High Score Saved!',
        description: `Your score of ${finalScore} has been recorded.`,
      });
    } catch (error) {
      console.error('Error saving high score:', error);
      setSaveHighScoreFailed(true);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save your high score. Try again later.',
      });
    }
  };
  
  useEffect(() => {
    // Shuffle the words array
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    // Initialize the first word
    const word = shuffledWords[0].word;
    setScrambledWord(scrambleWord(word));
  }, []);

  useEffect(() => {
    if (!gameActive) return;

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          checkAnswer(true); // Force check with timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [currentWordIndex, gameActive]);

  const checkAnswer = (isTimeout = false) => {
    const currentWord = words[currentWordIndex].word;
    
    if (isTimeout) {
      toast({
        variant: "destructive",
        title: "Time's up!",
        description: `The correct word was: ${currentWord}`,
      });
    } else if (userInput.toUpperCase() === currentWord) {
      toast({
        title: "Correct!",
        description: "Well done!",
      });
      setScore((prev) => prev + 1);
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect!",
        description: `The correct word was: ${currentWord}`,
      });
    }

    // Move to next word or end game
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setUserInput("");
      setTimeLeft(30);
      setHint(false);
      
      // Set the next scrambled word
      const nextWord = words[currentWordIndex + 1].word;
      setScrambledWord(scrambleWord(nextWord));
    } else {
      setGameActive(false);
      
      // Save high score to the database
      saveHighScore(score);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      checkAnswer();
    }
  };

  const showHint = () => {
    setHint(true);
    setTimeLeft((prev) => Math.max(prev - 5, 1)); // Reduce time as penalty
    toast({
      title: "Hint used",
      description: "5 seconds deducted as penalty!",
      variant: "destructive",
    });
  };

  const resetGame = () => {
    // Shuffle the words array
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    setCurrentWordIndex(0);
    setScore(0);
    setTimeLeft(30);
    setUserInput("");
    setHint(false);
    setGameActive(true);
    
    // Set the first scrambled word
    const word = shuffledWords[0].word;
    setScrambledWord(scrambleWord(word));
  };

  const progressPercent = Math.round(((currentWordIndex) / words.length) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Game column */}
      <div className="lg:col-span-3">
        <h1 className="text-3xl font-bold text-center mb-2">Word Scramble</h1>
        <p className="text-center mb-6">Unscramble the word before time runs out!</p>

        {gameActive ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <div>Word {currentWordIndex + 1} of {words.length}</div>
              <div className={`font-semibold ${timeLeft <= 10 ? "text-red-500" : ""}`}>
                Time: {timeLeft}s
              </div>
            </div>
            <Progress value={progressPercent} className="h-2 mb-6" />

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold tracking-widest scrambled-word mb-3">
                    {scrambledWord}
                  </div>
                  {hint && (
                    <div className="bg-yellow-50 p-3 rounded-md text-sm border border-yellow-200">
                      <span className="font-semibold">Hint:</span> {words[currentWordIndex].hint}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter your answer..."
                    value={userInput}
                    onChange={handleInputChange}
                    className="text-center"
                    autoFocus
                    autoComplete="off"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={showHint}
                      disabled={hint}
                      className="flex-1"
                    >
                      Hint (-5s)
                    </Button>
                    <Button type="submit" className="flex-1">
                      Submit
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center">
              <p>Score: {score}/{currentWordIndex}</p>
            </div>
          </>
        ) : (
          <div className="text-center bg-slate-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-6">
              Final Score: {score}/{words.length}
            </p>
            {score === words.length ? (
              <p className="mb-4 text-green-600">Perfect! You're a word master!</p>
            ) : score >= words.length / 2 ? (
              <p className="mb-4 text-green-600">Well done! That's a good score!</p>
            ) : (
              <p className="mb-4 text-orange-600">Keep practicing! You'll get better!</p>
            )}
            <Button onClick={resetGame} size="lg">
              Play Again
            </Button>
            {saveHighScoreFailed && (
              <div className="mt-4 text-red-500">
                <p>Failed to save score. Try again later.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Leaderboard column */}
      <div className="lg:col-span-1">
        <Leaderboard gameType="word-scramble" autoRefresh={true} refreshInterval={5000} />
      </div>
    </div>
  );
}

export default WordScramble;
