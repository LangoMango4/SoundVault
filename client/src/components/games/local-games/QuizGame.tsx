import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

// Collection of math and general knowledge questions
const questions: Question[] = [
  {
    question: "What is the value of π (pi) to two decimal places?",
    options: ["3.14", "3.16", "3.12", "3.18"],
    correctAnswer: 0,
  },
  {
    question: "If you have a right-angled triangle with sides 3 and 4, what is the length of the hypotenuse?",
    options: ["5", "7", "6", "8"],
    correctAnswer: 0,
  },
  {
    question: "What is the formula for the area of a circle?",
    options: ["πr²", "2πr", "πr³", "2πr²"],
    correctAnswer: 0,
  },
  {
    question: "Which of these is not a prime number?",
    options: ["17", "19", "21", "23"],
    correctAnswer: 2,
  },
  {
    question: "What is the result of 7 × 8?",
    options: ["54", "56", "64", "49"],
    correctAnswer: 1,
  },
  {
    question: "What is the value of 5² - 2²?",
    options: ["21", "25", "29", "9"],
    correctAnswer: 0,
  },
  {
    question: "Which of the following fractions is equivalent to 0.75?",
    options: ["3/4", "2/3", "1/2", "4/5"],
    correctAnswer: 0,
  },
  {
    question: "What is the next number in the sequence: 2, 4, 8, 16, ...?",
    options: ["20", "24", "32", "64"],
    correctAnswer: 2,
  },
  {
    question: "What is 25% of 80?",
    options: ["20", "40", "15", "25"],
    correctAnswer: 0,
  },
  {
    question: "If the perimeter of a square is 24 cm, what is its area?",
    options: ["36 cm²", "16 cm²", "64 cm²", "48 cm²"],
    correctAnswer: 0,
  },
];

export function QuizGame() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(15);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();

  // Reset quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setGameOver(false);
    setTimer(15);
    setIsAnswered(false);
  };

  // Shuffle questions on game start
  useEffect(() => {
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    // We don't need to set state here as we're just using the shuffled array in-place
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameOver || isAnswered) return;

    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          if (!isAnswered) {
            handleAnswer(-1); // Timed out
          }
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, isAnswered, gameOver]);

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    setSelectedOption(optionIndex);

    const currentQuestion = questions[currentQuestionIndex];
    
    if (optionIndex === currentQuestion.correctAnswer) {
      setScore((prevScore) => prevScore + 1);
      toast({
        title: "Correct!",
        description: "Well done, that's the right answer!",
        variant: "default",
      });
    } else {
      const correctAnswer = currentQuestion.options[currentQuestion.correctAnswer];
      toast({
        title: "Wrong answer",
        description: `The correct answer is: ${correctAnswer}`,
        variant: "destructive",
      });
    }

    // Move to next question after 2 seconds
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setTimer(15);
      } else {
        setGameOver(true);
      }
    }, 2000);
  };

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Math Quiz Challenge</h1>
      
      {!gameOver ? (
        <>
          <div className="w-full mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
              <span className={`font-bold ${timer <= 5 ? "text-red-500" : "text-gray-700"}`}>
                {timer} seconds
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <Card className="w-full mb-6">
            <CardContent className="pt-6">
              <h2 className="text-xl font-medium mb-4">{currentQuestion.question}</h2>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="w-full justify-start h-auto py-3 px-4 text-left"
                    variant={
                      selectedOption === null
                        ? "outline"
                        : selectedOption === index
                        ? index === currentQuestion.correctAnswer
                          ? "secondary"
                          : "destructive"
                        : index === currentQuestion.correctAnswer && isAnswered
                        ? "secondary"
                        : "outline"
                    }
                    disabled={isAnswered}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                    <span className="ml-2">{option}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p>Current Score: {score}/{currentQuestionIndex + (isAnswered ? 1 : 0)}</p>
          </div>
        </>
      ) : (
        <div className="text-center space-y-6 p-8">
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="text-xl">
            Your final score: {score}/{questions.length}
          </p>
          <div className="mt-4">
            {score === questions.length ? (
              <p className="text-green-600 font-bold">Perfect score! Amazing job!</p>
            ) : score >= questions.length * 0.7 ? (
              <p className="text-green-600">Great job! You really know your math!</p>
            ) : score >= questions.length * 0.5 ? (
              <p className="text-yellow-600">Good effort! Keep practicing!</p>
            ) : (
              <p className="text-red-600">Need some more practice? Keep trying!</p>
            )}
          </div>
          <Button onClick={resetQuiz} size="lg" className="mt-6">
            Play Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default QuizGame;