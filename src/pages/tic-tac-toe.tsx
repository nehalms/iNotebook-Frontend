import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Copy, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/store/sessionStore";
import { SOCKET_URL, BOOTSTRAP_URL, getApiUrl } from "@/lib/api/config";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import { ApiErrorResponse, handleApiError } from "@/lib/utils/api-error-handler";
import Countdown from "@/components/count-down";

type Player = "X" | "O" | "";
type Board = (Player | null)[];

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

export default function TicTacToePage() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, email } = useSessionStore();
  const { toast } = useToast();
  const detailsDiv = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [player, setPlayer] = useState<Player>("");
  const [currTurn, setTurn] = useState<Player>("X");
  const [gameComp, setComp] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [secondClk, setSecondClk] = useState(false);
  const [vsBot, setVsBot] = useState(false);
  const [gameToken, setToken] = useState("");
  const [isLoading, setIsLoading] = useState<null | 'create' | 'computer' | 'restore'>(null);
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
  const [gameStatus, setGameStatus] = useState<"FINISHED" | "">("");
  
  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }

    const socket = new SockJS(SOCKET_URL);
    const stompClient = over(socket);

    stompClient.connect({}, (frame: any) => {
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
          setBoardFunc(data.board);
        }
      });

      stompClient.subscribe(`/topic/updatedGame/${roomDetails.id}`, (message: any) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          setBoardFunc(data.board);
          setTurn(data.turn as Player);
          if (data.status === "FINISHED") {
            setGameStatus("FINISHED");
            saveGameData(data);
            getPlayerData();
          }
        }
      });

      stompClient.subscribe(`/topic/resetGame/${roomDetails.id}`, (message: any) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          if (data && data.board && data.player1 && data.player2) {
            setBoardFunc(data.board);
            setTurn(data.turn as Player);
            setComp(false);
            setPlayer(userstats.id === data.userIdX ? "X" : "O");
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
      if (data && data.tttStats) {
        setStats({
          id: data.userId,
          name: data.userName,
          played: data.tttStats.played,
          won: data.tttStats.won,
          loss: data.tttStats.lost,
        });
        if (sessionStorage.getItem("tttRoomId")) {
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
      setIsLoading('restore');
      const storedRoomId = sessionStorage.getItem("tttRoomId");
      if (!storedRoomId || connected) {
        return;
      }
      const response = await fetch(
        `${BOOTSTRAP_URL}/game/getStatus?gameId=${storedRoomId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authToken: token ? token : gameToken,
          },
          body: JSON.stringify({
            userId: user.userId,
            name: user.userName,
            gamesPlayed: user.tttStats.played,
          }),
        }
      );
      if (response.status === 401) {
        const error: ApiErrorResponse = await response.json();
        if (handleApiError(response, error)) {
          return;
        }
      }
      const data = await response.json();
      if (data.statusCode == 400 || data.statusCode == 500) {
        return;
      }
      if (data) {
        setConnected(true);
        setRoomDetails({ id: data.gameId, joined: true });
        setBoardFunc(data.board);
        setTurn(data.turn as Player);
        setComp(false);
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
        sessionStorage.setItem("tttRoomId", data.gameId);
      }
    } catch (err) {
      console.log("Error** ", err);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleCreateRoom = async () => {
    setVsBot(false);
    setIsLoading('create');
    try {
      let response = await fetch(`${BOOTSTRAP_URL}/game/start`, {
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
      if (data.statusCode == 400) {
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
        toast({
          title: "Success",
          description: "Room created",
        });
        sessionStorage.setItem("tttRoomId", data.gameId);
      }
    } catch (err) {
      console.log("Error***", err);
      toast({
        title: "Error",
        description: "Internal server error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleJoinRoom = async () => {
    setVsBot(false);
    try {
      let response = await fetch(`${BOOTSTRAP_URL}/game/connect?gameId=${roomId}`, {
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
      if (data.statusCode == 400) {
        toast({
          title: "Info",
          description: data.message,
        });
        return;
      }
      if (data) {
        setConnected(true);
        setBoardFunc(data.board);
        setRoomDetails({ id: data.gameId, joined: true });
        setPlayer("O");
        toast({
          title: "Success",
          description: `Joined ${data.player1.name}'s room`,
        });
        sessionStorage.setItem("tttRoomId", data.gameId);
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
    }
  };

  const handleExitRoom = () => {
    sessionStorage.removeItem("tttRoomId");
    setConnected(false);
    setRoomDetails({ id: "", joined: false });
    setPlayer("");
    setBoard(Array(9).fill(null));
    setTurn("X");
    setComp(false);
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

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
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
    const target = e.currentTarget;
    if (!target.id) {
      return;
    }
    const index = parseInt(target.id) - 1;
    if (board[index] != null) {
      return;
    }
    setSecondClk(true);
    const row = target.getAttribute("data-row");
    const col = target.getAttribute("data-col");
    const newBoard = [...board];
    newBoard[3 * parseInt(row || "0") + parseInt(col || "0")] = currTurn;
    setBoard(newBoard);
    try {
      let response = await fetch(`${BOOTSTRAP_URL}/game/gameplay${vsBot ? "/bot" : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authToken: gameToken,
        },
        body: JSON.stringify({
          type: player,
          gameId: roomDetails.id,
          coordinateX: row,
          coordinateY: col,
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
      if (data.statusCode == 400) {
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
        const cells = document.querySelectorAll('[id^="cell-"]');
        idxs.forEach((idx: number) => {
          const cell = document.getElementById(String(idx + 1));
          if (cell) {
            cell.style.backgroundColor = "#96fa7d";
          }
        });
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
      setGameStatus("");
      // Reset all cell backgrounds to white
      for (let i = 1; i <= 9; i++) {
        const cell = document.getElementById(String(i));
        if (cell) {
          cell.style.backgroundColor = "white";
        }
      }
      let response = await fetch(`${BOOTSTRAP_URL}/game/reset?gameId=${roomDetails.id}`, {
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
      if (response.status === 403) {
        toast({
          title: "Forbidden",
          description: "You don't have permission to perform this action",
          variant: "destructive",
        });
        return;
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
        setBoardFunc(data.board);
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

  const handlePlayvsBot = async () => {
    setVsBot(true);
    setIsLoading('computer');
    try {
      let response = await fetch(`${BOOTSTRAP_URL}/game/create/bot`, {
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
      if (data.statusCode == 400) {
        toast({
          title: "Info",
          description: data.message,
        });
        return;
      }
      if (data) {
        setPlayer("O");
        setConnected(true);
        setRoomDetails({ id: data.gameId, joined: true });
        setTurn(data.turn as Player);
        setBoardFunc(data.board);
        toast({
          title: "Success",
          description: "Room created",
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
      setIsLoading(null);
    }
  };

  const setBoardFunc = (board: number[][]) => {
    const resBoard: (Player | null)[] = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        resBoard.push(
          board[i][j] == 1 ? "X" : board[i][j] == 2 ? "O" : null
        );
      }
    }
    setBoard(resBoard);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomDetails.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="icon" data-testid="button-back-to-games">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold font-serif">Tic - Tac - Toe</h1>
            <p className="text-muted-foreground text-lg">Classic 3x3 Strategy Game</p>
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
              <CardContent>
                {player !== "" ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge variant="secondary" className="text-base px-4 py-1">
                        { gameStatus === 'FINISHED' ? (<Countdown startSeconds={5} message="New game starting in" onFinish={handleReset} />) :  
                          (`You are player ${player} | Current Turn: ${currTurn}`)
                        }
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto w-full">
                      {[0, 1, 2].map((row) => (
                        <React.Fragment key={row}>
                          {[0, 1, 2].map((col) => {
                            const index = row * 3 + col;
                            return (
                              <div
                                key={index}
                                id={String(index + 1)}
                                data-row={String(row)}
                                data-col={String(col)}
                                onClick={handleClick}
                                className={`aspect-square rounded-xl border-2 flex items-center justify-center text-5xl font-bold transition-all cursor-pointer ${
                                  board[index] === "X"
                                    ? "bg-blue-500/20 border-blue-500 text-blue-600"
                                    : board[index] === "O"
                                    ? "bg-red-500/20 border-red-500 text-red-600"
                                    : "bg-card border-border hover:border-primary hover-elevate"
                                }`}
                                style={{ backgroundColor: board[index] ? undefined : "white" }}
                                data-testid={`cell-${index}`}
                              >
                                {board[index]}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <h3 className="text-xl font-semibold">The objective of the game</h3>
                    <p className="text-muted-foreground">
                      The objective of the game of tic-tac-toe is to be the first player to get three of their marks in a row, either horizontally, vertically, or diagonally
                    </p>
                    <div className="flex gap-3 justify-center">
                      {isLoading === 'restore' ? (
                        <Button disabled={true} className="gap-2">
                          Restoring...
                        </Button>
                      ) : (
                        <>
                          <Button onClick={handleCreateRoom} disabled={gameToken === "" || isLoading !== null} className="gap-2">
                            {isLoading === 'create' ? "Creating..." : "Create Room"}
                          </Button>
                          <Button onClick={handlePlayvsBot} disabled={gameToken === "" || isLoading !== null} variant="destructive" className="gap-2">
                            {isLoading === 'computer' ? "Creating..." : "vs Computer"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tic - Tac - Toe</CardTitle>
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
                    <Button onClick={handleJoinRoom} disabled={!roomId || gameToken === ""}>
                      Join
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
          </div>
        </div>
      </div>
    </div>
  );
}
