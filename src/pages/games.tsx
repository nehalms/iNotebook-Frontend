import { useEffect, useState } from "react";
import PermissionDenied from "./permission-denied";
import { Trophy, Play, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api/config";
import { handleApiError, type ApiErrorResponse } from "@/lib/utils/api-error-handler";
import { useSessionStore } from "@/store/sessionStore";

interface GameStats {
  gameName: string;
  totalPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  bestScore: number;
}

export default function GamesPage() {
  const { isLoggedIn, permissions } = useSessionStore();
  
  if (!permissions.includes("games")) {
    return <PermissionDenied permission="games" />;
  }
  const { toast } = useToast();
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const games = [
    {
      id: "tic-tac-toe",
      name: "Tic-Tac-Toe",
      description: "Classic 3x3 grid strategy game",
      icon: Target,
      color: "bg-primary/10 text-primary",
      path: "/games/tic-tac-toe",
    },
    {
      id: "four-in-row",
      name: "Four-in-Row",
      description: "Connect four discs in a row to win",
      icon: Trophy,
      color: "bg-chart-3/10 text-chart-3",
      path: "/games/four-in-row",
    },
  ];

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    fetchGameStats();
  }, [isLoggedIn]);

  const fetchGameStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl("game/getStats"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        const error: ApiErrorResponse = await response.json();
        if (handleApiError(response, error)) {
          setIsLoading(false);
          return;
        }
      }

      const json = await response.json();
      const data = json.stats;

      if (data) {
        const stats: GameStats[] = [];
        
        // Tic-Tac-Toe stats
        if (data.tttStats) {
          stats.push({
            gameName: "tic-tac-toe",
            totalPlayed: data.tttStats.played || 0,
            wins: data.tttStats.won || 0,
            losses: data.tttStats.lost || 0,
            draws: 0,
            bestScore: data.tttStats.won || 0,
          });
        }

        // Connect4 stats
        if (data.frnRowStats) {
          stats.push({
            gameName: "four-in-row",
            totalPlayed: data.frnRowStats.played || 0,
            wins: data.frnRowStats.won || 0,
            losses: data.frnRowStats.lost || 0,
            draws: 0,
            bestScore: data.frnRowStats.won || 0,
          });
        }

        setGameStats(stats);
      }
    } catch (err) {
      console.error("Error fetching game stats:", err);
      toast({
        title: "Error",
        description: "Failed to fetch game statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGameStats = (gameName: string) => {
    return gameStats.find((s) => s.gameName === gameName);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold font-serif mb-2">Games</h1>
        <p className="text-muted-foreground text-lg">
          Take a break and challenge yourself
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => {
          const Icon = game.icon;
          const stats = getGameStats(game.id);

          return isLoading ? (
            <Card key={game.id} className="rounded-2xl">
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Link key={game.id} href={game.path}>
              <Card
                className="rounded-2xl hover-elevate cursor-pointer group"
                data-testid={`card-game-${game.id}`}
              >
                <CardHeader className="pb-4">
                  <div
                    className={`h-32 ${game.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="h-16 w-16" />
                  </div>
                  <CardTitle className="text-2xl font-serif">
                    {game.name}
                  </CardTitle>
                  <p className="text-muted-foreground">{game.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Games Played
                        </span>
                        <span className="font-medium">{stats.totalPlayed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Wins</span>
                        <span className="font-medium text-chart-2">
                          {stats.wins}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Losses</span>
                        <span className="font-medium text-destructive">
                          {stats.losses}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Win Rate</span>
                        <Badge variant="secondary">
                          {stats.totalPlayed > 0
                            ? Math.round((stats.wins / stats.totalPlayed) * 100)
                            : 0}%
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No games played yet
                    </p>
                  )}

                  <Button className="w-full h-12 gap-2" data-testid={`button-play-${game.id}`}>
                    <Play className="h-5 w-5" />
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {gameStats.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif flex items-center gap-2">
              <Trophy className="h-6 w-6 text-chart-4" />
              Your Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold mb-1">
                  {gameStats.reduce((sum, s) => sum + s.totalPlayed, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Games</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold mb-1 text-chart-2">
                  {gameStats.reduce((sum, s) => sum + s.wins, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Wins</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold mb-1">
                  {gameStats.length > 0
                    ? Math.round(
                        (gameStats.reduce((sum, s) => sum + s.wins, 0) /
                          gameStats.reduce((sum, s) => sum + s.totalPlayed, 0)) *
                          100
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
