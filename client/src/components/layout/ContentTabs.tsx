import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SoundGrid } from "@/components/soundboard/SoundGrid";
import { CategoryTabs } from "@/components/soundboard/CategoryTabs";
import { Chat } from "@/components/chat/Chat";
import { useState } from "react";

export function ContentTabs() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <Tabs defaultValue="soundboard" className="w-full">
      <TabsList className="mb-4 grid grid-cols-2 w-full max-w-md mx-auto">
        <TabsTrigger value="soundboard">Soundboard</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
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
    </Tabs>
  );
}