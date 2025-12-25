import { getApiUrl } from "./config";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  date: string;
  isActive: boolean;
  isAdmin?: boolean;
  isPinSet?: boolean;
  notesCount: number;
  tasksCount: number;
  userId: string;
  lastLoggedOn?: string;
}

export interface AdminStats {
  usersCount: number;
  notesCount: number;
  tasksCount: number;
  loginHistoryCount: number;
  userHistoryCount: number;
}

export interface GameStat {
  id: number;
  name: string;
  userId: string;
  ttt_played: number;
  ttt_won: number;
  ttt_lost: number;
  con4_played: number;
  con4_won: number;
  con4_lost: number;
  statsId: string;
}

export interface PermissionUser {
  id: number;
  name: string;
  email: string;
  userId: string;
  notes: boolean;
  tasks: boolean;
  images: boolean;
  games: boolean;
  messages: boolean;
  news: boolean;
  calendar: boolean;
}

export interface AnalyticsData {
  xAxisDates: string[];
  loginData: number[];
  onlineUsersData: number[];
  colors: string[];
}

export interface GetUsersResponse {
  users: AdminUser[];
  usersCount: number;
  notesCount: number;
  tasksCount: number;
  loginHistoryCount: number;
  userHistoryCount: number;
  error?: string;
}

export interface GetGameStatsResponse {
  status: string;
  stats: GameStat[];
  error?: string;
}

export interface GetPermissionsResponse {
  users: PermissionUser[];
  error?: string;
}

export interface GetAnalyticsResponse {
  xAxisDates: string[];
  loginData: number[];
  onlineUsersData: number[];
  colors: string[];
  error?: string;
}

