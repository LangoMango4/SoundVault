import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function GoogleGnome() {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Google Gnome</h1>
      
      <div className="w-full aspect-video mb-8">
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube.com/embed/vNOllWX-2aE"
          title="Google Gnome Video" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen
        ></iframe>
      </div>

      <div className="w-full bg-slate-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">About Google Gnome</h2>
        <p className="mb-4">
          Google Gnome was an April Fool's joke from Google, presented as an outdoor smart speaker 
          that helps with questions and tasks related to your yard and garden. 
        </p>
        
        <Tabs defaultValue="features">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="facts">Fun Facts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="features" className="p-4">
            <ul className="list-disc pl-5 space-y-2">
              <li>Helps you understand weather and nature</li>
              <li>Controls your outdoor equipment</li>
              <li>Answers outdoor-related questions</li>
              <li>Blunt, no-nonsense responses about nature's harsh realities</li>
            </ul>
          </TabsContent>
          
          <TabsContent value="commands" className="p-4">
            <ul className="list-disc pl-5 space-y-2">
              <li>"Hey Gnome, what's the weather?"</li>
              <li>"Hey Gnome, turn on the sprinkler."</li>
              <li>"Hey Gnome, what kind of bird is that?"</li>
              <li>"Hey Gnome, play some outdoor sounds."</li>
            </ul>
          </TabsContent>
          
          <TabsContent value="facts" className="p-4">
            <ul className="list-disc pl-5 space-y-2">
              <li>Released as an April Fool's prank in 2017</li>
              <li>Meant to be a parody of Google Home</li>
              <li>Google Gnome is "completely weather-proof... mostly"</li>
              <li>The Gnome has a dark sense of humor about nature</li>
            </ul>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-center mt-6">
        <Button 
          onClick={() => window.open('https://www.youtube.com/watch?v=vNOllWX-2aE', '_blank')}
          className="mr-4"
        >
          Watch Original Video
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.open('https://www.google.com/search?q=google+gnome+april+fools', '_blank')}
        >
          Learn More
        </Button>
      </div>
    </div>
  );
}

export default GoogleGnome;