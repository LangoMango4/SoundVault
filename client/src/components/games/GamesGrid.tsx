import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowLeftRight } from "lucide-react";

interface Game {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
}

export function GamesGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  
  // Game library
  const games: Game[] = [
    {
      id: "crazycattle3d",
      name: "Crazy Cattle 3D",
      url: "https://www.crazygames.com/game/crazy-runner-3d",
      category: "arcade",
      description: "Navigate through obstacles in this exciting 3D runner game!"
    },
    {
      id: "fnaf",
      name: "Five Nights at Freddy's",
      url: "https://www.crazygames.com/game/five-nights-at-freddys",
      category: "horror",
      description: "Can you survive five nights as a security guard at Freddy Fazbear's Pizza?"
    },
    {
      id: "slope",
      name: "Slope",
      url: "https://www.crazygames.com/game/slope",
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
      id: "among-us",
      name: "Among Us Clone",
      url: "https://www.crazygames.com/game/impostor",
      category: "multiplayer",
      description: "Find the impostor among your crewmates in this Among Us-inspired game."
    },
    {
      id: "basketball",
      name: "Basketball Stars",
      url: "https://www.crazygames.com/game/basketball-stars",
      category: "sports",
      description: "Play basketball in this multiplayer sports game."
    },
    {
      id: "tetris",
      name: "Tetris",
      url: "https://www.crazygames.com/game/tetris-cube",
      category: "puzzle",
      description: "The classic puzzle game - arrange falling blocks to create and clear lines."
    },
    {
      id: "2048",
      name: "2048",
      url: "https://www.crazygames.com/game/2048",
      category: "puzzle",
      description: "Combine the numbers to reach the 2048 tile in this addictive puzzle game."
    },
    {
      id: "flappy-bird",
      name: "Flappy Bird",
      url: "https://www.crazygames.com/game/flappy-bird",
      category: "arcade",
      description: "Navigate a bird through pipes without touching them in this addictive arcade game."
    },
    {
      id: "snake",
      name: "Snake",
      url: "https://www.crazygames.com/game/snake",
      category: "arcade",
      description: "Control a snake, eat food and grow longer without hitting walls or yourself."
    },
    {
      id: "parkour-block",
      name: "Parkour Block 3D",
      url: "https://www.crazygames.com/game/parkour-block-3d",
      category: "sandbox",
      description: "A 3D parkour game with block-style graphics similar to Minecraft."
    },
    {
      id: "wordle",
      name: "Wordle",
      url: "https://www.crazygames.com/game/words-wordle",
      category: "puzzle",
      description: "Guess the five-letter word in six tries with color-coded hints."
    }
  ];

  // Extract unique categories
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
              Close Game
            </Button>
          </div>
          <iframe
            src={activeGame.url}
            title={activeGame.name}
            className="w-full h-full border-0"
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
}