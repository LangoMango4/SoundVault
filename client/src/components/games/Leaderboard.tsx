import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  score: number;
  gameType: string;
  lastPlayed: string;
}

interface LeaderboardProps {
  gameType: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  limit?: number;
}

export function Leaderboard({ 
  gameType, 
  autoRefresh = true, 
  refreshInterval = 5000, // Default to 5 seconds
  limit = 10
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const res = await apiRequest('GET', `/api/leaderboard/${gameType}?limit=${limit}`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLeaderboard();

    // Set up auto-refresh if enabled
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(fetchLeaderboard, refreshInterval);
    }

    // Clean up on unmount
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [gameType, autoRefresh, refreshInterval, limit]);

  if (loading) {
    return (
      <div className="p-4 border rounded-md bg-white">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Leaderboard
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-white">
        <h3 className="text-lg font-bold mb-2 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Leaderboard
        </h3>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-md bg-white">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
        Leaderboard
      </h3>
      
      {leaderboard.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No scores yet. Be the first to play!</p>
      ) : (
        <div className="divide-y">
          {leaderboard.map((entry, i) => {
            let icon = null;
            if (i === 0) icon = <Trophy className="w-4 h-4 text-yellow-500" />;
            else if (i === 1) icon = <Medal className="w-4 h-4 text-gray-400" />;
            else if (i === 2) icon = <Medal className="w-4 h-4 text-amber-700" />;
            else icon = <Award className="w-4 h-4 text-blue-400" />;
            
            return (
              <div key={entry.id} className="py-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6">{icon}</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {entry.fullName} 
                    <span className="text-xs text-gray-500 ml-1">({entry.username})</span>
                  </span>
                </div>
                <span className="font-bold">{entry.score.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-4 pt-2 border-t text-xs text-gray-500 flex justify-between items-center">
        <span>Updated every {refreshInterval / 1000}s</span>
        <button 
          onClick={fetchLeaderboard}
          className="text-blue-500 hover:underline"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
}