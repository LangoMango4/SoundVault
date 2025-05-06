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
    <div className="p-6 border rounded-lg bg-white w-full shadow-md h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
        Leaderboard
      </h2>
      
      {leaderboard.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center py-6 text-lg">No scores yet. Be the first to play!</p>
        </div>
      ) : (
        <div className="divide-y flex-1 overflow-auto">
          {leaderboard.map((entry, i) => {
            let icon = null;
            let rowClass = "py-5 flex justify-between items-center";
            
            if (i === 0) {
              icon = <Trophy className="w-6 h-6 text-yellow-500" />;
              rowClass += " bg-yellow-50";
            }
            else if (i === 1) {
              icon = <Medal className="w-6 h-6 text-gray-400" />;
              rowClass += " bg-gray-50";
            }
            else if (i === 2) {
              icon = <Medal className="w-6 h-6 text-amber-700" />;
              rowClass += " bg-amber-50";
            }
            else icon = <Award className="w-5 h-5 text-blue-400" />;
            
            return (
              <div key={entry.id} className={rowClass}>
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-8 h-8">{icon}</span>
                  <span className="font-medium text-xl truncate max-w-[250px]">
                    {entry.fullName} 
                    <span className="text-sm text-gray-500 ml-1">({entry.username})</span>
                  </span>
                </div>
                <div className="font-bold text-2xl min-w-[140px] text-right">
                  {/* Direct rendering of number with proper formatting */}
                  {Number(entry.score).toFixed(entry.score % 1 === 0 ? 0 : 1)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t text-sm text-gray-500 flex justify-between items-center">
        <span>Updated every {refreshInterval / 1000}s</span>
        <button 
          onClick={fetchLeaderboard}
          className="text-blue-500 hover:underline font-medium flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M16 21h5v-5"></path>
          </svg>
          Refresh Now
        </button>
      </div>
    </div>
  );
}