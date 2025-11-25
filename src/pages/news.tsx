import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useSessionStore } from "@/store/sessionStore";
import PermissionDenied from "./permission-denied";
import { getNews, type NewsArticle } from "@/lib/api/news";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Newspaper, ExternalLink, Globe, Filter, Loader2 } from "lucide-react";
import moment from "moment";

const COUNTRIES = {
  India: "in",
  World: "wo",
  "United States": "us",
  Australia: "au",
  Brazil: "br",
  China: "cn",
  France: "fr",
  Germany: "de",
  Iran: "ir",
  Japan: "jp",
  Malaysia: "my",
  Maldives: "mv",
  "New zealand": "nz",
  "North korea": "kp",
  Pakistan: "pk",
  Russia: "ru",
  "South africa": "za",
  "South korea": "kr",
  "Sri Lanka": "lk",
  "United arab emirates": "ae",
  "United kingdom": "gb",
};

const CATEGORIES = {
  Business: "business",
  Crime: "crime",
  Domestic: "domestic",
  Education: "education",
  Entertainment: "entertainment",
  Environment: "environment",
  Food: "food",
  Health: "health",
  Lifestyle: "lifestyle",
  Other: "other",
  Politics: "politics",
  Science: "science",
  Sports: "sports",
  Technology: "technology",
  Top: "top",
  Tourism: "tourism",
  World: "world",
};

export default function NewsPage() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, permissions } = useSessionStore();
  const { toast } = useToast();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState<string | undefined>(undefined);
  const [totalResults, setTotalResults] = useState(0);
  const [country, setCountry] = useState("in");
  const [category, setCategory] = useState("top");
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [selectedCategory, setSelectedCategory] = useState("Top");
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    if (!permissions.includes("news")) {
      return;
    }
    // Initial fetch on mount
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, permissions, setLocation]);

  const fetchNews = async (countryCode?: string, categoryCode?: string, loadMore: boolean = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const currentCountry = countryCode || country;
      const currentCategory = categoryCode || category;
      const page = loadMore ? nextPage : undefined;

      const response = await getNews(currentCountry, currentCategory, page);

      if (response.status === 1 && response.data) {
        if (loadMore) {
          setArticles((prev) => [...prev, ...response.data!.results]);
        } else {
          setArticles(response.data.results);
        }
        setNextPage(response.data.nextPage);
        setTotalResults(response.data.totalResults);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch news",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Error",
        description: "Failed to fetch news",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleCountryChange = (countryName: string) => {
    const countryCode = COUNTRIES[countryName as keyof typeof COUNTRIES];
    setCountry(countryCode);
    setSelectedCountry(countryName);
    setNextPage(undefined);
    fetchNews(countryCode, undefined, false);
  };

  const handleCategoryChange = (categoryName: string) => {
    const categoryCode = CATEGORIES[categoryName as keyof typeof CATEGORIES];
    setCategory(categoryCode);
    setSelectedCategory(categoryName);
    setNextPage(undefined);
    fetchNews(undefined, categoryCode, false);
  };

  const handleLoadMore = useCallback(() => {
    if (nextPage && !isLoadingMore) {
      fetchNews(undefined, undefined, true);
    }
  }, [nextPage, isLoadingMore]);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPage && !isLoadingMore && articles.length < totalResults) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [handleLoadMore, nextPage, isLoadingMore, articles.length, totalResults]);

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (!permissions.includes("news")) {
    return <PermissionDenied permission="news" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-2 flex items-center gap-3">
              <Newspaper className="h-8 w-8 sm:h-10 sm:w-10" />
              News Headlines
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              {capitalize(selectedCountry)} - {capitalize(selectedCategory)} News
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COUNTRIES).map((countryName) => (
                  <SelectItem key={countryName} value={countryName}>
                    {countryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORIES).map((categoryName) => (
                  <SelectItem key={categoryName} value={categoryName}>
                    {categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="rounded-xl">
                <Skeleton className="h-48 w-full rounded-t-xl" />
                <CardHeader>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card
                  key={article.article_id}
                  className="rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={
                        article.image_url ||
                        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"
                      }
                      alt={article.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800";
                      }}
                    />
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                    >
                      {article.source_name}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg">{article.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {moment(article.pubDate).format("MMM DD, YYYY HH:mm")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {article.description || "No description available"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => window.open(article.link, "_blank", "noopener,noreferrer")}
                    >
                      Read More
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Infinite scroll sentinel and loading indicator */}
            {articles.length < totalResults && (
              <div ref={observerTarget} className="flex justify-center py-8">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more news...</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Card className="rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Newspaper className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">No news articles found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

