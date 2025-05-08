import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Crown, Bug, Sparkles, Gift as GiftIcon, RotateCcw, Cookie } from 'lucide-react';
import { ErrorMessage } from './ErrorMessage';
import { CookieClickerLeaderboard } from './CookieClickerLeaderboard';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function CookieClicker() {
  // Game state
  const [cookies, setCookies] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(1);
  const [autoClickers, setAutoClickers] = useState<number>(0);
  const [grandmas, setGrandmas] = useState<number>(0);
  const [factories, setFactories] = useState<number>(0);
  const [mines, setMines] = useState<number>(0);
  const [temples, setTemples] = useState<number>(0);
  const [wizardTowers, setWizardTowers] = useState<number>(0);
  const [shipments, setShipments] = useState<number>(0);
  const [alchemyLabs, setAlchemyLabs] = useState<number>(0);
  
  // Animation state for falling cookies
  const [fallingCookies, setFallingCookies] = useState<{ id: number; x: number; y: number; size: number; rotation: number; speed: number }[]>([]);
  
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
  
  // Save optimization
  const [lastClickSaveTime, setLastClickSaveTime] = useState<number>(0);
  
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
  
  // Upgrade costs for new buildings
  const mineCost = Math.floor(5000 * Math.pow(1.25, mines));
  const templeCost = Math.floor(20000 * Math.pow(1.3, temples));
  const wizardTowerCost = Math.floor(100000 * Math.pow(1.35, wizardTowers));
  const shipmentCost = Math.floor(500000 * Math.pow(1.4, shipments));
  const alchemyLabCost = Math.floor(2000000 * Math.pow(1.45, alchemyLabs));

  // Cookie production per second
  const cookiesPerSecond = autoClickers + 
                         (grandmas * 5) + 
                         (factories * 50) + 
                         (mines * 250) + 
                         (temples * 1000) + 
                         (wizardTowers * 5000) + 
                         (shipments * 25000) + 
                         (alchemyLabs * 100000);
  
  // Load game data from the server
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const response = await fetch('/api/games/cookie-clicker');
        if (response.ok) {
          const data = await response.json();
          // Check if this is a new game or an existing game
          const isNewGame = !data.id; // If there's no id, it's a new game
          
          // For new players, start with 0 cookies, but load saved data for returning players
          setCookies(isNewGame ? 0 : (data.cookies || 0));
          setClickPower(data.clickPower || 1);
          setAutoClickers(data.autoClickers || 0);
          setGrandmas(data.grandmas || 0);
          setFactories(data.factories || 0);
          setMines(data.mines || 0);
          setTemples(data.temples || 0);
          setWizardTowers(data.wizardTowers || 0);
          setShipments(data.shipments || 0);
          setAlchemyLabs(data.alchemyLabs || 0);
          setBackground(data.background || "none");
          console.log('Loaded game data:', data);
        } else {
          console.warn('Failed to load game data, starting with default values');
          // Start with 0 cookies for new players
          setCookies(0);
        }
      } catch (error) {
        console.error('Error loading game data:', error);
        // Start with 0 cookies if there's an error
        setCookies(0);
      }
    };
    
    loadGameData();
  }, []);
  
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
      if (autoClickers > 0 || grandmas > 0 || factories > 0 || mines > 0 || temples > 0 || wizardTowers > 0 || shipments > 0 || alchemyLabs > 0) {
        setCookies(prev => prev + cookiesPerSecond / 10); // Divide by 10 since we update 10 times per second
        
        // Occasionally create falling cookies for passive generation
        // Only create new cookies if we don't have too many already
        if (fallingCookies.length < 50) {
          // The more buildings you have, the more chances of cookie animations
          const totalBuildings = autoClickers + grandmas + factories + mines + temples + wizardTowers + shipments + alchemyLabs;
          if (Math.random() < totalBuildings / 1000) { // Even lower chance to avoid performance issues
            const cookieContainer = document.querySelector('.cookie-container');
            if (cookieContainer) {
              const rect = cookieContainer.getBoundingClientRect();
              // Position cookies randomly within the container
              const x = Math.random() * rect.width;
              const y = 0; // Start at the top
              
              // Use setTimeout to prevent too many cookies from appearing at once
              setTimeout(() => {
                createFallingCookie(x, y);
              }, Math.random() * 500); // Randomize the delay
            }
          }
        }
      }
    }, 100);
    
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoClickers, grandmas, factories, mines, temples, wizardTowers, shipments, alchemyLabs, cookiesPerSecond, fallingCookies.length]);
  
  // Save game data to the server
  useEffect(() => {
    // Don't save on initial load, only when values change
    if (cookies === 0 && clickPower === 1 && autoClickers === 0 && grandmas === 0 && factories === 0) {
      return;
    }
    
    // Save game data after a small delay to avoid too many requests
    const saveTimeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/games/cookie-clicker/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cookies,
            clickPower,
            autoClickers,
            grandmas,
            factories,
            mines,
            temples,
            wizardTowers,
            shipments,
            alchemyLabs,
            background
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to save game data:', await response.text());
        } else {
          console.log('Saved game data successfully');
        }
      } catch (error) {
        console.error('Error saving game data:', error);
      }
    }, 2000); // Save every 2 seconds when data changes
    
    return () => clearTimeout(saveTimeout);
  }, [cookies, clickPower, autoClickers, grandmas, factories, mines, temples, wizardTowers, shipments, alchemyLabs, background]);
  
  // Create falling cookie effect
  const createFallingCookie = (x: number, y: number) => {
    const id = Date.now() + Math.random();
    const size = Math.random() * 20 + 15; // Random size between 15-35px
    const rotation = Math.random() * 360; // Random rotation
    const speed = Math.random() * 1.5 + 1; // Random fall speed (slower for better visibility)
    
    // Add the new cookie with a delayed state update to avoid batching issues
    setTimeout(() => {
      setFallingCookies(prev => {
        // Limit to 50 cookies max to prevent performance issues
        const newCookies = [...prev, { id, x, y, size, rotation, speed }];
        if (newCookies.length > 50) {
          return newCookies.slice(-50); // Keep only the 50 most recent cookies
        }
        return newCookies;
      });
    }, 0);
    
    // Remove cookie after animation (3 seconds)
    setTimeout(() => {
      setFallingCookies(prev => prev.filter(cookie => cookie.id !== id));
    }, 3000);
  };
  
  // Handle cookie click
  const handleCookieClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Get click position relative to the button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Get how many cookies to create based on click power (max 10 to avoid performance issues)
    const cookiesToCreate = Math.min(clickPower, 10);
    
    // Create falling cookies in a staggered pattern using a loop with setTimeout
    for (let i = 0; i < cookiesToCreate; i++) {
      setTimeout(() => {
        // Add some randomness to the positions
        const offsetX = x + (Math.random() * 60 - 30);
        const offsetY = y + (Math.random() * 60 - 30);
        
        createFallingCookie(offsetX, offsetY);
      }, i * 50); // Stagger each cookie creation by 50ms
    }
    
    // Update cookie count with functional update to ensure we always use the latest state
    setCookies(prevCookies => {
      const newCookieValue = prevCookies + clickPower;
      
      // Debounce save operation to avoid too many API calls
      const lastSaveTime = Date.now();
      if (lastSaveTime - lastClickSaveTime > 2000) { // Only save at most every 2 seconds
        setLastClickSaveTime(lastSaveTime);
        
        // Save cookies asynchronously
        setTimeout(() => {
          fetch('/api/games/cookie-clicker/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cookies: newCookieValue,
              clickPower,
              autoClickers,
              grandmas,
              factories,
              mines,
              temples,
              wizardTowers,
              shipments,
              alchemyLabs,
              background
            }),
          })
          .then(response => {
            if (!response.ok) {
              console.error('Failed to save game data during click');
            }
          })
          .catch(error => {
            console.error('Error saving click data:', error);
          });
        }, 100);
      }
      
      return newCookieValue;
    });
  };
  
  // Check cheat code
  const checkCheatCode = () => {
    if (cheatCode === "cookiemonster") {
      setCookies(prevCookies => prevCookies + 1000);
      setCheatCode("");
      return true;
    }
    return false;
  };
  
  // Purchase auto clicker
  const buyAutoClicker = () => {
    if (cookies >= autoClickerCost) {
      setCookies(prevCookies => prevCookies - autoClickerCost);
      setAutoClickers(prevAutoClickers => prevAutoClickers + 1);
    } else {
      setErrorMessage(`You are not authorized to purchase 'Auto Clicker'\nNeed ${autoClickerCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Upgrade click power
  const upgradeClickPower = () => {
    if (cookies >= clickPowerCost) {
      setCookies(prevCookies => prevCookies - clickPowerCost);
      setClickPower(prevClickPower => prevClickPower + 1);
    } else {
      setErrorMessage(`You are not authorized to purchase 'Click Power'\nNeed ${clickPowerCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase grandma
  const buyGrandma = () => {
    if (cookies >= grandmaCost) {
      setCookies(prevCookies => prevCookies - grandmaCost);
      setGrandmas(prevGrandmas => prevGrandmas + 1);
    } else {
      setErrorMessage(`You are not authorized to hire 'Cookie Grandma'\nNeed ${grandmaCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase factory
  const buyFactory = () => {
    if (cookies >= factoryCost) {
      setCookies(prevCookies => prevCookies - factoryCost);
      setFactories(prevFactories => prevFactories + 1);
    } else {
      setErrorMessage(`You are not authorized to build 'Cookie Factory'\nNeed ${factoryCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase mine
  const buyMine = () => {
    if (cookies >= mineCost) {
      setCookies(prevCookies => prevCookies - mineCost);
      setMines(prevMines => prevMines + 1);
    } else {
      setErrorMessage(`You are not authorized to build 'Cookie Mine'\nNeed ${mineCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase temple
  const buyTemple = () => {
    if (cookies >= templeCost) {
      setCookies(prevCookies => prevCookies - templeCost);
      setTemples(prevTemples => prevTemples + 1);
    } else {
      setErrorMessage(`You are not authorized to build 'Cookie Temple'\nNeed ${templeCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase wizard tower
  const buyWizardTower = () => {
    if (cookies >= wizardTowerCost) {
      setCookies(prevCookies => prevCookies - wizardTowerCost);
      setWizardTowers(prevWizardTowers => prevWizardTowers + 1);
    } else {
      setErrorMessage(`You are not authorized to build 'Wizard Tower'\nNeed ${wizardTowerCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase shipment
  const buyShipment = () => {
    if (cookies >= shipmentCost) {
      setCookies(prevCookies => prevCookies - shipmentCost);
      setShipments(prevShipments => prevShipments + 1);
    } else {
      setErrorMessage(`You are not authorized to build 'Cookie Shipment'\nNeed ${shipmentCost} cookies. You have ${Math.floor(cookies)}.`);
      setShowError(true);
    }
  };
  
  // Purchase alchemy lab
  const buyAlchemyLab = () => {
    if (cookies >= alchemyLabCost) {
      setCookies(prevCookies => prevCookies - alchemyLabCost);
      setAlchemyLabs(prevAlchemyLabs => prevAlchemyLabs + 1);
    } else {
      setErrorMessage(`You are not authorized to build 'Alchemy Lab'\nNeed ${alchemyLabCost} cookies. You have ${Math.floor(cookies)}.`);
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
          setCookies(prevCookies => prevCookies + giftAmount);
          break;
        case "clickers":
          setAutoClickers(prevAutoClickers => prevAutoClickers + Math.floor(giftAmount));
          break;
        case "power":
          setClickPower(prevClickPower => prevClickPower + Math.floor(giftAmount));
          break;
        case "grandmas":
          setGrandmas(prevGrandmas => prevGrandmas + Math.floor(giftAmount));
          break;
        case "factories":
          setFactories(prevFactories => prevFactories + Math.floor(giftAmount));
          break;
        case "mines":
          setMines(prevMines => prevMines + Math.floor(giftAmount));
          break;
        case "temples":
          setTemples(prevTemples => prevTemples + Math.floor(giftAmount));
          break;
        case "wizardTowers":
          setWizardTowers(prevWizardTowers => prevWizardTowers + Math.floor(giftAmount));
          break;
        case "shipments":
          setShipments(prevShipments => prevShipments + Math.floor(giftAmount));
          break;
        case "alchemyLabs":
          setAlchemyLabs(prevAlchemyLabs => prevAlchemyLabs + Math.floor(giftAmount));
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
  
  // Reset the game to its initial state
  const handleResetGame = async () => {
    if (window.confirm("Are you sure you want to reset your game? This will set your cookies to 0 and remove all upgrades.")) {
      try {
        const response = await fetch('/api/games/cookie-clicker/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const resetData = await response.json();
          setCookies(0);
          setClickPower(1);
          setAutoClickers(0);
          setGrandmas(0);
          setFactories(0);
          setMines(0);
          setTemples(0);
          setWizardTowers(0);
          setShipments(0);
          setAlchemyLabs(0);
          setBackground("none");
          setErrorMessage("Game has been reset! Starting fresh with 0 cookies.");
          setShowError(true);
        } else {
          console.error('Failed to reset game:', await response.text());
          setErrorMessage("Failed to reset game. Please try again.");
          setShowError(true);
        }
      } catch (error) {
        console.error('Error resetting game:', error);
        setErrorMessage("Error resetting game. Please try again.");
        setShowError(true);
      }
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
    <div className={`min-h-screen p-6 rounded-lg ${getBackgroundClass()}`}>
      
      {/* Main game content */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* Left side - Game */}
        <div className="flex flex-col items-center lg:w-3/4">
          {/* Windows-style Error Message */}
          <ErrorMessage 
            show={showError} 
            onClose={() => setShowError(false)} 
            title="System Administrator"
            message={errorMessage}
          />
          
          <div className="flex justify-between items-center w-full max-w-3xl mb-4">
            <h1 className="text-2xl font-bold">Cookie Clicker</h1>
            
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleResetGame}
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Reset Game
              </Button>
              
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
                        
                        <div className="flex items-center gap-2">
                          <Label>Mines:</Label>
                          <Input 
                            type="number" 
                            value={mines} 
                            onChange={(e) => setMines(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label>Temples:</Label>
                          <Input 
                            type="number" 
                            value={temples} 
                            onChange={(e) => setTemples(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label>Wizard Towers:</Label>
                          <Input 
                            type="number" 
                            value={wizardTowers} 
                            onChange={(e) => setWizardTowers(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label>Shipments:</Label>
                          <Input 
                            type="number" 
                            value={shipments} 
                            onChange={(e) => setShipments(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label>Alchemy Labs:</Label>
                          <Input 
                            type="number" 
                            value={alchemyLabs} 
                            onChange={(e) => setAlchemyLabs(Number(e.target.value))}
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
                      <SelectItem value="mines">Mines</SelectItem>
                      <SelectItem value="temples">Temples</SelectItem>
                      <SelectItem value="wizardTowers">Wizard Towers</SelectItem>
                      <SelectItem value="shipments">Shipments</SelectItem>
                      <SelectItem value="alchemyLabs">Alchemy Labs</SelectItem>
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
          
          <div className="cookie-container mb-8">
            {/* Render falling cookies */}
            {fallingCookies.map(cookie => (
              <div 
                key={cookie.id}
                className="animate-fall"
                style={{
                  left: `${cookie.x}px`,
                  top: `${cookie.y}px`,
                  fontSize: `${cookie.size}px`,
                  transform: `rotate(${cookie.rotation}deg)`,
                  animationDuration: `${3 / cookie.speed}s`,
                  zIndex: 5
                }}
              >
                🍪
              </div>
            ))}
            
            <div className="flex justify-center items-center h-full">
              <button 
                className="cookie-button w-40 h-40 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95 border-4 border-amber-300 shadow-lg relative"
                onClick={handleCookieClick}
                style={{ zIndex: 10 }}
              >
                <span role="img" aria-label="cookie" className="text-8xl group-hover:animate-pulse">🍪</span>
              </button>
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ zIndex: 20 }}>
                <Sparkles className="text-yellow-500 h-8 w-8 animate-bounce" />
              </div>
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

            {/* Mine */}
            {factories > 0 && (
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Cookie Mine</h3>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+250/sec</span>
                </div>
                <p className="text-sm mb-2">Extract cookie ore from deep underground</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs">You have: {mines}</span>
                  </div>
                  <Button 
                    onClick={buyMine} 
                    disabled={cookies < mineCost}
                    size="sm"
                    variant={cookies >= mineCost ? "default" : "outline"}
                  >
                    Build for {formatNumber(mineCost)} cookies
                  </Button>
                </div>
              </Card>
            )}

            {/* Temple */}
            {mines > 0 && (
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Cookie Temple</h3>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+1K/sec</span>
                </div>
                <p className="text-sm mb-2">Ancient temples dedicated to cookie deities</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs">You have: {temples}</span>
                  </div>
                  <Button 
                    onClick={buyTemple} 
                    disabled={cookies < templeCost}
                    size="sm"
                    variant={cookies >= templeCost ? "default" : "outline"}
                  >
                    Build for {formatNumber(templeCost)} cookies
                  </Button>
                </div>
              </Card>
            )}

            {/* Wizard Tower */}
            {temples > 0 && (
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Wizard Tower</h3>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+5K/sec</span>
                </div>
                <p className="text-sm mb-2">Summons cookies through arcane magic</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs">You have: {wizardTowers}</span>
                  </div>
                  <Button 
                    onClick={buyWizardTower} 
                    disabled={cookies < wizardTowerCost}
                    size="sm"
                    variant={cookies >= wizardTowerCost ? "default" : "outline"}
                  >
                    Build for {formatNumber(wizardTowerCost)} cookies
                  </Button>
                </div>
              </Card>
            )}

            {/* Shipment */}
            {wizardTowers > 0 && (
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Cookie Shipment</h3>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+25K/sec</span>
                </div>
                <p className="text-sm mb-2">Brings cookies from the cookie planet</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs">You have: {shipments}</span>
                  </div>
                  <Button 
                    onClick={buyShipment} 
                    disabled={cookies < shipmentCost}
                    size="sm"
                    variant={cookies >= shipmentCost ? "default" : "outline"}
                  >
                    Build for {formatNumber(shipmentCost)} cookies
                  </Button>
                </div>
              </Card>
            )}

            {/* Alchemy Lab */}
            {shipments > 0 && (
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Alchemy Lab</h3>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">+100K/sec</span>
                </div>
                <p className="text-sm mb-2">Turns gold into cookies through alchemy</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs">You have: {alchemyLabs}</span>
                  </div>
                  <Button 
                    onClick={buyAlchemyLab} 
                    disabled={cookies < alchemyLabCost}
                    size="sm"
                    variant={cookies >= alchemyLabCost ? "default" : "outline"}
                  >
                    Build for {formatNumber(alchemyLabCost)} cookies
                  </Button>
                </div>
              </Card>
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            <p>Click the cookie to earn cookies. Use cookies to buy upgrades.</p>
            {isAdmin && (
              <p className="mt-1 italic">Admin tip: Try the cheat code "cookiemonster" for a surprise!</p>
            )}
          </div>
        </div>
        
        {/* Right side - Leaderboard */}
        <div className="mt-6 lg:mt-0 lg:w-1/4">
          <ErrorBoundary fallback={
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Cookie className="w-5 h-5 mr-2 text-amber-500" />
                  Cookie Clicker Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-500">Unable to load the leaderboard.</p>
              </CardContent>
            </Card>
          }>
            <CookieClickerLeaderboard />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}