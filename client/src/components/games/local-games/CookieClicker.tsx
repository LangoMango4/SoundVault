import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Crown, Bug, Sparkles, GiftIcon } from 'lucide-react';
import { ErrorMessage } from './ErrorMessage';

export function CookieClicker() {
  // Game state
  const [cookies, setCookies] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(1);
  const [autoClickers, setAutoClickers] = useState<number>(0);
  const [grandmas, setGrandmas] = useState<number>(0);
  const [factories, setFactories] = useState<number>(0);
  
  // Admin panel
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [giftAmount, setGiftAmount] = useState<number>(100);
  const [giftType, setGiftType] = useState<string>("cookies");
  const [targetUsername, setTargetUsername] = useState<string>("self");
  const [cheatCode, setCheatCode] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  
  // Error Message
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Styling
  const [background, setBackground] = useState<string>("none");
  const backgrounds = [
    { id: "none", name: "None" },
    { id: "bakery", name: "Bakery", color: "bg-amber-50" },
    { id: "space", name: "Space", color: "bg-slate-900 text-white" },
    { id: "rainbow", name: "Rainbow", color: "bg-gradient-to-r from-red-500 to-blue-500 text-white" },
    { id: "forest", name: "Forest", color: "bg-green-100" }
  ];
  
  // Upgrade costs
  const autoClickerCost = Math.floor(10 * Math.pow(1.15, autoClickers));
  const clickPowerCost = Math.floor(25 * Math.pow(1.3, clickPower - 1));
  const grandmaCost = Math.floor(100 * Math.pow(1.2, grandmas));
  const factoryCost = Math.floor(1000 * Math.pow(1.3, factories));
  
  // Cookie production per second
  const cookiesPerSecond = autoClickers + (grandmas * 5) + (factories * 50);
  
  // Admin Verification - Check if the current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setIsAdmin(userData.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Fetch users when admin mode is enabled
  useEffect(() => {
    if (adminMode && isAdmin) {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const response = await fetch('/api/users');
          if (response.ok) {
            const usersData = await response.json();
            setUsers(usersData);
          } else {
            console.error('Failed to fetch users');
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setLoadingUsers(false);
        }
      };
      
      fetchUsers();
    }
  }, [adminMode, isAdmin]);
  
  // Auto-clickers functionality
  useEffect(() => {
    const timer = setInterval(() => {
      if (autoClickers > 0 || grandmas > 0 || factories > 0) {
        setCookies(prev => prev + cookiesPerSecond / 10); // Divide by 10 since we update 10 times per second
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [autoClickers, grandmas, factories, cookiesPerSecond]);
  
  // Handle cookie click
  const handleCookieClick = () => {
    setCookies(cookies + clickPower);
  };
  
  // Check cheat code
  const checkCheatCode = () => {
    if (cheatCode === "cookiemonster") {
      setCookies(cookies + 1000);
      setCheatCode("");
      return true;
    }
    return false;
  };
  
  // Purchase auto clicker
  const buyAutoClicker = () => {
    if (cookies >= autoClickerCost) {
      setCookies(cookies - autoClickerCost);
      setAutoClickers(autoClickers + 1);
    } else {
      setErrorMessage(`You are not authorized to purchase 'Auto Clicker'\nNeed ${autoClickerCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Upgrade click power
  const upgradeClickPower = () => {
    if (cookies >= clickPowerCost) {
      setCookies(cookies - clickPowerCost);
      setClickPower(clickPower + 1);
    } else {
      setErrorMessage(`You are not authorized to purchase 'Click Power'\nNeed ${clickPowerCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase grandma
  const buyGrandma = () => {
    if (cookies >= grandmaCost) {
      setCookies(cookies - grandmaCost);
      setGrandmas(grandmas + 1);
    } else {
      setErrorMessage(`You are not authorized to hire 'Cookie Grandma'\nNeed ${grandmaCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase factory
  const buyFactory = () => {
    if (cookies >= factoryCost) {
      setCookies(cookies - factoryCost);
      setFactories(factories + 1);
    } else {
      setErrorMessage(`You are not authorized to build 'Cookie Factory'\nNeed ${factoryCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Give cookies or upgrades as admin
  const handleAdminGift = async () => {
    if (!isAdmin) return;
    
    // If target is self or not specified, apply to self
    if (!targetUsername || targetUsername === "self") {
      // Apply to self
      switch (giftType) {
        case "cookies":
          setCookies(cookies + giftAmount);
          break;
        case "clickers":
          setAutoClickers(autoClickers + Math.floor(giftAmount));
          break;
        case "power":
          setClickPower(clickPower + Math.floor(giftAmount));
          break;
        case "grandmas":
          setGrandmas(grandmas + Math.floor(giftAmount));
          break;
        case "factories":
          setFactories(factories + Math.floor(giftAmount));
          break;
        default:
          break;
      }
      setErrorMessage(`You gave yourself ${giftAmount} ${giftType}.`);
      setShowError(true);
      return;
    }
    
    // Send gift to another user
    try {
      const response = await fetch('/api/games/cookie-clicker/gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: targetUsername,
          giftType,
          amount: giftAmount
        }),
      });
      
      if (response.ok) {
        setErrorMessage(`Successfully gifted ${giftAmount} ${giftType} to ${targetUsername}!`);
        setShowError(true);
      } else {
        const error = await response.json();
        setErrorMessage(`Failed to gift to ${targetUsername}: ${error.message || 'Unknown error'}`);
        setShowError(true);
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      setErrorMessage(`Failed to send gift: Network error`);
      setShowError(true);
    }
  };
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return Math.floor(num).toString();
    }
  };
  
  // Get background styles
  const getBackgroundClass = () => {
    const bg = backgrounds.find(b => b.id === background);
    return bg?.color || "";
  };
  
  return (
    <div className={`flex flex-col items-center p-4 rounded-lg ${getBackgroundClass()}`}>
      {/* Windows-style Error Message */}
      <ErrorMessage 
        show={showError} 
        onClose={() => setShowError(false)} 
        title="System Administrator"
        message={errorMessage}
      />
      
      <div className="flex justify-between items-center w-full max-w-3xl mb-4">
        <h1 className="text-2xl font-bold">Cookie Clicker</h1>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAdminMode(!adminMode)}
              className={adminMode ? "bg-amber-500 text-white hover:bg-amber-600" : ""}
            >
              <Crown className="h-4 w-4 mr-1" /> Admin
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bug className="h-4 w-4 mr-1" /> Debug
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Game Debug Panel</DialogTitle>
                  <DialogDescription>
                    View and modify game state for debugging purposes.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-2 py-4">
                  <div className="flex items-center gap-2">
                    <Label>Current Cookies:</Label>
                    <Input 
                      type="number" 
                      value={cookies} 
                      onChange={(e) => setCookies(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label>Click Power:</Label>
                    <Input 
                      type="number" 
                      value={clickPower} 
                      onChange={(e) => setClickPower(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label>Auto Clickers:</Label>
                    <Input 
                      type="number" 
                      value={autoClickers} 
                      onChange={(e) => setAutoClickers(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label>Grandmas:</Label>
                    <Input 
                      type="number" 
                      value={grandmas} 
                      onChange={(e) => setGrandmas(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label>Factories:</Label>
                    <Input 
                      type="number" 
                      value={factories} 
                      onChange={(e) => setFactories(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" onClick={() => {}}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      {adminMode && isAdmin && (
        <Card className="w-full max-w-3xl mb-4 p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-bold flex items-center gap-2 mb-2">
            <GiftIcon className="h-4 w-4" /> Admin Gift Panel
          </h3>
          
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <Label htmlFor="giftAmount">Amount:</Label>
              <Input 
                id="giftAmount"
                type="number" 
                value={giftAmount} 
                onChange={(e) => setGiftAmount(Number(e.target.value))}
                className="w-24"
              />
            </div>
            
            <div>
              <Label htmlFor="giftType">Gift Type:</Label>
              <Select value={giftType} onValueChange={setGiftType}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cookies">Cookies</SelectItem>
                  <SelectItem value="clickers">Auto Clickers</SelectItem>
                  <SelectItem value="power">Click Power</SelectItem>
                  <SelectItem value="grandmas">Grandmas</SelectItem>
                  <SelectItem value="factories">Factories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="targetUser">Target User:</Label>
              <Select 
                value={targetUsername} 
                onValueChange={setTargetUsername}
                disabled={loadingUsers}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAdminGift} 
              disabled={loadingUsers}
            >
              {loadingUsers ? "Loading..." : "Give Gift"}
            </Button>
            
            <div className="ml-auto">
              <Label htmlFor="background">Background:</Label>
              <Select value={background} onValueChange={setBackground}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select a background" />
                </SelectTrigger>
                <SelectContent>
                  {backgrounds.map(bg => (
                    <SelectItem key={bg.id} value={bg.id}>{bg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}
      
      <div className="stats mb-6 text-center">
        <div className="text-4xl font-bold">{formatNumber(cookies)} cookies</div>
        <div className="text-gray-600 dark:text-gray-400">per second: {formatNumber(cookiesPerSecond)}</div>
        <div className="text-gray-600 dark:text-gray-400">per click: {clickPower}</div>
      </div>
      
      {/* Secret cheat code input */}
      <div className="mb-2 w-full max-w-xs">
        <Input 
          type="text" 
          value={cheatCode} 
          onChange={(e) => setCheatCode(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const success = checkCheatCode();
              if (success) {
                e.currentTarget.blur();
              }
            }
          }}
          placeholder="Enter cheat code..." 
          className="text-sm opacity-50 focus:opacity-100 transition-opacity"
        />
      </div>
      
      <div className="cookie-container mb-8 relative group">
        <button 
          className="cookie-button w-40 h-40 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95 border-4 border-amber-300 shadow-lg"
          onClick={handleCookieClick}
        >
          <span role="img" aria-label="cookie" className="text-8xl group-hover:animate-pulse">🍪</span>
        </button>
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="text-yellow-500 h-8 w-8 animate-bounce" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Auto Clicker</h3>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+1/sec</span>
          </div>
          <p className="text-sm mb-2">Automatically clicks once per second</p>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs">You have: {autoClickers}</span>
            </div>
            <Button 
              onClick={buyAutoClicker} 
              disabled={cookies < autoClickerCost}
              size="sm"
              variant={cookies >= autoClickerCost ? "default" : "outline"}
            >
              Buy for {formatNumber(autoClickerCost)} cookies
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Click Power</h3>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+1/click</span>
          </div>
          <p className="text-sm mb-2">Increase cookies per click</p>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs">Current: {clickPower}</span>
            </div>
            <Button 
              onClick={upgradeClickPower} 
              disabled={cookies < clickPowerCost}
              size="sm"
              variant={cookies >= clickPowerCost ? "default" : "outline"}
            >
              Upgrade for {formatNumber(clickPowerCost)} cookies
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Grandma</h3>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+5/sec</span>
          </div>
          <p className="text-sm mb-2">Bakes cookies at amazing speed</p>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs">You have: {grandmas}</span>
            </div>
            <Button 
              onClick={buyGrandma} 
              disabled={cookies < grandmaCost}
              size="sm"
              variant={cookies >= grandmaCost ? "default" : "outline"}
            >
              Hire for {formatNumber(grandmaCost)} cookies
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Cookie Factory</h3>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+50/sec</span>
          </div>
          <p className="text-sm mb-2">Mass produces cookies at industrial scale</p>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs">You have: {factories}</span>
            </div>
            <Button 
              onClick={buyFactory} 
              disabled={cookies < factoryCost}
              size="sm"
              variant={cookies >= factoryCost ? "default" : "outline"}
            >
              Build for {formatNumber(factoryCost)} cookies
            </Button>
          </div>
        </Card>
      </div>
      
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p>Click the cookie to earn cookies. Use cookies to buy upgrades.</p>
        {isAdmin && (
          <p className="mt-1 italic">Admin tip: Try the cheat code "cookiemonster" for a surprise!</p>
        )}
      </div>
    </div>
  );
}