import { getApiUrl } from "./config";
import { encryptAES, decryptAES } from "@/lib/utils/aes";

export interface CalendarEvent {
  _id?: string;
  title: string;
  start: string;
  end: string;
  desc?: string;
  createdAt?: string;
}

export interface GetEventsResponse {
  status: number;
  data?: CalendarEvent[];
  error?: string;
}

export interface AddEventResponse {
  status: number;
  msg?: string;
  event?: CalendarEvent;
  error?: string;
}

export interface DeleteEventResponse {
  status: number;
  msg?: string;
  event?: CalendarEvent;
  error?: string;
}

export const getEvents = async (secretKey: string): Promise<GetEventsResponse> => {
  try {
    const response = await fetch(getApiUrl("calevents"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      return { status: 401, error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { status: 403, error: "Permission denied" };
    }

    const data = await response.json();

    if (data.status === 1 && data.data) {
      // Decrypt events
      const decryptedEvents = data.data.map((event: any) => ({
        ...event,
        title: decryptAES(event.title, secretKey),
        desc: decryptAES(event.desc, secretKey),
        start: decryptAES(event.start, secretKey),
        end: decryptAES(event.end, secretKey),
      }));

      return { status: 1, data: decryptedEvents };
    }

    return { status: 0, error: data.error || "Failed to fetch events" };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { status: 500, error: "Failed to fetch events" };
  }
};

export const addEvent = async (
  event: Omit<CalendarEvent, "_id" | "createdAt">,
  secretKey: string
): Promise<AddEventResponse> => {
  try {
    const encryptedEvent = {
      title: encryptAES(event.title, secretKey),
      desc: encryptAES(event.desc || "", secretKey),
      start: encryptAES(event.start, secretKey),
      end: encryptAES(event.end, secretKey),
    };

    const response = await fetch(getApiUrl("calevents/add"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(encryptedEvent),
    });

    if (response.status === 401) {
      return { status: 401, error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { status: 403, error: "Permission denied" };
    }

    const data = await response.json();

    if (data.status === 1) {
      return { status: 1, msg: data.msg, event: data.event };
    }

    return { status: 0, error: data.error || "Failed to add event" };
  } catch (error) {
    console.error("Error adding event:", error);
    return { status: 500, error: "Failed to add event" };
  }
};

export const deleteEvent = async (eventId: string): Promise<DeleteEventResponse> => {
  try {
    const response = await fetch(getApiUrl(`calevents/${eventId}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      return { status: 401, error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { status: 403, error: "Permission denied" };
    }

    const data = await response.json();

    if (data.status === 1) {
      return { status: 1, msg: data.msg, event: data.event };
    }

    return { status: 0, error: data.error || "Failed to delete event" };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { status: 500, error: "Failed to delete event" };
  }
};

