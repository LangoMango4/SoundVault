import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { CategoryTabs } from "@/components/soundboard/CategoryTabs";
import { SoundGrid } from "@/components/soundboard/SoundGrid";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  const handleOpenAdminPanel = () => {
    setIsAdminPanelOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header 
        onOpenAdminPanel={user?.role === "admin" ? handleOpenAdminPanel : undefined} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <CategoryTabs 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        
        <SoundGrid categorySlug={selectedCategory} />
      </main>
      
      <AdminPanel 
        open={isAdminPanelOpen} 
        onOpenChange={setIsAdminPanelOpen} 
      />
    </div>
  );
}
