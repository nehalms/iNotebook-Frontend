import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionStore } from "@/store/sessionStore";
import { getDashboardStats, type DashboardStats } from "@/lib/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  CheckSquare,
  Gamepad2,
  Calendar,
  TrendingUp,
  Trophy,
  Target,
  Clock,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn } = useSessionStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    fetchDashboardStats();
  }, [isLoggedIn, setLocation]);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const response = await getDashboardStats();
      if (response.status === 1 && response.data) {
        setStats(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load dashboard",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Notes",
      value: stats?.notes.total || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/notes",
    },
    {
      title: "Total Tasks",
      value: stats?.tasks.total || 0,
      icon: CheckSquare,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      link: "/tasks",
      subtitle: `${stats?.tasks.totalSubtasks || 0} subtasks`,
    },
    {
      title: "Games Played",
      value: stats?.games.totalPlayed || 0,
      icon: Gamepad2,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      link: "/games",
      subtitle: `${stats?.games.ticTacToe.won + stats?.games.connect4.won || 0} wins`,
    },
    {
      title: "Calendar Events",
      value: stats?.calendar.eventsCount || 0,
      icon: Calendar,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      link: "/calendar",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold font-serif mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back! Here's an overview of your activity
        </p>
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
            <Link key={stat.title} href={stat.link}>
                <Card className="rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                        {stat.subtitle && (
                          <p className="text-xs text-muted-foreground">
                            {stat.subtitle}
                          </p>
                        )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subtask Completion Rate */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Target className="h-5 w-5" />
                Subtask Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Completion Rate
                      </span>
                      <span className="text-2xl font-bold">
                        {stats?.tasks.completionRate || 0}%
                      </span>
                    </div>
                    <Progress
                      value={stats?.tasks.completionRate || 0}
                      className="h-3"
                    />
                    {stats?.tasks.totalSubtasks !== undefined && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {stats.tasks.completedSubtasks || 0} of {stats.tasks.totalSubtasks || 0} subtasks completed
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 rounded-lg bg-chart-2/10">
                      <p className="text-2xl font-bold text-chart-2">
                        {stats?.tasks.completedSubtasks || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold">
                        {stats?.tasks.activeSubtasks || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Stats */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Game Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Tic-Tac-Toe</span>
                      <Badge variant="secondary">
                        {stats?.games.ticTacToe.played || 0} played
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">
                        {stats?.games.ticTacToe.won || 0} wins
                      </span>
                      <span className="text-red-600">
                        {stats?.games.ticTacToe.lost || 0} losses
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Connect 4</span>
                      <Badge variant="secondary">
                        {stats?.games.connect4.played || 0} played
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">
                        {stats?.games.connect4.won || 0} wins
                      </span>
                      <span className="text-red-600">
                        {stats?.games.connect4.lost || 0} losses
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Total Items</span>
                    <span className="font-semibold text-lg">
                      {(stats?.notes.total || 0) + (stats?.tasks.total || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Upcoming Events</span>
                    <span className="font-semibold text-lg">
                      {stats?.calendar.eventsCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Total Games</span>
                    <span className="font-semibold text-lg">
                      {stats?.games.totalPlayed || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="relative">
                {/* Timeline line - positioned behind icons */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" style={{ zIndex: 1 }} />
                
                <div className="space-y-6 relative">
                  {stats.recentActivity.map((activity, index) => {
                    // Determine icon and color based on activity type
                    const getActivityIcon = (action: string) => {
                      const lowerAction = action.toLowerCase();
                      if (lowerAction.includes("note")) {
                        return { icon: FileText, color: "text-primary", bg: "bg-background", borderColor: "border-primary/30", iconBg: "bg-primary/10" };
                      } else if (lowerAction.includes("task")) {
                        return { icon: CheckSquare, color: "text-chart-2", bg: "bg-background", borderColor: "border-chart-2/30", iconBg: "bg-chart-2/10" };
                      } else if (lowerAction.includes("event") || lowerAction.includes("calendar")) {
                        return { icon: Calendar, color: "text-chart-4", bg: "bg-background", borderColor: "border-chart-4/30", iconBg: "bg-chart-4/10" };
                      } else if (lowerAction.includes("game")) {
                        return { icon: Gamepad2, color: "text-chart-3", bg: "bg-background", borderColor: "border-chart-3/30", iconBg: "bg-chart-3/10" };
                      }
                      return { icon: Activity, color: "text-muted-foreground", bg: "bg-background", borderColor: "border-muted", iconBg: "bg-muted" };
                    };

                    const { icon: ActivityIcon, color, bg, borderColor, iconBg } = getActivityIcon(activity.type);

                    return (
                      <div key={activity.id} className="relative flex gap-4 items-start group">
                        {/* Timeline dot with solid background to cover the line */}
                        <div className="relative flex-shrink-0" style={{ zIndex: 10 }}>
                          <div className={`w-12 h-12 rounded-full ${bg} border-2 ${borderColor} flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
                            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                              <ActivityIcon className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pt-1 pb-6">
                          <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-all group-hover:border-primary/50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-semibold text-base mb-1">{activity.title}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{activity.timestamp}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No recent activity yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start creating notes or tasks to see activity here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
