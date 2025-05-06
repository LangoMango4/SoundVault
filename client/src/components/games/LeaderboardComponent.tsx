import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Medal, Trophy, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  id: number;
  userId: number;
  highScore: number;
  lastPlayed: string;
  user?: {
    username: string;
    fullName?: string;
  };
}

interface LeaderboardProps {
  gameId: string;
  currentScore?: number;
  currentRank?: number;
  onClose?: () => void;
  className?: string;
}

export function LeaderboardComponent({ gameId, currentScore, currentRank, className = "" }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"all" | "friends">("all");
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/games/${gameId}/leaderboard`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }
        
        const data = await response.json();
        setLeaderboard(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Unable to load leaderboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [gameId]);
  
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Trophy className="w-3 h-3 mr-1" /> 1st</Badge>;
    } else if (rank === 2) {
      return <Badge className="bg-slate-400 hover:bg-slate-500"><Medal className="w-3 h-3 mr-1" /> 2nd</Badge>;
    } else if (rank === 3) {
      return <Badge className="bg-amber-700 hover:bg-amber-800"><Medal className="w-3 h-3 mr-1" /> 3rd</Badge>;
    }
    return <Badge variant="outline">{rank}th</Badge>;
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> 
            Leaderboard
          </span>
          <Tabs defaultValue="all" className="h-8">
            <TabsList className="h-8">
              <TabsTrigger 
                value="all" 
                onClick={() => setView("all")}
                className="text-xs px-2 h-8"
              >
                All Players
              </TabsTrigger>
              <TabsTrigger 
                value="friends" 
                onClick={() => setView("friends")}
                className="text-xs px-2 h-8"
              >
                You
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          // Loading skeleton
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[50px] ml-auto" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-4 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          // Leaderboard data
          <Table>
            <TableCaption>Top scores for this game.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right w-32">Last Played</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No scores recorded yet. Be the first to set a high score!
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry, index) => (
                  <TableRow key={entry.id} className={currentRank === index + 1 ? "bg-primary/10" : ""}>
                    <TableCell className="font-medium">{renderRankBadge(index + 1)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        {entry.user?.username || `Player #${entry.userId}`}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {entry.highScore.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center justify-end">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(entry.lastPlayed).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              {/* Current user's score if not in top ranks */}
              {currentScore !== undefined && currentRank !== undefined && currentRank > leaderboard.length && (
                <TableRow className="bg-primary/10 border-t-2">
                  <TableCell className="font-medium">{renderRankBadge(currentRank)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-primary" />
                      You
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {currentScore.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1" />
                      Just now
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
