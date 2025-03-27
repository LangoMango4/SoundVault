import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SoundGrid } from "@/components/soundboard/SoundGrid";
import { CategoryTabs } from "@/components/soundboard/CategoryTabs";
import { Chat } from "@/components/chat/Chat";
import { ChatLogs } from "@/components/chat/ChatLogs";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function ContentTabs() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Tabs defaultValue="soundboard" className="w-full">
      <TabsList className={`mb-4 grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} w-full max-w-md mx-auto`}>
        <TabsTrigger value="soundboard">Soundboard</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        {isAdmin && <TabsTrigger value="chatlogs">Chat Logs</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="soundboard" className="mt-0">
        <CategoryTabs 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <SoundGrid categorySlug={selectedCategory} />
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