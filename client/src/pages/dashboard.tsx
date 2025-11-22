import { FileText, CheckSquare, Gamepad2, Lock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface DashboardStats {
  totalNotes: number;
  totalTasks: number;
  completedTasks: number;
  gamesPlayed: number;
  encryptedMessages: number;
}

interface DashboardPageProps {
  stats?: DashboardStats;
  isLoading?: boolean;
  recentActivity?: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
  }>;
}

export default function DashboardPage({
  stats,
  isLoading,
  recentActivity = [],
}: DashboardPageProps) {
  const statCards = [
    {
      title: "Total Notes",
      value: stats?.totalNotes || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/notes",
    },
    {
      title: "Active Tasks",
      value: (stats?.totalTasks || 0) - (stats?.completedTasks || 0),
      icon: CheckSquare,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      link: "/tasks",
    },
    {
      title: "Games Played",
      value: stats?.gamesPlayed || 0,
      icon: Gamepad2,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      link: "/games",
    },
    {
      title: "Encrypted Messages",
      value: stats?.encryptedMessages || 0,
      icon: Lock,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      link: "/messages",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
              <Card
                className="rounded-xl hover-elevate cursor-pointer"
                data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
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
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover-elevate"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No recent activity yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start creating notes or tasks to see activity here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Quick Stats</CardTitle>
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
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Task Completion Rate
                  </span>
                  <span className="font-semibold">
                    {stats?.totalTasks
                      ? Math.round(
                          (stats.completedTasks / stats.totalTasks) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-semibold">
                    {(stats?.totalNotes || 0) + (stats?.totalTasks || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Encrypted Items
                  </span>
                  <span className="font-semibold">
                    {stats?.encryptedMessages || 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
