import { ReactNode, useState } from "react";
import { OnlineUsersList } from "@/components/online-users";
import { Button } from "@/components/ui/button";
import { Users, X } from "lucide-react";

interface GlobalLayoutProps {
  children: ReactNode;
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen relative">
      {/* Main content area */}
      <div className="flex-1 p-4">
        {children}
      </div>
      
      {/* Mobile users button (visible only on small screens) */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-md md:hidden"
        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
      >
        <Users className="h-5 w-5" />
      </Button>
      
      {/* Online users sidebar - fixed on all pages */}
      <div className={`
        fixed md:relative inset-y-0 right-0 w-64 border-l border-border bg-card p-4 shadow-md 
        transition-transform duration-300 ease-in-out z-40
        ${showMobileSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        {showMobileSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <h2 className="text-xl font-semibold mb-4">Online Users</h2>
        <OnlineUsersList currentPage="Global" maxHeight="calc(100vh - 6rem)" />
      </div>
    </div>
  );
}