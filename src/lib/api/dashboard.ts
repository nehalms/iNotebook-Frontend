import { getApiUrl } from "./config";

export interface DashboardStats {
  notes: {
    total: number;
  };
  tasks: {
    total: number;
    totalSubtasks: number;
    completedSubtasks: number;
    activeSubtasks: number;
    completionRate: number;
  };
  games: {
    totalPlayed: number;
    ticTacToe: {
      played: number;
      won: number;
      lost: number;
    };
    connect4: {
      played: number;
      won: number;
      lost: number;
    };
  };
  calendar: {
    eventsCount: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    date: string;
  }>;
}

export interface DashboardResponse {
  status: number;
  data?: DashboardStats;
  error?: string;
}

export const getDashboardStats = async (): Promise<DashboardResponse> => {
  try {
    const response = await fetch(getApiUrl("getData/dashboard"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      return { status: 0, error: "Unauthorized" };
    }

    const data = await response.json();

    if (data.status === 1) {
      return {
        status: 1,
        data: data.data,
      };
    }

    return { status: 0, error: data.error || "Failed to fetch dashboard stats" };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { status: 0, error: "Failed to fetch dashboard stats" };
  }
};

