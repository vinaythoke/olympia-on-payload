import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h1>
          <div className="mb-6 text-gray-600">
            <p>It looks like you've lost your internet connection.</p>
            <p className="mt-2">Don't worry - some features are still available offline:</p>
            
            <ul className="mt-4 text-left list-disc list-inside">
              <li>View your cached tickets</li>
              <li>Perform check-ins (will sync when back online)</li>
              <li>Access previously viewed event details</li>
            </ul>
          </div>

          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
} 