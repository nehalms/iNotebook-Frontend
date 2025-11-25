import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, MessageSquare, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { createPermissionRequest } from "@/lib/api/admin";

interface PermissionDeniedProps {
  permission?: string;
}

export default function PermissionDenied({ permission }: PermissionDeniedProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Determine permission from route if not provided
  const getPermissionFromRoute = () => {
    if (permission) return permission;
    const routeMap: { [key: string]: string } = {
      '/notes': 'notes',
      '/tasks': 'tasks',
      '/images': 'images',
      '/games': 'games',
      '/messages': 'messages',
      '/news': 'news',
      '/calendar': 'calendar',
    };
    return routeMap[location] || '';
  };
  
  const currentPermission = getPermissionFromRoute();
  const permissionNames: { [key: string]: string } = {
    notes: 'Notes',
    tasks: 'Tasks',
    images: 'Images',
    games: 'Games',
    messages: 'Messages',
    news: 'News',
    calendar: 'Calendar'
  };
  
  const handleRequestPermission = async () => {
    if (!currentPermission) {
      toast({
        title: "Error",
        description: "Unable to determine which permission to request",
        variant: "destructive",
      });
      return;
    }
    
    setIsRequesting(true);
    try {
      const response = await createPermissionRequest(currentPermission);
      if (response.success) {
        toast({
          title: "Request Sent",
          description: `Your request for ${permissionNames[currentPermission] || currentPermission} access has been sent to the administrator.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send request",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-destructive/5 p-4">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 pb-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Permission Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to access this feature.
                {currentPermission && (
                  <span className="block mt-1 font-medium">
                    ({permissionNames[currentPermission] || currentPermission})
                  </span>
                )}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact your administrator if you believe this is an error.
            </p>
            <div className="flex flex-col gap-3 w-full mt-6">
              {currentPermission && (
                <Button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="w-full"
                  variant="outline"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Request Access
                    </>
                  )}
                </Button>
              )}
              <Link href="/">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

