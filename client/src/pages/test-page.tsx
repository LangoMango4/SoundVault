import React, { useState } from 'react';
import { ErrorMessage } from '@/components/games/local-games/ErrorMessage';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [showError, setShowError] = useState(false);
  const [errorTitle, setErrorTitle] = useState('System Administrator');
  const [errorMessage, setErrorMessage] = useState('You are not authorized to run this application \'Camera\'');

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Windows Dialog Style Test</h1>
      
      <div className="mb-6 space-y-2">
        <div>
          <label className="block mb-1">Dialog Title:</label>
          <input 
            type="text"
            value={errorTitle}
            onChange={(e) => setErrorTitle(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        
        <div>
          <label className="block mb-1">Dialog Message:</label>
          <textarea
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            className="w-full border rounded p-2 h-24"
          />
        </div>
      </div>
      
      <Button 
        onClick={() => setShowError(true)}
        className="mr-2"
      >
        Show Windows Dialog
      </Button>
      
      <ErrorMessage 
        show={showError}
        onClose={() => setShowError(false)}
        title={errorTitle}
        message={errorMessage}
      />
    </div>
  );
}