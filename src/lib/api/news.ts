import { getApiUrl } from "./config";

export interface NewsArticle {
  article_id: string;
  title: string;
  description: string;
  image_url: string;
  link: string;
  pubDate: string;
  source_name: string;
}

export interface NewsResponse {
  status: number;
  data?: {
    results: NewsArticle[];
    nextPage?: string;
    totalResults: number;
  };
  error?: string;
}

export const getNews = async (
  country: string = "in",
  category: string = "top",
  page?: string
): Promise<NewsResponse> => {
  try {
    const url = page
      ? `news/top?country=${country}&category=${category}&page=${page}`
      : `news/top?country=${country}&category=${category}`;
    
    const response = await fetch(getApiUrl(url), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      return { status: 0, error: "Unauthorized" };
    }

    if (response.status === 403) {
      return { status: 0, error: "Permission denied" };
    }

    const data = await response.json();

    if (data.error) {
      return { status: 0, error: data.error };
    }

    if (data.status === 1) {
      return {
        status: 1,
        data: {
          results: data.data.results || [],
          nextPage: data.data.nextPage,
          totalResults: data.data.totalResults || 0,
        },
      };
    }

    return { status: 0, error: "Failed to fetch news" };
  } catch (error) {
    console.error("Error fetching news:", error);
    return { status: 0, error: "Failed to fetch news" };
  }
};

