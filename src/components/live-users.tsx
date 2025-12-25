import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Users as UsersIcon } from "lucide-react";
import { getApiUrl } from "@/lib/api/config";
import { useToast } from "@/hooks/use-toast";

interface LiveUser {
  id: string;
  deviceId: string;
  name: string;
  ip: string;
}

export function LiveUsers() {
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLiveUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl("heartbeat/live/users"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.status === 1) {
        setLiveUsers(data.liveUsers || []);
      }
    } catch (error) {
      console.error("Error fetching live users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch live users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-serif flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            Users Online ({liveUsers.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchLiveUsers}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : liveUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No users online</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveUsers.map((user, index) => (
                  <TableRow key={user.id || index}>
                    <TableCell className="font-mono text-sm">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{user.deviceId || '-'}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{user.ip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

