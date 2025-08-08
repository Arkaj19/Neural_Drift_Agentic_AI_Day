
"use client";

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
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

// Backend configuration
const BACKEND_URL = 'http://127.0.0.1:5000';
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

// Enhanced Video Stream Component with Auto-Reconnection
const RobustVideoStream: React.FC<VideoStreamProps> = ({ feedId, feedData, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout>();
  const activityTimerRef = useRef<NodeJS.Timeout>();

  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;
  const activityTimeout = 10000; // 10 seconds

  // Generate unique stream URL to prevent caching
  const generateStreamUrl = useCallback(() => {
    const timestamp = Date.now();
    return `${BACKEND_URL}/api/video/stream/${feedId}?t=${timestamp}`;
  }, [feedId]);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    console.log(`✅ Video stream connected for ${feedId}`);
    setIsLoading(false);
    setHasError(false);
    setIsConnected(true);
    setReconnectAttempts(0);
    setLastActivity(Date.now());
    
    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
  }, [feedId]);

  // Handle image load error
  const handleImageError = useCallback((e: any) => {
    console.error(`❌ Video stream error for ${feedId}:`, e);
    setIsLoading(false);
    setHasError(true);
    setIsConnected(false);
    onError?.(`Stream error for ${feedId}`);
    
    // Attempt reconnection if within limits
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
      console.log(`🔄 Reconnecting ${feedId} in ${delay}ms (attempt ${reconnectAttempts + 1})`);
      
      reconnectTimerRef.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        setIsLoading(true);
        setHasError(false);
        setStreamUrl(generateStreamUrl());
      }, delay);
    }
  }, [feedId, reconnectAttempts, generateStreamUrl, onError]);

  // Manual retry function
  const handleManualRetry = useCallback(() => {
    console.log(`🔄 Manual retry for ${feedId}`);
    setReconnectAttempts(0);
    setIsLoading(true);
    setHasError(false);
    setStreamUrl(generateStreamUrl());
  }, [feedId, generateStreamUrl]);

  // Monitor stream activity (detect frozen streams)
  useEffect(() => {
    if (isConnected && !hasError) {
      activityTimerRef.current = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        
        if (timeSinceLastActivity > activityTimeout) {
          console.warn(`⚠️ Stream ${feedId} appears frozen, reconnecting...`);
          handleManualRetry();
        }
      }, activityTimeout);
    }

    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [isConnected, hasError, lastActivity, feedId, handleManualRetry]);

  // Initialize stream
  useEffect(() => {
    setStreamUrl(generateStreamUrl());
    
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [generateStreamUrl]);

  // Update activity timestamp when image changes (indicates new frame)
  const handleImageUpdate = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  if (hasError && reconnectAttempts >= maxReconnectAttempts) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white rounded-md p-4">
        <WifiOff className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm mb-2 text-center">Stream Unavailable</p>
        <p className="text-xs mb-3 text-gray-400 text-center">
          Failed after {maxReconnectAttempts} attempts
        </p>
        <Button size="sm" variant="outline" onClick={handleManualRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-md z-10">
          <div className="text-white text-sm mb-2">
            {reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})` : 'Loading stream...'}
          </div>
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Connection status indicator */}
      <div className="absolute top-2 right-2 z-20">
        {isConnected ? (
          <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs animate-pulse shadow-lg shadow-green-500/50">
            <Wifi className="h-3 w-3" />
            <span>LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
            <WifiOff className="h-3 w-3" />
            <span>OFFLINE</span>
          </div>
        )}
      </div>

      {/* Video stream */}
      {streamUrl && (
        <img
          ref={imgRef}
          src={streamUrl}
          alt={`Live feed from ${feedData?.name || feedId}`}
          className="w-full h-full object-cover rounded-md"
          style={{ display: isLoading ? 'none' : 'block' }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onLoadStart={handleImageUpdate}
        />
      )}
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
      return "border-red-500 shadow-red-500/20";
    case "warning":
      return "border-yellow-500 shadow-yellow-500/20";
    case "normal":
      return "border-green-500/50";
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
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('offline');

  // Fetch feeds data with improved error handling
  const fetchFeedsData = async () => {
    if (!BACKEND_URL) {
        setError("Backend URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL.");
        setIsLoading(false);
        return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/feeds`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFeedsData(data.feeds || {});
      setError(null);
      setLastUpdate(new Date());
      setConnectionStatus('online');
    } catch (err) {
      console.error('Failed to fetch feeds data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feed data');
      setConnectionStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh feeds data
  useEffect(() => {
    fetchFeedsData();
    
    // Refresh every 3 seconds for real-time data
    const interval = setInterval(fetchFeedsData, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefreshAll = () => {
    setIsLoading(true);
    fetchFeedsData();
    setLastUpdate(new Date()); // Force video component re-render
  };

  const handleVideoError = (error: string) => {
    console.error('Video stream error:', error);
  };

  if (isLoading && Object.keys(feedsData).length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Live Camera Feeds</h1>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="min-h-[400px]">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-video w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Camera Feeds</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            <div className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded",
              connectionStatus === 'online' ? "bg-green-800/50 text-green-300" : "bg-red-800/50 text-red-300"
            )}>
              {connectionStatus === 'online' ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>System Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>System Offline</span>
                </>
              )}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-1">
              Error: {error}
            </p>
          )}
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
              key={feedId}
              className={cn(
                "flex flex-col min-h-[450px] transition-shadow duration-300 hover:shadow-2xl", 
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
                <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-900 mb-3">
                  <RobustVideoStream 
                    feedId={feedId} 
                    feedData={feedData}
                    onError={handleVideoError}
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {feedData?.area?.replace('_', ' ').toUpperCase() || 'Unknown Location'}
                  </p>
                  {isOnline && (
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
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
