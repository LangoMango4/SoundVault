import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SoundGrid } from "@/components/soundboard/SoundGrid";
import { CategoryTabs } from "@/components/soundboard/CategoryTabs";
import { Chat } from "@/components/chat/Chat";
import { ChatLogs } from "@/components/chat/ChatLogs";
import { GamesGrid } from "@/components/games/GamesGrid";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Gamepad2 } from "lucide-react";

type ContentTabsProps = {
  initialTab?: string;
};

export function ContentTabs({ initialTab = "soundboard" }: ContentTabsProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Tabs defaultValue={initialTab} className="w-full">
      <TabsList className={`mb-4 grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} w-full max-w-md mx-auto`}>
        <TabsTrigger value="soundboard">Soundboard</TabsTrigger>
        <TabsTrigger value="games">
          <Gamepad2 className="w-4 h-4 mr-1 inline-block" /> 
          Games
        </TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        {isAdmin && <TabsTrigger value="chatlogs">Chat Logs</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="soundboard" className="mt-0">
        <SoundGrid categorySlug="all" />
      </TabsContent>
      
      <TabsContent value="games" className="mt-0">
        <GamesGrid />
      </TabsContent>
      
      <TabsContent value="chat" className="mt-0">
        <Chat />
      </TabsContent>
      
      {isAdmin && (
        <TabsContent value="chatlogs" className="mt-0">
          <ChatLogs />
        </TabsContent>
      )}
    </Tabs>
  );
}