import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function CookieClicker() {
  const [cookies, setCookies] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(1);
  const [autoClickers, setAutoClickers] = useState<number>(0);
  const [grandmas, setGrandmas] = useState<number>(0);
  const [factories, setFactories] = useState<number>(0);
  
  // Upgrade costs
  const autoClickerCost = Math.floor(10 * Math.pow(1.15, autoClickers));
  const clickPowerCost = Math.floor(25 * Math.pow(1.3, clickPower - 1));
  const grandmaCost = Math.floor(100 * Math.pow(1.2, grandmas));
  const factoryCost = Math.floor(1000 * Math.pow(1.3, factories));
  
  // Cookie production per second
  const cookiesPerSecond = autoClickers + (grandmas * 5) + (factories * 50);
  
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
  
  // Purchase auto clicker
  const buyAutoClicker = () => {
    if (cookies >= autoClickerCost) {
      setCookies(cookies - autoClickerCost);
      setAutoClickers(autoClickers + 1);
    }
  };
  
  // Upgrade click power
  const upgradeClickPower = () => {
    if (cookies >= clickPowerCost) {
      setCookies(cookies - clickPowerCost);
      setClickPower(clickPower + 1);
    }
  };
  
  // Purchase grandma
  const buyGrandma = () => {
    if (cookies >= grandmaCost) {
      setCookies(cookies - grandmaCost);
      setGrandmas(grandmas + 1);
    }
  };
  
  // Purchase factory
  const buyFactory = () => {
    if (cookies >= factoryCost) {
      setCookies(cookies - factoryCost);
      setFactories(factories + 1);
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
  
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Cookie Clicker</h1>
      
      <div className="stats mb-6 text-center">
        <div className="text-4xl font-bold">{formatNumber(cookies)} cookies</div>
        <div className="text-gray-600">per second: {formatNumber(cookiesPerSecond)}</div>
        <div className="text-gray-600">per click: {clickPower}</div>
      </div>
      
      <div className="cookie-container mb-8">
        <button 
          className="cookie-button w-40 h-40 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95 border-4 border-amber-300"
          onClick={handleCookieClick}
        >
          <span role="img" aria-label="cookie" className="text-8xl">🍪</span>
        </button>
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
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Click the cookie to earn cookies. Use cookies to buy upgrades.</p>
      </div>
    </div>
  );
}