import { getApiUrl } from "./config";
import { encryptMessage } from "@/lib/utils/encryption";
import { handleApiError, type ApiErrorResponse } from "@/lib/utils/api-error-handler";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  date: string;
  lastLogIn?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface GetUserResponse {
  status: number;
  user?: UserProfile;
  error?: string;
}

export interface UpdateNameResponse {
  success: boolean;
  user?: { name: string };
  error?: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export const getUserProfile = async (): Promise<GetUserResponse> => {
  try {
    const response = await fetch(getApiUrl("auth/getuser"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        return { status: 401 };
      }
    }

    if (response.status === 403) {
      return { status: 403, error: "Forbidden" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { status: 500, error: "Failed to fetch user profile" };
  }
};

export const updateUserName = async (name: string): Promise<UpdateNameResponse> => {
  try {
    const encryptedName = await encryptMessage(name);
    const response = await fetch(getApiUrl("auth/updateName"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name: encryptedName }),
    });

    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        return { success: false };
      }
    }

    if (response.status === 403) {
      return { success: false, error: "Forbidden" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user name:", error);
    return { success: false, error: "Failed to update user name" };
  }
};

export const updateUserPassword = async (
  id: string,
  email: string,
  password: string
): Promise<UpdatePasswordResponse> => {
  try {
    const encryptedId = await encryptMessage(id);
    const encryptedEmail = await encryptMessage(email);
    const encryptedPassword = await encryptMessage(password);

    const response = await fetch(getApiUrl("auth/updatePassword"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        id: encryptedId,
        email: encryptedEmail,
        password: encryptedPassword,
      }),
    });

    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        return { success: false };
      }
    }

    if (response.status === 403) {
      return { success: false, error: "Forbidden" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error: "Failed to update password" };
  }
};

