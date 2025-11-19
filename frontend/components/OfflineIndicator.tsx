import React from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const OfflineIndicator: React.FC = () => {
  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-destructive text-destructive-foreground">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're currently offline. Some features may not be available.
      </AlertDescription>
    </Alert>
  );
};

export default OfflineIndicator;
