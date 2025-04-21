import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowLeftRight, Home } from "lucide-react";
// Import local games
import { DinoDash } from "./local-games/DinoDash";
import { MemoryMatch } from "./local-games/MemoryMatch";

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
    // Online games
    {
      id: "subway-surfers",
      name: "Subway Surfers",
      url: "https://subway-surfers.io/",
      category: "arcade",
      description: "Run as fast as you can through the subway while avoiding obstacles!"
    },
    {
      id: "fnaf",
      name: "Five Nights at Freddy's",
      url: "https://wellgames.com/html5/fnaf/",
      category: "horror",
      description: "Can you survive five nights as a security guard at Freddy Fazbear's Pizza?"
    },
    {
      id: "slope",
      name: "Slope",
      url: "https://slope-game.io/",
      category: "arcade",
      description: "Roll down a randomized slope in this fast-paced arcade game."
    },
    {
      id: "minecraft",
      name: "Minecraft Classic",
      url: "https://classic.minecraft.net/",
      category: "sandbox",
      description: "Play the classic version of the popular sandbox game."
    },
    {
      id: "krunker",
      name: "Krunker",
      url: "https://krunker.io/",
      category: "multiplayer",
      description: "Fast-paced multiplayer action game with customizable characters."
    },
    {
      id: "basketball",
      name: "Basketball Stars",
      url: "https://www.silvergames.com/en/basketball-stars",
      category: "sports",
      description: "Play basketball in this multiplayer sports game."
    },
    {
      id: "tetris",
      name: "Tetris",
      url: "https://www.silvergames.com/en/tetrix",
      category: "puzzle",
      description: "The classic puzzle game - arrange falling blocks to create and clear lines."
    },
    {
      id: "2048",
      name: "2048",
      url: "https://play2048.co/",
      category: "puzzle",
      description: "Combine the numbers to reach the 2048 tile in this addictive puzzle game."
    },
    {
      id: "flappy-bird",
      name: "Flappy Bird",
      url: "https://flappybird.ee/",
      category: "arcade",
      description: "Navigate a bird through pipes without touching them in this addictive arcade game."
    },
    {
      id: "snake",
      name: "Snake",
      url: "https://www.google.com/fbx?fbx=snake_arcade",
      category: "arcade",
      description: "Control a snake, eat food and grow longer without hitting walls or yourself."
    },
    {
      id: "geometry-dash",
      name: "Geometry Dash",
      url: "https://geometrydash.io/",
      category: "arcade",
      description: "Jump and fly your way through danger in this rhythm-based platformer."
    },
    {
      id: "wordle",
      name: "Wordle",
      url: "https://wordlegame.org/",
      category: "puzzle",
      description: "Guess the five-letter word in six tries with color-coded hints."
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