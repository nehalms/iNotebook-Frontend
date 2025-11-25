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
  RotateCw,
  Crown,
  Mail,
  MessageSquare,
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
import { Textarea } from "@/components/ui/textarea";
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
  toggleAdminStatus,
  notifyUserToSetPin,
  createPermissionRequest,
  getAllRequests,
  respondToRequest,
  type AdminUser,
  type GameStat,
  type PermissionUser,
  type PermissionRequest,
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
  
  // Separate loading states for refresh buttons
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const [gameStatsRefreshing, setGameStatsRefreshing] = useState(false);
  const [permissionsRefreshing, setPermissionsRefreshing] = useState(false);
 
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
  
  // Admin toggle
  const [adminToggleDialogOpen, setAdminToggleDialogOpen] = useState(false);
  const [userToToggleAdmin, setUserToToggleAdmin] = useState<AdminUser | null>(null);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState(false);
  
  // Pin notification
  const [pinNotificationDialogOpen, setPinNotificationDialogOpen] = useState(false);
  const [userToNotify, setUserToNotify] = useState<AdminUser | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);
  
  // Permission requests
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PermissionRequest[]>([]);
  const [requestsRefreshing, setRequestsRefreshing] = useState(false);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [requestToRespond, setRequestToRespond] = useState<PermissionRequest | null>(null);
  const [responseComment, setResponseComment] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestSortField, setRequestSortField] = useState<keyof PermissionRequest>('createdAt');
  const [requestSortDirection, setRequestSortDirection] = useState<"asc" | "desc">("desc");

  // Permissions
  const [permissionUsers, setPermissionUsers] = useState<PermissionUser[]>([]);
  const [filteredPermissionUsers, setFilteredPermissionUsers] = useState<PermissionUser[]>([]);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState("");
  const [permissionSortField, setPermissionSortField] = useState<keyof PermissionUser>('name');
  const [permissionSortDirection, setPermissionSortDirection] = useState<"asc" | "desc">("asc");

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
  const [loginAnalyticsLoading, setLoginAnalyticsLoading] = useState(false);
  const [onlineAnalyticsLoading, setOnlineAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      setLocation("/");
      return;
    }
    fetchAllData();
  }, [isLoggedIn, isAdmin, setLocation]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchGameStats(), fetchPermissions(), fetchAnalytics(), fetchPermissionRequests()]);
    setIsLoading(false);
  };
  
  const fetchPermissionRequests = async (isRefresh = false) => {
    if (isRefresh) setRequestsRefreshing(true);
    try {
      const status = requestStatusFilter === 'all' ? undefined : requestStatusFilter;
      const response = await getAllRequests(status);
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      setPermissionRequests(response.requests || []);
    } catch (error) {
      console.error("Error fetching permission requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch permission requests",
        variant: "destructive",
      });
    } finally {
      if (isRefresh) setRequestsRefreshing(false);
    }
  };
  
  // Filter and sort requests
  useEffect(() => {
    let result = [...permissionRequests];

    // Apply search filter
    if (requestSearchQuery.trim()) {
      const query = requestSearchQuery.toLowerCase();
      result = result.filter((request) => {
        const user = typeof request.user === 'object' ? request.user : null;
        const userName = user?.name?.toLowerCase() || '';
        const userEmail = user?.email?.toLowerCase() || '';
        const permission = request.permission.toLowerCase();
        return userName.includes(query) || userEmail.includes(query) || permission.includes(query);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[requestSortField];
      let bValue: any = b[requestSortField];

      // Handle different data types
      if (requestSortField === 'createdAt' || requestSortField === 'updatedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (requestSortField === 'user') {
        const aUser = typeof a.user === 'object' ? a.user : null;
        const bUser = typeof b.user === 'object' ? b.user : null;
        aValue = aUser?.name?.toLowerCase() || '';
        bValue = bUser?.name?.toLowerCase() || '';
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return requestSortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return requestSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredRequests(result);
  }, [permissionRequests, requestSearchQuery, requestSortField, requestSortDirection]);
  
  // Fetch requests when status filter changes
  useEffect(() => {
    if (isLoggedIn && isAdmin && activeTab === 'requests') {
      fetchPermissionRequests();
    }
  }, [requestStatusFilter, activeTab]);
  
  const handleRequestSort = (field: keyof PermissionRequest) => {
    if (requestSortField === field) {
      setRequestSortDirection(requestSortDirection === "asc" ? "desc" : "asc");
    } else {
      setRequestSortField(field);
      setRequestSortDirection("desc");
    }
  };
  
  const getRequestSortIcon = (field: keyof PermissionRequest) => {
    if (requestSortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return requestSortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };
  
  // Filter and sort permission users
  useEffect(() => {
    let result = [...permissionUsers];

    // Apply search filter
    if (permissionSearchQuery.trim()) {
      const query = permissionSearchQuery.toLowerCase();
      result = result.filter((user) => {
        const userName = user.name?.toLowerCase() || '';
        const userEmail = user.email?.toLowerCase() || '';
        return userName.includes(query) || userEmail.includes(query);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[permissionSortField];
      let bValue: any = b[permissionSortField];

      // Handle different data types
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === "boolean") {
        // For boolean, true comes first in desc, false first in asc
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      if (aValue < bValue) return permissionSortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return permissionSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredPermissionUsers(result);
  }, [permissionUsers, permissionSearchQuery, permissionSortField, permissionSortDirection]);
  
  const handlePermissionSort = (field: keyof PermissionUser) => {
    if (permissionSortField === field) {
      setPermissionSortDirection(permissionSortDirection === "asc" ? "desc" : "asc");
    } else {
      setPermissionSortField(field);
      setPermissionSortDirection("asc");
    }
  };
  
  const getPermissionSortIcon = (field: keyof PermissionUser) => {
    if (permissionSortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return permissionSortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setUsersRefreshing(true);
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
    } finally {
      if (isRefresh) setUsersRefreshing(false);
    }
  };

  const fetchGameStats = async (isRefresh = false) => {
    if (isRefresh) setGameStatsRefreshing(true);
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
    } finally {
      if (isRefresh) setGameStatsRefreshing(false);
    }
  };

  const fetchPermissions = async (isRefresh = false) => {
    if (isRefresh) setPermissionsRefreshing(true);
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
    } finally {
      if (isRefresh) setPermissionsRefreshing(false);
    }
  };

  const fetchAnalytics = async (reqType: "both" | "user" | "online" = "both") => {
    // Set loading states based on what we're fetching
    if (reqType === "both") {
      setAnalyticsLoading(true);
      setLoginAnalyticsLoading(true);
      setOnlineAnalyticsLoading(true);
    } else if (reqType === "user") {
      setLoginAnalyticsLoading(true);
    } else if (reqType === "online") {
      setOnlineAnalyticsLoading(true);
    }

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
      if (reqType === "both") {
        setAnalyticsLoading(false);
        setLoginAnalyticsLoading(false);
        setOnlineAnalyticsLoading(false);
      } else if (reqType === "user") {
        setLoginAnalyticsLoading(false);
      } else if (reqType === "online") {
        setOnlineAnalyticsLoading(false);
      }
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
  
  const handleToggleAdmin = async () => {
    if (!userToToggleAdmin) return;
    
    setIsTogglingAdmin(true);
    try {
      const response = await toggleAdminStatus(userToToggleAdmin.userId);
      if (response.success) {
        toast({
          title: "Success",
          description: response.msg || "Admin status updated successfully",
        });
        setAdminToggleDialogOpen(false);
        setUserToToggleAdmin(null);
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update admin status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingAdmin(false);
    }
  };
  
  const handleNotifyPin = async () => {
    if (!userToNotify) return;
    
    setIsNotifying(true);
    try {
      const response = await notifyUserToSetPin(userToNotify.userId);
      if (response.success) {
        toast({
          title: "Success",
          description: response.msg || "Notification sent successfully",
        });
        setPinNotificationDialogOpen(false);
        setUserToNotify(null);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error notifying user:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setIsNotifying(false);
    }
  };
  
  const handleRespondToRequest = async (action: 'approve' | 'decline') => {
    if (!requestToRespond) return;
    
    setIsResponding(true);
    try {
      const response = await respondToRequest(requestToRespond._id, action, responseComment);
      if (response.success) {
        toast({
          title: "Success",
          description: response.msg || `Request ${action}d successfully`,
        });
        setRespondDialogOpen(false);
        setRequestToRespond(null);
        setResponseComment("");
        fetchPermissionRequests();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to respond to request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      toast({
        title: "Error",
        description: "Failed to respond to request",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
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
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-full min-w-max sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="users" data-testid="tab-users" className="whitespace-nowrap">
              Users
            </TabsTrigger>
            <TabsTrigger value="games" data-testid="tab-game-stats" className="whitespace-nowrap">
              Game Stats
            </TabsTrigger>
            <TabsTrigger value="permissions" data-testid="tab-permissions" className="whitespace-nowrap">
              Permissions
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics" className="whitespace-nowrap">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live-users" className="whitespace-nowrap">
              Live Users
            </TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-health" className="whitespace-nowrap">
              Services Health
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests" className="whitespace-nowrap">
              Requests
            </TabsTrigger>
          </TabsList>
        </div>

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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchUsers(true)}
                    disabled={usersRefreshing || isLoading}
                    title="Refresh users"
                  >
                    <RotateCw className={`h-4 w-4 ${usersRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
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
                            onClick={() => handleSort("isActive")}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            Status
                            {getSortIcon("isActive")}
                          </button>
                        </TableHead>
                        <TableHead>Security Pin</TableHead>
                        <TableHead>Admin</TableHead>
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.isPinSet ? (
                                <>
                                  <Shield className="h-4 w-4 text-green-500" />
                                  <Badge variant="default">Set</Badge>
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant="secondary">Not Set</Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.isAdmin ? (
                                <>
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                  <Badge variant="default">Admin</Badge>
                                </>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
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
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUserToToggleAdmin(user);
                                  setAdminToggleDialogOpen(true);
                                }}
                                className="h-8 w-8"
                                title={user.isAdmin ? "Revoke Admin" : "Make Admin"}
                              >
                                <Crown className={`h-4 w-4 ${user.isAdmin ? "text-yellow-500" : "text-muted-foreground"}`} />
                              </Button>
                              {!user.isPinSet && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setUserToNotify(user);
                                    setPinNotificationDialogOpen(true);
                                  }}
                                  className="h-8 w-8"
                                  title="Notify to set pin"
                                >
                                  <Mail className="h-4 w-4 text-primary" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteUserDialogOpen(true);
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">Game Statistics</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchGameStats(true)}
                    disabled={gameStatsRefreshing || isLoading}
                    title="Refresh game stats"
                  >
                    <RotateCw className={`h-4 w-4 ${gameStatsRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-serif">User Permissions</CardTitle>
                 <Button
                   variant="outline"
                   size="icon"
                   onClick={() => fetchPermissions(true)}
                   disabled={permissionsRefreshing || isLoading}
                   title="Refresh permissions"
                 >
                   <RotateCw className={`h-4 w-4 ${permissionsRefreshing ? 'animate-spin' : ''}`} />
                 </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Control */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by user name or email..."
                    value={permissionSearchQuery}
                    onChange={(e) => setPermissionSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredPermissionUsers.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('name')}
                        >
                          <div className="flex items-center">
                            User
                            {getPermissionSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('notes')}
                        >
                          <div className="flex items-center justify-center">
                            Notes
                            {getPermissionSortIcon('notes')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('tasks')}
                        >
                          <div className="flex items-center justify-center">
                            Tasks
                            {getPermissionSortIcon('tasks')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('images')}
                        >
                          <div className="flex items-center justify-center">
                            Images
                            {getPermissionSortIcon('images')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('games')}
                        >
                          <div className="flex items-center justify-center">
                            Games
                            {getPermissionSortIcon('games')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('messages')}
                        >
                          <div className="flex items-center justify-center">
                            Messages
                            {getPermissionSortIcon('messages')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('news')}
                        >
                          <div className="flex items-center justify-center">
                            News
                            {getPermissionSortIcon('news')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePermissionSort('calendar')}
                        >
                          <div className="flex items-center justify-center">
                            Calendar
                            {getPermissionSortIcon('calendar')}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPermissionUsers.map((user) => (
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
                  <p className="text-muted-foreground">
                    {permissionSearchQuery.trim()
                      ? 'No users match your search'
                      : 'No users found'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">Login Analytics</CardTitle>
                </div>
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchAnalytics("user")}
                      disabled={loginAnalyticsLoading}
                      title="Refresh login analytics"
                      className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                    >
                      <RotateCw className={`h-4 w-4 ${loginAnalyticsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loginAnalyticsLoading ? (
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">Online Users Analytics</CardTitle>
                </div>
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchAnalytics("online")}
                      disabled={onlineAnalyticsLoading}
                      title="Refresh online users analytics"
                      className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                    >
                      <RotateCw className={`h-4 w-4 ${onlineAnalyticsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {onlineAnalyticsLoading ? (
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-serif">Services Health</CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Force iframe reload
                    const iframe = document.querySelector('iframe[title="Cron Job Status"]') as HTMLIFrameElement;
                    if (iframe) {
                      iframe.src = iframe.src;
                    }
                  }}
                  title="Refresh services health"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
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

        <TabsContent value="requests" className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-serif">Permission Requests</CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchPermissionRequests(true)}
                  disabled={requestsRefreshing || isLoading}
                  title="Refresh requests"
                >
                  <RotateCw className={`h-4 w-4 ${requestsRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by user name, email, or feature..."
                    value={requestSearchQuery}
                    onChange={(e) => setRequestSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={requestStatusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRequestStatusFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={requestStatusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRequestStatusFilter('pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={requestStatusFilter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRequestStatusFilter('approved')}
                  >
                    Approved
                  </Button>
                  <Button
                    variant={requestStatusFilter === 'declined' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRequestStatusFilter('declined')}
                  >
                    Declined
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredRequests.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRequestSort('user')}
                        >
                          <div className="flex items-center">
                            User
                            {getRequestSortIcon('user')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRequestSort('permission')}
                        >
                          <div className="flex items-center">
                            Feature
                            {getRequestSortIcon('permission')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRequestSort('status')}
                        >
                          <div className="flex items-center">
                            Status
                            {getRequestSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRequestSort('createdAt')}
                        >
                          <div className="flex items-center">
                            Requested On
                            {getRequestSortIcon('createdAt')}
                          </div>
                        </TableHead>
                        <TableHead>Admin Comment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        const user = typeof request.user === 'object' ? request.user : null;
                        const permissionNames: { [key: string]: string } = {
                          notes: 'Notes',
                          tasks: 'Tasks',
                          images: 'Images',
                          games: 'Games',
                          messages: 'Messages',
                          news: 'News',
                          calendar: 'Calendar'
                        };
                        const statusColors = {
                          pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
                          approved: 'bg-green-500/10 text-green-600 border-green-500/20',
                          declined: 'bg-red-500/10 text-red-600 border-red-500/20',
                        };
                        return (
                          <TableRow key={request._id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{user ? user.name : 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{user ? user.email : 'Unknown'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {permissionNames[request.permission] || request.permission}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={statusColors[request.status as keyof typeof statusColors] || ''}
                              >
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{moment(request.createdAt).format("MMM DD, YYYY HH:mm")}</div>
                                {request.updatedAt && request.status !== 'pending' && (
                                  <div className="text-sm text-muted-foreground">
                                    Responded: {moment(request.updatedAt).format("MMM DD, YYYY HH:mm")}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {request.adminComment ? (
                                <div className="max-w-xs">
                                  <p className="text-sm">{request.adminComment}</p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {request.status === 'pending' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRequestToRespond(request);
                                    setResponseComment("");
                                    setRespondDialogOpen(true);
                                  }}
                                  disabled={isResponding}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Respond
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">Processed</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {requestSearchQuery.trim() || requestStatusFilter !== 'all'
                      ? 'No requests match your filters'
                      : 'No requests found'}
                  </p>
                </div>
              )}
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

      {/* Admin Toggle Dialog */}
      <AlertDialog open={adminToggleDialogOpen} onOpenChange={setAdminToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggleAdmin?.isAdmin ? "Revoke Admin Status" : "Make Admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {userToToggleAdmin?.isAdmin ? "revoke admin status from" : "make"} user "{userToToggleAdmin?.name}"?
              {userToToggleAdmin?.isAdmin 
                ? " They will lose admin privileges." 
                : " They will gain full admin access to the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToToggleAdmin(null)} disabled={isTogglingAdmin}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleAdmin}
              disabled={isTogglingAdmin}
              className={userToToggleAdmin?.isAdmin ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isTogglingAdmin ? "Processing..." : userToToggleAdmin?.isAdmin ? "Revoke Admin" : "Make Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pin Notification Dialog */}
      <AlertDialog open={pinNotificationDialogOpen} onOpenChange={setPinNotificationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notify User to Set Security Pin</AlertDialogTitle>
            <AlertDialogDescription>
              Send an email notification to "{userToNotify?.name}" with instructions on how to set up their security pin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToNotify(null)} disabled={isNotifying}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNotifyPin}
              disabled={isNotifying}
            >
              {isNotifying ? "Sending..." : "Send Notification"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Respond to Request Dialog */}
      <AlertDialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Respond to Permission Request</AlertDialogTitle>
            <AlertDialogDescription>
              {requestToRespond && (
                <>
                  <p className="mb-2">
                    User: <strong>{typeof requestToRespond.user === 'object' ? requestToRespond.user.name : 'Unknown'}</strong>
                  </p>
                  <p className="mb-4">
                    Requested: <strong>{requestToRespond.permission}</strong>
                  </p>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (optional)</Label>
                <Textarea
                  id="comment"
                  value={responseComment}
                  onChange={(e) => setResponseComment(e.target.value)}
                  placeholder="Add a comment for the user..."
                  className="min-h-[100px]"
                  disabled={isResponding}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRequestToRespond(null); setResponseComment(""); }} disabled={isResponding}>
              Cancel
            </AlertDialogCancel>
            <div className="flex gap-2">
              <AlertDialogAction
                onClick={() => handleRespondToRequest('decline')}
                disabled={isResponding}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isResponding ? "Processing..." : "Decline"}
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => handleRespondToRequest('approve')}
                disabled={isResponding}
              >
                {isResponding ? "Processing..." : "Approve"}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
