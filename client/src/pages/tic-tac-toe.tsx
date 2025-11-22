import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Player = "X" | "O" | null;
type Board = Player[];

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const { toast } = useToast();

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
  ];

  useEffect(() => {
    checkWinner();
  }, [board]);

  const checkWinner = () => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        setScore((prev) => ({
          ...prev,
          [board[a]!]: prev[board[a]!] + 1,
        }));
        toast({
          title: `Player ${board[a]} Wins! 🎉`,
          description: `Congratulations! You won in ${moveCount} moves.`,
        });
        return;
      }
    }

    if (board.every((cell) => cell !== null)) {
      setWinner("draw");
      setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
      toast({
        title: "It's a Draw!",
        description: "Well played! Try again.",
      });
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    setMoveCount(moveCount + 1);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setMoveCount(0);
  };

  const resetScore = () => {
    setScore({ X: 0, O: 0, draws: 0 });
    resetGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="icon" data-testid="button-back-to-games">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold font-serif">Tic-Tac-Toe</h1>
            <p className="text-muted-foreground text-lg">Classic 3x3 Strategy Game</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">Game Board</CardTitle>
                  {winner ? (
                    <Badge variant="default" className="text-base px-4 py-1">
                      {winner === "draw" ? "Draw!" : `${winner} Wins!`}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-base px-4 py-1">
                      Current: {currentPlayer}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  {board.map((cell, index) => (
                    <button
                      key={index}
                      onClick={() => handleCellClick(index)}
                      disabled={!!cell || !!winner}
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center text-5xl font-bold transition-all ${
                        cell === "X"
                          ? "bg-primary/10 border-primary text-primary"
                          : cell === "O"
                            ? "bg-chart-3/10 border-chart-3 text-chart-3"
                            : "bg-card border-border hover:border-primary hover-elevate active-elevate-2"
                      } ${!cell && !winner ? "cursor-pointer" : "cursor-not-allowed"}`}
                      data-testid={`cell-${index}`}
                    >
                      {cell}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6 justify-center">
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    className="h-12 gap-2"
                    data-testid="button-new-game"
                  >
                    <RotateCcw className="h-5 w-5" />
                    New Game
                  </Button>
                  <Button
                    onClick={resetScore}
                    variant="secondary"
                    className="h-12"
                    data-testid="button-reset-score"
                  >
                    Reset Score
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-chart-4" />
                  Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <span className="font-medium text-primary">Player X</span>
                  <span className="text-2xl font-bold text-primary">{score.X}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-chart-3/10">
                  <span className="font-medium text-chart-3">Player O</span>
                  <span className="text-2xl font-bold text-chart-3">{score.O}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="font-medium text-muted-foreground">Draws</span>
                  <span className="text-2xl font-bold">{score.draws}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl font-serif">Game Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moves Played</span>
                  <span className="font-medium">{moveCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Games</span>
                  <span className="font-medium">{score.X + score.O + score.draws}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate (X)</span>
                  <span className="font-medium">
                    {score.X + score.O + score.draws > 0
                      ? Math.round((score.X / (score.X + score.O + score.draws)) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-serif">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Players take turns placing X or O</p>
                <p>• Get 3 in a row to win</p>
                <p>• Rows, columns, or diagonals count</p>
                <p>• If board fills with no winner, it's a draw</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