export const getUsers = async (): Promise<GetUsersResponse> => {
  try {
    const response = await fetch(getApiUrl("getData/users"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      return { users: [], usersCount: 0, notesCount: 0, tasksCount: 0, loginHistoryCount: 0, userHistoryCount: 0, error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { users: [], usersCount: 0, notesCount: 0, tasksCount: 0, loginHistoryCount: 0, userHistoryCount: 0, error: "Permission denied" };
    }

    const data = await response.json();

    if (data.error) {
      return { users: [], usersCount: 0, notesCount: 0, tasksCount: 0, loginHistoryCount: 0, userHistoryCount: 0, error: data.error };
    }

    return {
      users: data.users || [],
      usersCount: data.usersCount || 0,
      notesCount: data.notesCount || 0,
      tasksCount: data.tasksCount || 0,
      loginHistoryCount: data.loginHistoryCount || 0,
      userHistoryCount: data.userHistoryCount || 0,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: [], usersCount: 0, notesCount: 0, tasksCount: 0, loginHistoryCount: 0, userHistoryCount: 0, error: "Failed to fetch users" };
  }
};

export const getGameStats = async (): Promise<GetGameStatsResponse> => {
  try {
    const response = await fetch(getApiUrl("getData/gamestats"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      return { status: "error", stats: [], error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { status: "error", stats: [], error: "Permission denied" };
    }

    const data = await response.json();

    if (data.error) {
      return { status: "error", stats: [], error: data.error };
    }

    if (data.status === "success" && data.stats) {
      const stats = data.stats.map((stat: any) => ({
        id: stat.id,
        name: stat.name,
        userId: stat.userId,
        ttt_played: stat.tttStats?.played || 0,
        ttt_won: stat.tttStats?.won || 0,
        ttt_lost: stat.tttStats?.lost || 0,
        con4_played: stat.con4Stats?.played || 0,
        con4_won: stat.con4Stats?.won || 0,
        con4_lost: stat.con4Stats?.lost || 0,
        statsId: stat.statsId || "",
      }));

      return { status: "success", stats };
    }

    return { status: "error", stats: [], error: "Failed to fetch game stats" };
  } catch (error) {
    console.error("Error fetching game stats:", error);
    return { status: "error", stats: [], error: "Failed to fetch game stats" };
  }
};

export const deleteGameStats = async (statsId: string): Promise<{ success: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(`getData/delstats/${statsId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (data.success === false) {
      return { success: false, error: data.msg || "Failed to delete stats" };
    }

    return { success: true, msg: data.msg || "Stats deleted successfully" };
  } catch (error) {
    console.error("Error deleting game stats:", error);
    return { success: false, error: "Failed to delete stats" };
  }
};

export const getPermissions = async (): Promise<GetPermissionsResponse> => {
  try {
    const response = await fetch(getApiUrl("perm/users"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      return { users: [], error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { users: [], error: "Permission denied" };
    }

    const data = await response.json();

    if (data.error) {
      return { users: [], error: data.error };
    }

    return { users: data.users || [] };
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return { users: [], error: "Failed to fetch permissions" };
  }
};

export const togglePermission = async (
  userId: string,
  permissionIndex: number,
  enable: boolean
): Promise<{ status: number; msg?: string; error?: string }> => {
  try {
    const type = enable ? "set" : "reset";
    const response = await fetch(getApiUrl(`perm/${type}/${userId}/${permissionIndex}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (data.error) {
      return { status: 0, error: data.msg || data.error };
    }

    return { status: data.status || 1, msg: data.msg };
  } catch (error) {
    console.error("Error toggling permission:", error);
    return { status: 0, error: "Failed to toggle permission" };
  }
};

export const toggleAllPermissions = async (
  userId: string,
  action: "give all" | "remove all"
): Promise<{ status: number; msg?: string; error?: string }> => {
  try {
    // Backend uses 'setall' for giving all permissions and 'resetall' for removing all
    const endpoint = action === "give all" ? "setall" : "resetall";
    const response = await fetch(getApiUrl(`perm/${endpoint}/${userId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (data.error) {
      return { status: 0, error: data.msg || data.error };
    }

    return { status: data.status || 1, msg: data.msg };
  } catch (error) {
    console.error("Error toggling all permissions:", error);
    return { status: 0, error: "Failed to toggle permissions" };
  }
};

export const deleteUser = async (userId: string): Promise<{ success: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(`getData/deluser/${userId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (data.success === false) {
      return { success: false, error: data.msg || "Failed to delete user" };
    }

    return { success: true, msg: data.msg || "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
};

export const getAnalytics = async (
  startDate: string,
  endDate: string,
  reqType: "both" | "user" | "online" = "both"
): Promise<GetAnalyticsResponse> => {
  try {
    const response = await fetch(
      getApiUrl(`getData/graphData?reqType=${reqType}&startDate=${startDate}&endDate=${endDate}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (response.status === 401) {
      return { xAxisDates: [], loginData: [], onlineUsersData: [], colors: [], error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { xAxisDates: [], loginData: [], onlineUsersData: [], colors: [], error: "Permission denied" };
    }

    const data = await response.json();

    if (data.error) {
      return { xAxisDates: [], loginData: [], onlineUsersData: [], colors: [], error: data.error };
    }

    return {
      xAxisDates: data.xAxisDates || [],
      loginData: data.loginData || [],
      onlineUsersData: data.onlineUsersData || [],
      colors: data.colors || [],
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { xAxisDates: [], loginData: [], onlineUsersData: [], colors: [], error: "Failed to fetch analytics" };
  }
};

// Toggle admin status
export const toggleAdminStatus = async (userId: string): Promise<{ success: boolean; isAdmin?: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(`getData/toggleadmin/${userId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to toggle admin status");
    }

    return data;
  } catch (error) {
    console.error("Error toggling admin status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to toggle admin status" };
  }
};

// Reactivate user account
export const reactivateUser = async (userId: string, notifyUser: boolean = false): Promise<{ success: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(`getData/reactivateuser/${userId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ notifyUser }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to reactivate user");
    }

    return data;
  } catch (error) {
    console.error("Error reactivating user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to reactivate user" };
  }
};

// Deactivate user account
export const deactivateUser = async (userId: string, notifyUser: boolean = false): Promise<{ success: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(`getData/deactivateuser/${userId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ notifyUser }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to deactivate user");
    }

    return data;
  } catch (error) {
    console.error("Error deactivating user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to deactivate user" };
  }
};

// Notify user to set security pin
export const notifyUserToSetPin = async (userId: string): Promise<{ success: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(`getData/notifypinset/${userId}`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to send notification");
    }

    return data;
  } catch (error) {
    console.error("Error notifying user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send notification" };
  }
};

// Permission Request interfaces
export interface PermissionRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  permission: string;
  status: 'pending' | 'approved' | 'declined';
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
}

// Create permission request
export const createPermissionRequest = async (permission: string): Promise<{ success: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl('permissionrequests/create'), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ permission }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to create request");
    }

    return data;
  } catch (error) {
    console.error("Error creating permission request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create request" };
  }
};

// Get all requests (admin) - can filter by status
export const getAllRequests = async (status?: 'pending' | 'approved' | 'declined'): Promise<{ success: boolean; requests?: PermissionRequest[]; error?: string }> => {
  try {
    const url = status 
      ? getApiUrl(`permissionrequests/all?status=${status}`)
      : getApiUrl('permissionrequests/all');
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to fetch requests");
    }

    return data;
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch requests" };
  }
};

// Get pending requests (admin) - kept for backward compatibility
export const getPendingRequests = async (): Promise<{ success: boolean; requests?: PermissionRequest[]; error?: string }> => {
  return getAllRequests('pending');
};

// Respond to permission request (admin)
export const respondToRequest = async (
  requestId: string,
  action: 'approve' | 'decline',
  comment?: string
): Promise<{ success: boolean; msg?: string; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(`permissionrequests/${requestId}/respond`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ action, comment }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to respond to request");
    }

    return data;
  } catch (error) {
    console.error("Error responding to request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to respond to request" };
  }
};

// Get user's own permission requests
export const getMyRequests = async (): Promise<{ success: boolean; requests?: PermissionRequest[]; error?: string }> => {
  try {
    const response = await fetch(getApiUrl('permissionrequests/myrequests'), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to fetch requests");
    }

    return data;
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch requests" };
  }
};

// Database Management Types and Functions
export interface CollectionCount {
  count: number;
  error: string | null;
}

export interface DatabaseCounts {
  [collectionName: string]: CollectionCount;
}

export interface GetDatabaseCountsResponse {
  success: boolean;
  counts?: DatabaseCounts;
  error?: string;
}

export interface DeleteCollectionResponse {
  success: boolean;
  message?: string;
  deletedCount?: number;
  error?: string;
}

// Get counts for all collections
export const getDatabaseCounts = async (): Promise<GetDatabaseCountsResponse> => {
  try {
    const response = await fetch(getApiUrl('database/counts'), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to fetch database counts");
    }

    return data;
  } catch (error) {
    console.error("Error fetching database counts:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch database counts" };
  }
};

// Delete all data from a collection
export const deleteCollection = async (collectionName: string): Promise<DeleteCollectionResponse> => {
  try {
    const response = await fetch(getApiUrl(`database/${collectionName}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to delete collection");
    }

    return data;
  } catch (error) {
    console.error("Error deleting collection:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete collection" };
  }
};

