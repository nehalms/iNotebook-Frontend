import { Users, FileText, Gamepad2, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { User, GameDetail } from "@/types/schema";

interface AdminStats {
  totalUsers: number;
  totalNotes: number;
  totalTasks: number;
  totalGames: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

interface AdminPageProps {
  stats?: AdminStats;
  users?: User[];
  gameStats?: GameDetail[];
  isLoading?: boolean;
}

export default function AdminPage({
  stats,
  users = [],
  gameStats = [],
  isLoading,
}: AdminPageProps) {
  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Notes",
      value: stats?.totalNotes || 0,
      icon: FileText,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Total Games",
      value: stats?.totalGames || 0,
      icon: Gamepad2,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || 0,
      icon: TrendingUp,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage users and monitor system activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return isLoading ? (
            <Card key={stat.title} className="rounded-xl">
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card
              key={stat.title}
              className="rounded-xl"
              data-testid={`card-admin-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="users" data-testid="tab-users">
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="games" data-testid="tab-game-stats">
            Game Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user._id}
                          data-testid={`row-user-${user._id}`}
                        >
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.isAdmin ? "default" : "secondary"}
                            >
                              {user.isAdmin ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">
                        New This Month
                      </span>
                      <span className="text-2xl font-bold">
                        {stats?.newUsersThisMonth || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">
                        Active Users
                      </span>
                      <span className="text-2xl font-bold">
                        {stats?.activeUsers || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Total Users</span>
                      <span className="text-2xl font-bold">
                        {stats?.totalUsers || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">
                  Content Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Total Notes</span>
                      <span className="text-2xl font-bold">
                        {stats?.totalNotes || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Total Tasks</span>
                      <span className="text-2xl font-bold">
                        {stats?.totalTasks || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">
                        Games Played
                      </span>
                      <span className="text-2xl font-bold">
                        {stats?.totalGames || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">
                Recent Game Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : gameStats.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Played At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameStats.map((game) => (
                        <TableRow
                          key={game.id}
                          data-testid={`row-game-${game.id}`}
                        >
                          <TableCell className="font-medium">
                            {game.gameName}
                          </TableCell>
                          <TableCell>{game.score}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                game.result === "win"
                                  ? "default"
                                  : game.result === "loss"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {game.result}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(game.playedAt), "MMM d, h:mm a")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No game activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
