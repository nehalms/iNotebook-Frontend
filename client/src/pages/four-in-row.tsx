import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Player = "red" | "yellow" | null;
type Board = Player[][];

const ROWS = 6;
const COLS = 7;

export default function FourInRowPage() {
  const [board, setBoard] = useState<Board>(
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "yellow">("red");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [score, setScore] = useState({ red: 0, yellow: 0, draws: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (lastMove) {
      checkWinner(lastMove.row, lastMove.col);
    }
  }, [lastMove]);

  const checkWinner = (row: number, col: number) => {
    const player = board[row][col];
    if (!player) return;

    // Check horizontal
    if (checkDirection(row, col, 0, 1, player) || 
        checkDirection(row, col, 0, -1, player)) {
      declareWinner(player);
      return;
    }

    // Check vertical
    if (checkDirection(row, col, 1, 0, player) || 
        checkDirection(row, col, -1, 0, player)) {
      declareWinner(player);
      return;
    }

    // Check diagonal (top-left to bottom-right)
    if (checkDirection(row, col, 1, 1, player) || 
        checkDirection(row, col, -1, -1, player)) {
      declareWinner(player);
      return;
    }

    // Check diagonal (top-right to bottom-left)
    if (checkDirection(row, col, 1, -1, player) || 
        checkDirection(row, col, -1, 1, player)) {
      declareWinner(player);
      return;
    }

    // Check for draw
    if (board.every((row) => row.every((cell) => cell !== null))) {
      setWinner("draw");
      setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
      toast({
        title: "It's a Draw!",
        description: "The board is full. Try again!",
      });
    }
  };

  const checkDirection = (
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    player: Player
  ): boolean => {
    let count = 1;

    for (let i = 1; i < 4; i++) {
      const newRow = row + dRow * i;
      const newCol = col + dCol * i;

      if (
        newRow < 0 ||
        newRow >= ROWS ||
        newCol < 0 ||
        newCol >= COLS ||
        board[newRow][newCol] !== player
      ) {
        break;
      }
      count++;
    }

    return count >= 4;
  };

  const declareWinner = (player: Player) => {
    setWinner(player);
    setScore((prev) => ({
      ...prev,
      [player!]: prev[player!] + 1,
    }));
    toast({
      title: `${player.charAt(0).toUpperCase() + player.slice(1)} Wins! 🎉`,
      description: `Congratulations! You won in ${moveCount} moves.`,
    });
  };

  const handleColumnClick = (col: number) => {
    if (winner) return;

    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        const newBoard = board.map((r) => [...r]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);
        setLastMove({ row, col });
        setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red");
        setMoveCount(moveCount + 1);
        return;
      }
    }
  };

  const resetGame = () => {
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null))
    );
    setCurrentPlayer("red");
    setWinner(null);
    setMoveCount(0);
    setLastMove(null);
  };

  const resetScore = () => {
    setScore({ red: 0, yellow: 0, draws: 0 });
    resetGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-chart-4/10 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="icon" data-testid="button-back-to-games">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold font-serif">Four in a Row</h1>
            <p className="text-muted-foreground text-lg">Connect Four Discs to Win</p>
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
                    <Badge
                      variant="secondary"
                      className={`text-base px-4 py-1 ${
                        currentPlayer === "red"
                          ? "bg-destructive/10 text-destructive border-destructive"
                          : "bg-chart-4/10 text-chart-4 border-chart-4"
                      }`}
                    >
                      Current: {currentPlayer}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="inline-block p-6 rounded-xl bg-primary/5">
                  <div className="grid grid-cols-7 gap-2">
                    {board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleColumnClick(colIndex)}
                          disabled={!!winner}
                          className={`w-14 h-14 rounded-full border-2 transition-all ${
                            cell === "red"
                              ? "bg-destructive border-destructive shadow-lg"
                              : cell === "yellow"
                                ? "bg-chart-4 border-chart-4 shadow-lg"
                                : "bg-card border-border hover:border-primary hover-elevate"
                          } ${!cell && !winner ? "cursor-pointer" : "cursor-not-allowed"}`}
                          data-testid={`cell-${rowIndex}-${colIndex}`}
                        />
                      ))
                    )}
                  </div>
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <span className="font-medium text-destructive">Red Player</span>
                  <span className="text-2xl font-bold text-destructive">{score.red}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-chart-4/10">
                  <span className="font-medium text-chart-4">Yellow Player</span>
                  <span className="text-2xl font-bold text-chart-4">{score.yellow}</span>
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
                  <span className="font-medium">{score.red + score.yellow + score.draws}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate (Red)</span>
                  <span className="font-medium">
                    {score.red + score.yellow + score.draws > 0
                      ? Math.round(
                          (score.red / (score.red + score.yellow + score.draws)) * 100
                        )
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
                <p>• Click a column to drop your disc</p>
                <p>• Connect 4 discs in a row to win</p>
                <p>• Can be horizontal, vertical, or diagonal</p>
                <p>• Plan ahead and block your opponent!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
