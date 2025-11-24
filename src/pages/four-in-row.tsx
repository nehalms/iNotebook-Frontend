import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Copy, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/store/sessionStore";
import { C4_SOCKET_URL, C4_BOOTSTRAP_URL, getApiUrl } from "@/lib/api/config";
import { handleApiError, type ApiErrorResponse } from "@/lib/utils/api-error-handler";
import SockJS from "sockjs-client";
import { over, Client } from "stompjs";

const ROWS = 7;
const COLS = 7;

type Player = "X" | "O" | "";
type Board = (number | null)[][];

interface UserStats {
  id: string;
  name: string;
  played: number;
  won: number;
  loss: number;
}

interface OppStats {
  id: string;
  name: string;
  played: number;
}

interface RoomDetails {
  id: string;
  joined: boolean;
}

export default function FourInRowPage() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, email } = useSessionStore();
  const { toast } = useToast();
  const detailsDiv = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [board, setBoard] = useState<Board>(
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null))
  );
  const [player, setPlayer] = useState<Player>("");
  const [currTurn, setTurn] = useState<Player>("X");
  const [gameComp, setComp] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [secondClk, setSecondClk] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [gameToken, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roomDetails, setRoomDetails] = useState<RoomDetails>({
    id: "",
    joined: false,
  });
  const [userstats, setStats] = useState<UserStats>({
    id: "",
    name: "",
    played: 0,
    won: 0,
    loss: 0,
  });
  const [oppStats, setOppStats] = useState<OppStats>({
    id: "",
    name: "Searching...",
    played: 0,
  });
  const stompClientRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }

    const socket = new SockJS(C4_SOCKET_URL);
    const stompClient = over(socket);

    stompClient.connect({}, (frame) => {
      console.log("Connected: " + frame);
      // Don't set connected here - only set when room is created/joined

      stompClient.subscribe(`/topic/oppPlayerDetails/${roomDetails.id}`, (message: any) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          const oppPlayer = userstats.id === data.player1.userId ? data.player2 : data.player1;
          toast({
            title: "Player Joined",
            description: `${oppPlayer.name} joined the game`,
          });
          setOppStats({
            id: oppPlayer.userId,
            name: oppPlayer.name,
            played: oppPlayer.gamesPlayed,
          });
          setBoard(data.board);
        }
      });

      stompClient.subscribe(`/topic/updatedGame/${roomDetails.id}`, (message: any) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          setBoard(data.board);
          setTurn(data.turn as Player);
          if (data.status === "FINISHED") {
            saveGameData(data);
            getPlayerData();
          }
        }
      });

      stompClient.subscribe(`/topic/resetGame/${roomDetails.id}`, (message: any) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          if (data && data.board && data.player1 && data.player2) {
            setBoard(data.board);
            setTurn(data.turn as Player);
            setComp(false);
            setPlayer(userstats.id === data.userIdX ? "X" : "O");
            if (
              userstats.id === data.userIdX &&
              sessionStorage.getItem("color") === "yellow"
            ) {
              setSelectedColor("red");
              sessionStorage.setItem("c4Color", "red");
            } else if (
              userstats.id === data.userIdO &&
              sessionStorage.getItem("color") === "red"
            ) {
              setSelectedColor("yellow");
              sessionStorage.setItem("c4Color", "yellow");
            }
            const storedColor = sessionStorage.getItem("c4Color");
            if (storedColor) {
              setSelectedColor(storedColor);
            }
            const oppPlayer = userstats.id === data.player1.userId ? data.player2 : data.player1;
            setOppStats({
              id: oppPlayer.userId,
              name: oppPlayer.name,
              played: oppPlayer.gamesPlayed,
            });
          }
        }
      });
    });

    stompClientRef.current = stompClient;

    // Always call getPlayerData to check for existing game
    getPlayerData();

    if (detailsDiv.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (detailsDiv.current) {
          setHeight(detailsDiv.current.offsetHeight);
        }
      });
      resizeObserver.observe(detailsDiv.current);

      return () => {
        resizeObserver.disconnect();
        if (stompClient.connected) {
          stompClient.disconnect(() => {});
        }
      };
    } else {
      return () => {
        if (stompClient.connected) {
          stompClient.disconnect(() => {});
        }
      };
    }
  }, [roomDetails.id, player, isLoggedIn]);

  const getPlayerData = async () => {
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
          return;
        }
      }
      const json = await response.json();
      setToken(json.authToken);
      const data = json.stats;
      if (data && data.frnRowStats) {
        setStats({
          id: data.userId,
          name: data.userName,
          played: data.frnRowStats.played,
          won: data.frnRowStats.won,
          loss: data.frnRowStats.lost,
        });
        if (sessionStorage.getItem("c4RoomId")) {
          await getGameStatus(data, json.authToken);
        }
      }
    } catch (err) {
      console.log("Error** ", err);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    }
  };

  const getGameStatus = async (user: any, token: string | null = null) => {
    try {
      const storedRoomId = sessionStorage.getItem("c4RoomId");
      if (!storedRoomId || connected) {
        return;
      }
      const response = await fetch(
        `${C4_BOOTSTRAP_URL}/game/getStatus?gameId=${storedRoomId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authToken: token ? token : gameToken,
          },
          body: JSON.stringify({
            userId: user.userId,
            name: user.userName,
            gamesPlayed: user.frnRowStats.played,
          }),
        }
      );
      if (response.status === 401) {
        const error: ApiErrorResponse = await response.json();
        if (handleApiError(response, error)) {
          return;
        }
      }
      if (response.status === 403) {
        toast({
          title: "Forbidden",
          description: "You don't have permission to perform this action",
          variant: "destructive",
        });
        return;
      }
      const data = await response.json();
      if (data.statusCode === 400 || data.statusCode === 500) {
        return;
      }
      if (data) {
        setConnected(true);
        setRoomDetails({ id: data.gameId, joined: true });
        setBoard(data.board);
        setTurn(data.turn as Player);
        setComp(false);
        setSelectedColor(sessionStorage.getItem("c4Color") || "");
        setPlayer(user.userId === data.userIdX ? "X" : "O");
        const oppPlayer = user.userId === data.player1.userId ? data.player2 : data.player1;
        if (oppPlayer) {
          setOppStats({
            id: oppPlayer.userId,
            name: oppPlayer.name,
            played: oppPlayer.gamesPlayed,
          });
        }
        toast({
          title: "Status Restored",
          description: "Previous game state restored",
        });
        sessionStorage.setItem("c4RoomId", data.gameId);
      }
    } catch (err) {
      console.log("Error** ", err);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      let response = await fetch(`${C4_BOOTSTRAP_URL}/game/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authToken: gameToken,
        },
        body: JSON.stringify({
          userId: userstats.id,
          name: userstats.name,
          gamesPlayed: userstats.played,
        }),
      });
      if (response.status === 401) {
        const error: ApiErrorResponse = await response.json();
        if (handleApiError(response, error)) {
          return;
        }
      }
      if (response.status === 403) {
        toast({
          title: "Forbidden",
          description: "You don't have permission to perform this action",
          variant: "destructive",
        });
        return;
      }
      let data = await response.json();
      if (data.statusCode === 400) {
        toast({
          title: "Info",
          description: data.message,
        });
        return;
      }
      if (data) {
        setConnected(true);
        setRoomDetails({ id: data.gameId, joined: true });
        setPlayer("X");
        setSelectedColor("red");
        sessionStorage.setItem("c4Color", "red");
        toast({
          title: "Success",
          description: "Room created",
        });
        sessionStorage.setItem("c4RoomId", data.gameId);
      }
    } catch (err) {
      console.log("Error***", err);
      toast({
        title: "Error",
        description: "Internal server error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setIsLoading(true);
    try {
      let response = await fetch(`${C4_BOOTSTRAP_URL}/game/connect?gameId=${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authToken: gameToken,
        },
        body: JSON.stringify({
          userId: userstats.id,
          name: userstats.name,
          gamesPlayed: userstats.played,
        }),
      });
      if (response.status === 401) {
        const error: ApiErrorResponse = await response.json();
        if (handleApiError(response, error)) {
          return;
        }
      }
      let data = await response.json();
      if (data.statusCode === 400) {
        toast({
          title: "Info",
          description: data.message,
        });
        return;
      }
      if (data) {
        setConnected(true);
        setBoard(data.board);
        setRoomDetails({ id: data.gameId, joined: true });
        setPlayer("O");
        setSelectedColor("yellow");
        sessionStorage.setItem("c4Color", "yellow");
        toast({
          title: "Success",
          description: `Joined ${data.player1.name}'s room`,
        });
        sessionStorage.setItem("c4RoomId", data.gameId);
        setOppStats({
          id: data.player1.userId,
          name: data.player1.name,
          played: data.player1.gamesPlayed,
        });
      }
    } catch (err) {
      console.log("Error***", err);
      toast({
        title: "Error",
        description: "Internal server error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitRoom = () => {
    sessionStorage.removeItem("c4RoomId");
    sessionStorage.removeItem("c4Color");
    setConnected(false);
    setRoomDetails({ id: "", joined: false });
    setPlayer("");
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setTurn("X");
    setComp(false);
    setSelectedColor("");
    setOppStats({
      id: "",
      name: "Searching...",
      played: 0,
    });
    toast({
      title: "Room Exited",
      description: "You have left the room",
    });
  };

  const handleClick = async (col: number) => {
    if (gameComp) {
      return;
    }
    if (player != currTurn) {
      toast({
        title: "Warning",
        description: "Opponent player turn",
        variant: "default",
      });
      return;
    }
    if (secondClk === true) {
      return;
    }

    let row_: number | undefined;
    let col_ = col;
    setSecondClk(true);
    const newBoard = board.map((row) => [...row]);
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = currTurn === "X" ? 1 : currTurn === "O" ? 2 : 0;
        row_ = row;
        setBoard(newBoard);
        break;
      }
    }

    try {
      let response = await fetch(`${C4_BOOTSTRAP_URL}/game/gameplay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authToken: gameToken,
        },
        body: JSON.stringify({
          type: player,
          gameId: roomDetails.id,
          coordinateX: row_,
          coordinateY: col_,
        }),
      });
      if (response.status === 401) {
        const error: ApiErrorResponse = await response.json();
        if (handleApiError(response, error)) {
          return;
        }
      }
      let data = await response.json();
      if (data.statusCode === 400) {
        toast({
          title: "Info",
          description: data.message,
        });
        return;
      }
      if (data) {
        setTurn(data.turn as Player);
      }
    } catch (err) {
      console.log("Error***", err);
      toast({
        title: "Error",
        description: "Internal server error",
        variant: "destructive",
      });
    } finally {
      setSecondClk(false);
    }
  };

  const saveGameData = async (data: any) => {
    try {
      setComp(true);
      if (data.winner != "DRAW") {
        const idxs = data.winnerIdxs;
        const newBoard = data.board;
        idxs.forEach((idx: string) => {
          const val = idx.split(":");
          newBoard[parseInt(val[0])][parseInt(val[1])] =
            data.board[parseInt(val[0])][parseInt(val[1])] === 1 ? 10 : 20;
        });
        setBoard(newBoard);
        if (
          (data.winner === "X" && data.userIdX === userstats.id) ||
          (data.winner === "O" && data.userIdO === userstats.id)
        ) {
          toast({
            title: "Congratulations!",
            description: "You won the game",
          });
        } else {
          toast({
            title: "Game Over",
            description: "You lost the game",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.log("Error***", err);
      toast({
        title: "Error",
        description: "Internal server error",
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    try {
      let response = await fetch(`${C4_BOOTSTRAP_URL}/game/reset?gameId=${roomDetails.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authToken: gameToken,
        },
      });
      if (response.status === 401) {
        const error: ApiErrorResponse = await response.json();
        if (handleApiError(response, error)) {
          return;
        }
      }
      let data = await response.json();
      if (data.statusCode == 400) {
        toast({
          title: "Info",
          description: data.message,
        });
        return;
      }
      if (data) {
        setBoard(data.board);
        setTurn(data.turn as Player);
        setComp(false);
      }
    } catch (err) {
      console.log("Error***", err);
      toast({
        title: "Error",
        description: "Internal server error",
        variant: "destructive",
      });
    }
  };

  const renderSquare = (row: number, col: number) => {
    const isFilled = board[row][col];
    const isWinningCell = isFilled === 10 || isFilled === 20;
    let color = "white";
    if (isFilled === 1) {
      color = player === "X" ? selectedColor || "red" : "red";
    } else if (isFilled === 2) {
      color = player === "O" ? selectedColor || "yellow" : "yellow";
    } else if (isWinningCell) {
      color = isFilled === 10
        ? player === "X" ? selectedColor || "red" : "red"
        : player === "O" ? selectedColor || "yellow" : "yellow";
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`w-12 h-12 rounded-full border-2 cursor-pointer hover:border-primary transition-all flex-shrink-0 relative ${
          isWinningCell 
            ? "border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" 
            : "border-border"
        }`}
        onClick={() => handleClick(col)}
        style={{
          backgroundColor: "white",
        }}
        data-testid={`cell-${row}-${col}`}
      >
        {isFilled ? (
          <div
            className="absolute inset-1 rounded-full"
            style={{
              backgroundColor: color,
              animation: "dropDisc 0.5s ease-out",
            }}
          />
        ) : null}
      </div>
    );
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomDetails.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colors = ["green", "blue", "orange", "cyan"];

  return (
    <>
      <style>{`
        @keyframes dropDisc {
          0% {
            transform: translateY(-850%);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-chart-4/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="icon" data-testid="button-back-to-games">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold font-serif">Four in a Row (Connect 4)</h1>
            <p className="text-muted-foreground text-lg">Connect Four Discs to Win</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">Game Board</CardTitle>
                  {roomDetails.joined && (
                    <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      New Game
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {player !== "" ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge variant="secondary" className="text-base px-4 py-1">
                        You are player {player} | Current Turn: {currTurn}
                      </Badge>
                    </div>
                    <div className="flex justify-center p-2 sm:p-3 md:p-4 lg:p-6 rounded-xl bg-primary/5 w-full min-w-0 overflow-x-auto">
                      <div className="inline-block min-w-0">
                        <div className="space-y-0.5 sm:space-y-1">
                          {board.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex gap-0.5 sm:gap-1 md:gap-1.5 justify-center flex-nowrap">
                              {row.map((_, colIndex) => renderSquare(rowIndex, colIndex))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <h3 className="text-xl font-semibold">The goal of the game</h3>
                    <p className="text-muted-foreground">
                      The goal of the game Four in a Row, also known as Connect 4, is to be the first player to connect four of their colored discs in a row, either horizontally, vertically, or diagonally
                    </p>
                    <Button onClick={handleCreateRoom} disabled={gameToken === "" || isLoading} className="gap-2">
                      {isLoading ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Four in a Row (Connect 4)</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sm text-muted-foreground">
                      {connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!roomDetails.joined ? (
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Room Id"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleJoinRoom} disabled={!roomId || gameToken === "" || isLoading}>
                      {isLoading ? "Joining..." : "Join"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="text-sm flex-1">Room ID: <strong>{roomDetails.id}</strong></span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyRoomId}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={handleExitRoom}
                      title="Exit Room"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={detailsDiv}>
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Opponent Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Player Name:</span>
                    <span>{oppStats.name}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Games Played:</span>
                    <span>{oppStats.played}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Game Stats {userstats.name ? `(${userstats.name})` : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Games Played:</span>
                    <span>{userstats.played}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Games Won:</span>
                    <span>{userstats.won}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Games Lost:</span>
                    <span>{userstats.loss}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {player && (
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Choose your color</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedColor && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-primary flex-shrink-0"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <div>
                          <p className="text-sm font-medium">Selected</p>
                          <p className="text-xs text-muted-foreground capitalize">{selectedColor}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {player === "X" ? (
                        <div
                          className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all ${
                            selectedColor === "red" ? "border-primary scale-110" : "border-border hover:border-primary"
                          }`}
                          style={{ backgroundColor: "red" }}
                          onClick={() => {
                            setSelectedColor("red");
                            sessionStorage.setItem("c4Color", "red");
                          }}
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all ${
                            selectedColor === "yellow" ? "border-primary scale-110" : "border-border hover:border-primary"
                          }`}
                          style={{ backgroundColor: "yellow" }}
                          onClick={() => {
                            setSelectedColor("yellow");
                            sessionStorage.setItem("c4Color", "yellow");
                          }}
                        />
                      )}
                      {colors.map((color) => (
                        <div
                          key={color}
                          className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all ${
                            selectedColor === color ? "border-primary scale-110" : "border-border hover:border-primary"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setSelectedColor(color);
                            sessionStorage.setItem("c4Color", color);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
