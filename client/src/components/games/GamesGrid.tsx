import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowLeftRight, Home } from "lucide-react";
// Import local games
import { DinoDash } from "./local-games/DinoDash";
import { MemoryMatch } from "./local-games/MemoryMatch";
import { CookieClicker } from "./local-games/CookieClicker";

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
  
  // Game library
  const games: Game[] = [
    // Google games (high reliability)
    {
      id: "google-snake",
      name: "Google Snake",
      url: "https://www.google.com/fbx?fbx=snake_arcade",
      category: "google",
      description: "Control a snake, eat food and grow longer without hitting walls or yourself."
    },
    {
      id: "google-pacman",
      name: "Google Pac-Man",
      url: "https://www.google.com/logos/2010/pacman10-i.html",
      category: "google",
      description: "Play the classic Pac-Man game from Google's interactive doodle."
    },
    {
      id: "google-dino",
      name: "Chrome Dino Game",
      url: "https://chromedino.com/",
      category: "google", 
      description: "Jump over cacti and dodge pterodactyls in Chrome's offline dinosaur game."
    },
    {
      id: "google-solitaire",
      name: "Google Solitaire",
      url: "https://www.google.com/logos/2016/solitaire/solitaire16.html",
      category: "google",
      description: "Play classic Solitaire card game right in your browser."
    },
    {
      id: "google-tic-tac-toe",
      name: "Google Tic-Tac-Toe",
      url: "https://www.google.com/search?q=tic+tac+toe",
      category: "google",
      description: "Play Tic-Tac-Toe against the computer with multiple difficulty levels."
    },
    {
      id: "google-minesweeper",
      name: "Google Minesweeper",
      url: "https://www.google.com/fbx?fbx=minesweeper",
      category: "google",
      description: "Clear the board without detonating any mines in this classic puzzle game."
    },
    {
      id: "google-pong",
      name: "Google Pong",
      url: "https://www.google.com/logos/2010/pong10-i.html",
      category: "google",
      description: "Play the classic Pong game from Google's interactive doodle."
    },
    {
      id: "google-piano",
      name: "Google Piano",
      url: "https://www.google.com/logos/2019/bach/r3/bach19.html",
      category: "google",
      description: "Play a virtual piano and learn about Bach with Google's interactive doodle."
    },
    
    // Local games (no URL issues - will always work, even with school filters)
    {
      id: "dino-dash",
      name: "Dino Dash",
      component: DinoDash,
      category: "local",
      description: "Jump over obstacles in this endless runner game (works offline).",
      isLocal: true
    },
    {
      id: "memory-match",
      name: "Memory Match",
      component: MemoryMatch,
      category: "local",
      description: "Match pairs of cards in this memory game (works offline).",
      isLocal: true
    },
    {
      id: "cookie-clicker",
      name: "Cookie Clicker",
      component: CookieClicker,
      category: "local",
      description: "Click cookies, buy upgrades, and become a cookie millionaire!",
      isLocal: true
    }
  ];

  // Extract unique categories and add the "local" category first
  const uniqueCategories = Array.from(new Set(games.map(game => game.category)));
  const categories = ["all", "local", ...uniqueCategories.filter(cat => cat !== "local")];
  
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
            {selectedCategory === "local" && (
              <div className="p-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                <p className="font-medium">Local games</p>
                <p>These games work directly from our server and will function even when school internet filters block external game sites.</p>
              </div>
            )}
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredGames.map(game => (
              <Card key={game.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{game.name}</h3>
                    <span className={`text-xs px-2 py-1 ${game.isLocal ? 'bg-green-100 text-green-800' : 'bg-primary/10'} rounded-full capitalize`}>
                      {game.isLocal ? 'Local' : game.category}
                    </span>
                  </div>
                  <p className="text-sm mb-4 flex-grow">{game.description}</p>
                  <Button 
                    onClick={() => playGame(game)} 
                    className="w-full"
                    variant={game.isLocal ? "secondary" : "default"}
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
              {activeGame.component && <activeGame.component />}
            </div>
          ) : (
            // Render external game in iframe
            <iframe
              src={activeGame.url}
              title={activeGame.name}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            ></iframe>
          )}
        </div>
      )}
    </div>
  );
}