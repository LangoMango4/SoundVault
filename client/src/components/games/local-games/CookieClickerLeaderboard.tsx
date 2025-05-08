import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Cookie } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  accessLevel: string;
}

interface LeaderboardEntry {
  id: number;
  userId: number;
  cookies: number;
  clickPower: number;
  autoClickers: number;
  grandmas: number;
  factories: number;
  background: string;
  lastUpdated: string;
  user: User;
}

export function CookieClickerLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const res = await apiRequest('GET', '/api/games/cookie-clicker/leaderboard');
      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await res.json();
      setLeaderboard(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch cookie clicker leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLeaderboard();

    // Set up auto-refresh every 3 seconds
    const intervalId = window.setInterval(fetchLeaderboard, 3000);

    // Clean up on unmount
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <Cookie className="w-5 h-5 mr-2 text-amber-500" />
            Cookie Clicker Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <Cookie className="w-5 h-5 mr-2 text-amber-500" />
            Cookie Clicker Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center">
          <Cookie className="w-5 h-5 mr-2 text-amber-500" />
          Cookie Clicker Leaderboard
        </CardTitle>
        <div className="text-xs text-muted-foreground mt-1">
          Updated: {lastUpdated}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-center py-6 text-sm">No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="divide-y flex-1 overflow-auto">
            {leaderboard.map((entry, i) => {
              let icon = null;
              let rowClass = "py-2 flex justify-between items-center";
              
              if (i === 0) {
                icon = <Trophy className="w-5 h-5 text-yellow-500" />;
                rowClass += " bg-yellow-50";
              }
              else if (i === 1) {
                icon = <Medal className="w-5 h-5 text-gray-400" />;
                rowClass += " bg-gray-50";
              }
              else if (i === 2) {
                icon = <Medal className="w-5 h-5 text-amber-700" />;
                rowClass += " bg-amber-50";
              }
              else icon = <Award className="w-4 h-4 text-blue-400" />;
              
              return (
                <div key={entry.id} className={rowClass}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6">{icon}</span>
                    <span className="text-sm font-medium">{entry.user?.username || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cookie className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-semibold">{formatNumber(entry.cookies || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}