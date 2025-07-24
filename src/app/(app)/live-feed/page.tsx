'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Video,
  Users,
  Maximize,
  RefreshCw,
  Dot,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";

// Backend configuration
const BACKEND_URL = "http://localhost:5000"; // Replace with your actual backend URL

// Feed configuration based on your backend CCTV_FEEDS
const FEED_IDS = ["feed_1", "feed_2", "feed_3", "feed_4", "feed_5"];

interface FeedData {
  name: string;
  current_count: number;
  max_capacity: number;
  density_percentage: number;
  alert_level: "normal" | "warning" | "critical";
  last_updated: string;
  location: {
    lat: number;
    lng: number;
  };
  area: string;
}

interface VideoStreamProps {
  feedId: string;
  feedData?: FeedData;
  onError?: (error: string) => void;
}

// Video Stream Component
const VideoStream: React.FC<VideoStreamProps> = ({ feedId, feedData, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const streamUrl = `${BACKEND_URL}/api/video/stream/${feedId}`;

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setHasError(false);
      }, 2000 * (retryCount + 1)); // Exponential backoff
    }
    
    onError?.(`Failed to load video stream for ${feedId}`);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setIsLoading(true);
    setHasError(false);
  };

  if (hasError && retryCount >= maxRetries) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white rounded-md">
        <AlertTriangle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm mb-2">Stream Unavailable</p>
        <Button size="sm" variant="outline" onClick={handleRetry}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-md">
          <div className="text-white text-sm">Loading stream...</div>
        </div>
      )}
      <img
        src={streamUrl}
        alt={`Live feed from ${feedData?.name || feedId}`}
        className="w-full h-full object-cover rounded-md"
        style={{ display: isLoading ? 'none' : 'block' }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

const getStatusBadgeVariant = (status: "normal" | "warning" | "critical") => {
  switch (status) {
    case "critical":
      return "destructive";
    case "warning":
      return "default";
    case "normal":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: "normal" | "warning" | "critical") => {
  switch (status) {
    case "critical":
      return "border-red-500";
    case "warning":
      return "border-yellow-500";
    case "normal":
      return "border-green-500";
    default:
      return "border-gray-500";
  }
};

const getStatusText = (status: "normal" | "warning" | "critical") => {
  switch (status) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    case "normal":
      return "Normal";
    default:
      return "Unknown";
  }
};

export default function LiveFeedPage() {
  const [feedsData, setFeedsData] = useState<Record<string, FeedData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch feeds data
  const fetchFeedsData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/feeds`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFeedsData(data.feeds || {});
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch feeds data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feed data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh feeds data
  useEffect(() => {
    fetchFeedsData();
    
    const interval = setInterval(fetchFeedsData, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleRefreshAll = () => {
    setIsLoading(true);
    fetchFeedsData();
    // Force reload all video streams by updating the key
    setLastUpdate(new Date());
  };

  const handleVideoError = (error: string) => {
    console.error('Video stream error:', error);
  };

  if (isLoading && Object.keys(feedsData).length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-10" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Camera Feeds</h1>
          {error && (
            <p className="text-sm text-red-500 mt-1">
              Error: {error}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshAll} disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh All
          </Button>
          <Button variant="outline">
            <Maximize className="mr-2 h-4 w-4" /> Full Screen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEED_IDS.map((feedId) => {
          const feedData = feedsData[feedId];
          const isOnline = feedData != null;

          return (
            <Card 
              key={`${feedId}-${lastUpdate.getTime()}`} 
              className={cn(
                "flex flex-col", 
                isOnline ? getStatusColor(feedData.alert_level) : "border-gray-400", 
                "border-2"
              )}
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">
                  {feedData?.name || feedId.replace('_', ' ').toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isOnline && (
                    <Badge variant={getStatusBadgeVariant(feedData.alert_level)}>
                      {getStatusText(feedData.alert_level)}
                    </Badge>
                  )}
                  {!isOnline && (
                    <Badge variant="outline">Offline</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-900">
                  <VideoStream 
                    feedId={feedId} 
                    feedData={feedData}
                    onError={handleVideoError}
                  />
                </div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {feedData?.area?.replace('_', ' ').toUpperCase() || 'Unknown Location'}
                  </p>
                  {isOnline && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        People: {feedData.current_count}/{feedData.max_capacity}
                      </span>
                      <span>
                        Density: {feedData.density_percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>640x480 @ 15fps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{feedData?.current_count || 0}</span>
                </div>
                {isOnline && feedData.alert_level !== 'normal' && (
                  <div className="flex items-center gap-1 text-red-400">
                    <Dot className="h-6 w-6 animate-pulse" />
                    <span>ALERT</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
