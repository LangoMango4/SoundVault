import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowLeftRight, Home } from "lucide-react";
// Import local games
import { DinoDash } from "./local-games/DinoDash";
import { MemoryMatch } from "./local-games/MemoryMatch";
import { CookieClicker } from "./local-games/CookieClicker";
import { WordScramble } from "./local-games/WordScramble";
import { SnakeGame } from "./local-games/SnakeGame";
import { TicTacToe } from "./local-games/TicTacToe";
import { MathPuzzle } from "./local-games/MathPuzzle";
import { ScratchGame } from "./local-games/ScratchGame";

// Component to track the current game for the online users list
interface OnlineUsersGameTrackerProps {
  children: ReactNode;
  gameName: string;
}

export function OnlineUsersGameTracker({ children, gameName }: OnlineUsersGameTrackerProps) {
  useEffect(() => {
    // Update online status with the current game name
    const updateOnlineStatus = async () => {
      try {
        await fetch(`/api/online-users?page=${encodeURIComponent(gameName)}`, {
          method: 'GET',
          credentials: 'include'
        });
      } catch (error) {
        console.error("Failed to update online status with game name:", error);
      }
    };
    
    // Update immediately and then on an interval
    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, [gameName]);
  
  return <>{children}</>;
}

interface Game {
  id: string;
  name: string;
  url?: string;
  component?: React.FC;
  category: string;
  description: string;
  isLocal?: boolean;
}

export function GamesGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  
  // Add page tracking when on the games grid with no active game
  useEffect(() => {
    if (!activeGame) {
      const updatePageStatus = async () => {
        try {
          await fetch(`/api/online-users?page=Games`, {
            method: 'GET',
            credentials: 'include'
          });
        } catch (error) {
          console.error("Failed to update status with Games page:", error);
        }
      };
      
      // Update immediately and then on an interval
      updatePageStatus();
      const interval = setInterval(updatePageStatus, 30000);
      
      return () => clearInterval(interval);
    }
  }, [activeGame]);
  
  // Game library - all local games that will work even with strict school filters
  const games: Game[] = [
    {
      id: "dino-dash",
      name: "Dino Dash",
      component: DinoDash,
      category: "arcade",
      description: "Jump over obstacles in this endless runner game (works offline).",
      isLocal: true
    },
    {
      id: "memory-match",
      name: "Memory Match",
      component: MemoryMatch,
      category: "puzzle",
      description: "Match pairs of cards in this memory game (works offline).",
      isLocal: true
    },
    {
      id: "cookie-clicker",
      name: "Cookie Clicker",
      component: CookieClicker,
      category: "idle",
      description: "Click cookies, buy upgrades, and become a cookie millionaire!",
      isLocal: true
    },
    {
      id: "word-scramble",
      name: "Word Scramble",
      component: WordScramble,
      category: "puzzle",
      description: "Unscramble school-related words against the clock.",
      isLocal: true
    },
    {
      id: "snake-game",
      name: "Snake Game",
      component: SnakeGame,
      category: "arcade",
      description: "Control a snake to eat food and grow without hitting walls or yourself.",
      isLocal: true
    },
    {
      id: "tic-tac-toe",
      name: "Tic-Tac-Toe",
      component: TicTacToe,
      category: "strategy",
      description: "Classic game of X's and O's against a computer opponent.",
      isLocal: true
    },
    {
      id: "math-puzzle",
      name: "Math Challenge",
      component: MathPuzzle,
      category: "educational",
      description: "Test your math skills with timed challenges at different difficulty levels.",
      isLocal: true
    },
    {
      id: "scratch-geometry",
      name: "Geometry Dash",
      component: ScratchGame,
      category: "arcade",
      description: "Jump and fly your way through obstacles in this rhythm-based Scratch game.",
      isLocal: true
    }
  ];

  // Extract unique categories for our filter tabs
  const uniqueCategories = Array.from(new Set(games.map(game => game.category)));
  const categories = ["all", ...uniqueCategories];
  
  // Filter games by selected category
  const filteredGames = selectedCategory === "all" 
    ? games 
    : games.filter(game => game.category === selectedCategory);

  const playGame = (game: Game) => {
    setActiveGame(game);
  };

  const closeGame = () => {
    setActiveGame(null);
    setFullscreen(false);
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  // Change document title when playing Google games
  useEffect(() => {
    if (activeGame && !activeGame.isLocal) {
      const originalTitle = document.title;
      document.title = "Maths - student@outlook.com - Outlook";
      
      return () => {
        document.title = originalTitle;
      };
    }
  }, [activeGame]);

  return (
    <div className="w-full">
      {!activeGame ? (
        <>
          <Tabs defaultValue="all" className="w-full mb-6">
            <TabsList className="mb-4 flex overflow-x-auto pb-2 justify-start">
              {categories.map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="p-3 mb-3 bg-green-50 border border-green-200 rounded-md text-sm">
              <p className="font-medium">School-safe Games</p>
              <p>All games work directly from our server and will function even when school internet filters block external game sites.</p>
            </div>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredGames.map(game => (
              <Card key={game.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{game.name}</h3>
                    <span className="text-xs px-2 py-1 bg-primary/10 rounded-full capitalize">
                      {game.category}
                    </span>
                  </div>
                  <p className="text-sm mb-4 flex-grow">{game.description}</p>
                  <Button 
                    onClick={() => playGame(game)} 
                    className="w-full"
                    variant="default"
                  >
                    <Gamepad2 className="w-4 h-4 mr-2" /> Play Game
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className={`relative ${fullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-[80vh]'}`}>
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <ArrowLeftRight className="w-4 h-4" />
              <span className="ml-2">{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={closeGame}>
              <Home className="w-4 h-4 mr-2" /> Back to Games
            </Button>
          </div>
          
          {activeGame.isLocal ? (
            // Render local game component
            <div className="w-full h-full p-4 bg-white overflow-y-auto">
              {/* Pass the game name to update online users tracking */}
              <OnlineUsersGameTracker gameName={activeGame.name}>
                {activeGame.component && <activeGame.component />}
              </OnlineUsersGameTracker>
            </div>
          ) : (
            // Render external game in iframe
            <iframe
              src={activeGame.url}
              title={activeGame.name}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              loading="eager"
            ></iframe>
          )}
        </div>
      )}
    </div>
  );
}