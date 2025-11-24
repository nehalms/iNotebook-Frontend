import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionStore } from "@/store/sessionStore";
import {
  Users,
  FileText,
  Gamepad2,
  Shield,
  TrendingUp,
  CheckSquare,
  Activity,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import moment from "moment";
import {
  getUsers,
  getGameStats,
  deleteGameStats,
  getPermissions,
  togglePermission,
  toggleAllPermissions,
  getAnalytics,
  deleteUser,
  type AdminUser,
  type GameStat,
  type PermissionUser,
} from "@/lib/api/admin";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { LiveUsers } from "@/components/live-users";

const PERMISSIONS = {
  notes: 1,
  tasks: 2,
  images: 3,
  games: 4,
  messages: 5,
  news: 6,
  calendar: 7,
};

export default function AdminPage() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, isAdmin } = useSessionStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  // Users data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [sortField, setSortField] = useState<keyof AdminUser>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminStats, setAdminStats] = useState({
    usersCount: 0,
    notesCount: 0,
    tasksCount: 0,
    loginHistoryCount: 0,
    userHistoryCount: 0,
  });

  // Game stats
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statsToDelete, setStatsToDelete] = useState<string | null>(null);

  // User delete
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Permissions
  const [permissionUsers, setPermissionUsers] = useState<PermissionUser[]>([]);

  // Analytics
  const [analyticsData, setAnalyticsData] = useState({
    loginData: { xAxisDates: [] as string[], loginData: [] as number[], colors: [] as string[] },
    onlineData: { xAxisDates: [] as string[], onlineData: [] as number[], colors: [] as string[] },
  });
  const [analyticsDates, setAnalyticsDates] = useState({
    loginStart: moment().subtract(6, "days").format("YYYY-MM-DD"),
    loginEnd: moment().format("YYYY-MM-DD"),
    onlineStart: moment().subtract(6, "days").format("YYYY-MM-DD"),
    onlineEnd: moment().format("YYYY-MM-DD"),
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      setLocation("/");
      return;
    }
    fetchAllData();
  }, [isLoggedIn, isAdmin, setLocation]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchGameStats(), fetchPermissions(), fetchAnalytics()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      const usersList = response.users || [];
      setUsers(usersList);
      // Sort by SL.No initially
      const sorted = [...usersList].sort((a, b) => a.id - b.id);
      setFilteredUsers(sorted);
      setAdminStats({
        usersCount: response.usersCount,
        notesCount: response.notesCount,
        tasksCount: response.tasksCount,
        loginHistoryCount: response.loginHistoryCount,
        userHistoryCount: response.userHistoryCount,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchGameStats = async () => {
    try {
      const response = await getGameStats();
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      setGameStats(response.stats);
    } catch (error) {
      console.error("Error fetching game stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch game stats",
        variant: "destructive",
      });
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await getPermissions();
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      setPermissionUsers(response.users);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch permissions",
        variant: "destructive",
      });
    }
  };

  const fetchAnalytics = async (reqType: "both" | "user" | "online" = "both") => {
    setAnalyticsLoading(true);
    try {
      let startDate, endDate;
      if (reqType === "user") {
        startDate = analyticsDates.loginStart;
        endDate = analyticsDates.loginEnd;
      } else if (reqType === "online") {
        startDate = analyticsDates.onlineStart;
        endDate = analyticsDates.onlineEnd;
      } else {
        startDate = moment().subtract(6, "days").format("YYYY-MM-DD");
        endDate = moment().format("YYYY-MM-DD");
      }

      const response = await getAnalytics(startDate, endDate, reqType);
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      if (reqType === "both" || reqType === "user") {
        setAnalyticsData((prev) => ({
          ...prev,
          loginData: {
            xAxisDates: response.xAxisDates,
            loginData: response.loginData,
            colors: response.colors,
          },
        }));
      }
      if (reqType === "both" || reqType === "online") {
        setAnalyticsData((prev) => ({
          ...prev,
          onlineData: {
            xAxisDates: response.xAxisDates,
            onlineData: response.onlineUsersData,
            colors: response.colors,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleDeleteStats = async () => {
    if (!statsToDelete) return;

    try {
      const response = await deleteGameStats(statsToDelete);
      if (response.success) {
        toast({
          title: "Success",
          description: response.msg || "Stats deleted successfully",
        });
        setDeleteDialogOpen(false);
        setStatsToDelete(null);
        fetchGameStats();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete stats",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting stats:", error);
      toast({
        title: "Error",
        description: "Failed to delete stats",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await deleteUser(userToDelete.userId);
      if (response.success) {
        toast({
          title: "Success",
          description: response.msg || "User deleted successfully",
        });
        setDeleteUserDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handlePermissionToggle = async (userId: string, permission: keyof typeof PERMISSIONS, enabled: boolean) => {
    try {
      const response = await togglePermission(userId, PERMISSIONS[permission], !enabled);
      if (response.status === 1) {
        toast({
          title: "Success",
          description: response.msg || "Permission updated successfully",
        });
        fetchPermissions();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling permission:", error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    }
  };

  const handleToggleAllPermissions = async (userId: string, action: "give all" | "remove all") => {
    try {
      const response = await toggleAllPermissions(userId, action);
      if (response.status === 1) {
        toast({
          title: "Success",
          description: response.msg || "Permissions updated successfully",
        });
        fetchPermissions();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling all permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  // Sort and filter users
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.id.toString().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle different data types
      if (sortField === "date" || sortField === "lastLoggedOn") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(result);
  }, [users, sortField, sortDirection, searchQuery]);

  const handleSort = (field: keyof AdminUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof AdminUser) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const loginChartData = analyticsData.loginData.xAxisDates.map((date, index) => ({
    date: moment(date).format("MMM DD"),
    logins: analyticsData.loginData.loginData[index] || 0,
  }));

  const onlineChartData = analyticsData.onlineData.xAxisDates.map((date, index) => ({
    date: moment(date).format("MMM DD"),
    users: analyticsData.onlineData.onlineData[index] || 0,
  }));

  const statCards = [
    {
      title: "Total Users",
      value: adminStats.usersCount,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Notes",
      value: adminStats.notesCount,
      icon: FileText,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Total Tasks",
      value: adminStats.tasksCount,
      icon: CheckSquare,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Game Stats",
      value: gameStats.length,
      icon: Gamepad2,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">Admin Dashboard</h1>
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
            <Card key={stat.title} className="rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="users" data-testid="tab-users">
            Users
          </TabsTrigger>
          <TabsTrigger value="games" data-testid="tab-game-stats">
            Game Stats
          </TabsTrigger>
          <TabsTrigger value="permissions" data-testid="tab-permissions">
            Permissions
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="live" data-testid="tab-live-users">
            Live Users
          </TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health">
            Services Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-serif">User Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <button
                            onClick={() => handleSort("id")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            SL.No
                            {getSortIcon("id")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            User Name
                            {getSortIcon("name")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort("email")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            Email
                            {getSortIcon("email")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort("date")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            Created On
                            {getSortIcon("date")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort("notesCount")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            Notes
                            {getSortIcon("notesCount")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort("tasksCount")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            Tasks
                            {getSortIcon("tasksCount")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort("isActive")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            Status
                            {getSortIcon("isActive")}
                          </button>
                        </TableHead>
                        {users.some(u => u.lastLoggedOn) && (
                          <TableHead>
                            <button
                              onClick={() => handleSort("lastLoggedOn")}
                              className="flex items-center hover:text-foreground transition-colors"
                            >
                              Last Login
                              {getSortIcon("lastLoggedOn")}
                            </button>
                          </TableHead>
                        )}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email.split("__")[0]}</TableCell>
                          <TableCell>
                            {moment(user.date).format("MMM DD, YYYY")}
                          </TableCell>
                          <TableCell>{user.notesCount}</TableCell>
                          <TableCell>{user.tasksCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  user.isActive ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          {users.some(u => u.lastLoggedOn) && (
                            <TableCell>
                              {user.lastLoggedOn
                                ? moment(user.lastLoggedOn).format("MMM DD, YYYY HH:mm")
                                : "Never"}
                            </TableCell>
                          )}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteUserDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
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

        <TabsContent value="games" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader>
              <CardTitle className="text-2xl font-serif">Game Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                    </div>
              ) : gameStats.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SL.No</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead colSpan={3} className="text-center bg-muted">
                          Tic-Tac-Toe
                        </TableHead>
                        <TableHead colSpan={3} className="text-center bg-muted">
                          Connect Four
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead></TableHead>
                        <TableHead className="bg-muted/50">Played</TableHead>
                        <TableHead className="bg-muted/50">Won</TableHead>
                        <TableHead className="bg-muted/50">Lost</TableHead>
                        <TableHead className="bg-muted/50">Played</TableHead>
                        <TableHead className="bg-muted/50">Won</TableHead>
                        <TableHead className="bg-muted/50">Lost</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameStats.map((stat) => (
                        <TableRow key={stat.id}>
                          <TableCell>{stat.id}</TableCell>
                          <TableCell className="font-medium">{stat.name}</TableCell>
                          <TableCell>{stat.ttt_played}</TableCell>
                          <TableCell>{stat.ttt_won}</TableCell>
                          <TableCell>{stat.ttt_lost}</TableCell>
                          <TableCell>{stat.con4_played}</TableCell>
                          <TableCell>{stat.con4_won}</TableCell>
                          <TableCell>{stat.con4_lost}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setStatsToDelete(stat.statsId);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No game statistics yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">User Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : permissionUsers.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Tasks</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead>Games</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>News</TableHead>
                        <TableHead>Calendar</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissionUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handlePermissionToggle(user.userId, "notes", user.notes)}
                            >
                              {user.notes ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handlePermissionToggle(user.userId, "tasks", user.tasks)}
                            >
                              {user.tasks ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handlePermissionToggle(user.userId, "images", user.images)}
                            >
                              {user.images ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handlePermissionToggle(user.userId, "games", user.games)}
                            >
                              {user.games ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handlePermissionToggle(user.userId, "messages", user.messages)}
                            >
                              {user.messages ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handlePermissionToggle(user.userId, "news", user.news)}
                            >
                              {user.news ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handlePermissionToggle(user.userId, "calendar", user.calendar)}
                            >
                              {user.calendar ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAllPermissions(user.userId, "give all")}
                              >
                                Give All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAllPermissions(user.userId, "remove all")}
                              >
                                Remove All
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Login Analytics</CardTitle>
                <div className="flex gap-2 mt-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={analyticsDates.loginStart}
                      onChange={(e) =>
                        setAnalyticsDates({ ...analyticsDates, loginStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={analyticsDates.loginEnd}
                      onChange={(e) =>
                        setAnalyticsDates({ ...analyticsDates, loginEnd: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => fetchAnalytics("user")} disabled={analyticsLoading}>
                      {analyticsLoading ? "Loading..." : "Update"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : loginChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      logins: {
                        label: "Logins",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-64"
                  >
                    <BarChart data={loginChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="logins" fill="var(--color-logins)" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Online Users Analytics</CardTitle>
                <div className="flex gap-2 mt-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={analyticsDates.onlineStart}
                      onChange={(e) =>
                        setAnalyticsDates({ ...analyticsDates, onlineStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={analyticsDates.onlineEnd}
                      onChange={(e) =>
                        setAnalyticsDates({ ...analyticsDates, onlineEnd: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => fetchAnalytics("online")} disabled={analyticsLoading}>
                      {analyticsLoading ? "Loading..." : "Update"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : onlineChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      users: {
                        label: "Online Users",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-64"
                  >
                    <BarChart data={onlineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="users" fill="var(--color-users)" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <LiveUsers />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Services Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[550px] rounded-lg overflow-hidden border">
                <iframe
                  src="https://4y9w32nv.status.cron-job.org/"
                  title="Cron Job Status"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the game statistics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStats}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone and will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
