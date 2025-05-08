import React, { useState, useCallback } from 'react';
import { useUpdateNotification } from '@/hooks/use-update-notification';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, RefreshCw, Clock } from 'lucide-react';

export default function UpdateNotificationTester() {
  const { testShowUpdateNotification, checkForDeployment } = useUpdateNotification();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  
  const handleTest = useCallback(() => {
    if (isDisabled) return;
    
    setIsDisabled(true);
    testShowUpdateNotification();
    setShowSuccess(true);
    
    toast({
      title: "Success",
      description: "Update notification triggered successfully!"
    });
    
    // Re-enable button after a delay
    setTimeout(() => {
      setIsDisabled(false);
    }, 2000);
    
    // Hide success message after a delay
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  }, [isDisabled, testShowUpdateNotification, toast]);
  
  const [deploymentInfo, setDeploymentInfo] = useState<{
    timestamp: number;
    deployedAt: string;
    version: string;
  } | null>(null);
  const [isCheckingDeployment, setIsCheckingDeployment] = useState(false);
  
  const checkDeployment = useCallback(async () => {
    setIsCheckingDeployment(true);
    try {
      // First fetch deployment info for display
      const response = await fetch('/api/deployment');
      if (response.ok) {
        const data = await response.json();
        setDeploymentInfo(data);
        
        // Get the stored timestamp from localStorage
        const storedTimestamp = localStorage.getItem('math-homework-deployment-timestamp');
        
        toast({
          title: "Deployment Info Retrieved",
          description: `Current timestamp: ${data.timestamp}${storedTimestamp ? `, Stored: ${storedTimestamp}` : ', No stored timestamp'}`,
          duration: 5000
        });
        
        // Now use our hook's deployment check function
        if (checkForDeployment) {
          const result = await checkForDeployment();
          console.log('Deployment check result:', result);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch deployment info",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to check deployment:", error);
      toast({
        title: "Error",
        description: "Failed to check deployment",
        variant: "destructive"
      });
    } finally {
      setIsCheckingDeployment(false);
    }
  }, [toast, checkForDeployment]);
  
  const simulateNewDeployment = useCallback(() => {
    // Remove the stored deployment timestamp to simulate a new deployment
    localStorage.removeItem('math-homework-deployment-timestamp');
    localStorage.removeItem('math-homework-version');
    
    toast({
      title: "Deployment Simulation",
      description: "Cleared deployment data. Next check will simulate a new deployment.",
      duration: 5000
    });
  }, [toast]);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          onClick={handleTest}
          className="bg-primary hover:bg-primary/90"
          disabled={isDisabled}
        >
          <Bell className="mr-2 h-4 w-4" />
          {isDisabled ? 'Notification Sent...' : 'Test Update Notification'}
        </Button>
        
        <Button
          onClick={checkDeployment}
          variant="outline"
          disabled={isCheckingDeployment}
        >
          <Clock className="mr-2 h-4 w-4" />
          {isCheckingDeployment ? 'Checking...' : 'Check Deployment Status'}
        </Button>
        
        <Button
          onClick={simulateNewDeployment}
          variant="secondary"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Simulate New Deployment
        </Button>
      </div>
      
      {showSuccess && (
        <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-md text-sm flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          Update notification triggered successfully!
        </div>
      )}
      
      {deploymentInfo && (
        <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-md text-sm space-y-2">
          <h4 className="font-medium">Deployment Information:</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="font-medium">Timestamp:</div>
            <div>{deploymentInfo.timestamp}</div>
            
            <div className="font-medium">Deployed At:</div>
            <div>{new Date(deploymentInfo.deployedAt).toLocaleString()}</div>
            
            <div className="font-medium">Version:</div>
            <div>{deploymentInfo.version}</div>
          </div>
        </div>
      )}
    </div>
  );
}
