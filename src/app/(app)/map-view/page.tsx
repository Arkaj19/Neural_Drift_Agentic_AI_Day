
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Maximize, 
  RefreshCw, 
  MapPin, 
  Users, 
  AlertTriangle,
  Zap,
  TrendingUp,
  Loader2,
  Wifi,
  WifiOff
} from "lucide-react";

interface FeedLocation {
  feed_id: string;
  name: string;
  current_count: number;
  max_capacity: number;
  density_percentage: number;
  alert_level: 'normal' | 'warning' | 'critical';
  last_updated: string;
  location: {
    lat: number;
    lng: number;
  };
  area: string;
}

interface FeedsResponse {
  feeds: Record<string, FeedLocation>;
  total_count: number;
  timestamp: string;
}

const alertLevelConfig = {
  critical: {
    color: "bg-red-500",
    textColor: "text-red-400",
    icon: Zap,
    label: "Critical Alert"
  },
  warning: {
    color: "bg-yellow-500", 
    textColor: "text-yellow-400",
    icon: AlertTriangle,
    label: "Warning"
  },
  normal: {
    color: "bg-green-500",
    textColor: "text-green-400", 
    icon: TrendingUp,
    label: "Normal"
  }
};

const getStatusColor = (alertLevel: string) => {
  return alertLevelConfig[alertLevel as keyof typeof alertLevelConfig]?.textColor || "text-gray-400";
};

const getProgressColor = (capacity: number) => {
  if (capacity > 90) return "bg-red-500";
  if (capacity > 75) return "bg-yellow-500";
  return "bg-green-500";
};

// Interactive Map Component
const InteractiveMap = ({ feeds, selectedFeed, onFeedSelect }: {
  feeds: FeedLocation[];
  selectedFeed: string | null;
  onFeedSelect: (feedId: string | null) => void;
}) => {
  const [mapCenter, setMapCenter] = useState({ lat: 28.6141, lng: 77.2092 });
  const [zoom, setZoom] = useState(16);

  // Calculate map bounds
  useEffect(() => {
    if (feeds.length > 0) {
      const lats = feeds.map(f => f.location.lat);
      const lngs = feeds.map(f => f.location.lng);
      
      const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
      const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
      
      setMapCenter({ lat: centerLat, lng: centerLng });
    }
  }, [feeds]);

  return (
    <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-lg relative overflow-hidden">
      {/* OpenStreetMap-style background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 dark:from-slate-700 dark:to-slate-600">
        
        {/* Map Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full grid grid-cols-12 grid-rows-8 border border-slate-400">
            {Array.from({length: 96}).map((_, i) => (
              <div key={i} className="border border-slate-300"></div>
            ))}
          </div>
        </div>

        {/* Streets simulation */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-300 dark:bg-gray-600 opacity-60"></div>
          <div className="absolute bottom-1/3 left-0 right-0 h-2 bg-gray-300 dark:bg-gray-600 opacity-60"></div>
          <div className="absolute top-0 bottom-0 left-1/4 w-2 bg-gray-300 dark:bg-gray-600 opacity-60"></div>
          <div className="absolute top-0 bottom-0 right-1/4 w-2 bg-gray-300 dark:bg-gray-600 opacity-60"></div>
        </div>

        {/* Feed Location Markers */}
        <div className="absolute inset-4">
          {feeds.map((feed, index) => {
            const alertConfig = alertLevelConfig[feed.alert_level];
            
            // Convert lat/lng to pixel position (simplified projection)
            const relativeX = ((feed.location.lng - mapCenter.lng) * 100000) + 50;
            const relativeY = 50 - ((feed.location.lat - mapCenter.lat) * 100000);
            
            // Ensure markers stay within bounds
            const x = Math.max(5, Math.min(95, relativeX));
            const y = Math.max(5, Math.min(95, relativeY));
            
            return (
              <div
                key={feed.feed_id}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300",
                  selectedFeed === feed.feed_id ? "scale-125 z-20" : "hover:scale-110 z-10"
                )}
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => onFeedSelect(selectedFeed === feed.feed_id ? null : feed.feed_id)}
              >
                {/* Marker */}
                <div className={cn("relative p-3 rounded-full shadow-lg border-2 border-white", alertConfig.color)}>
                  <MapPin className="h-6 w-6 text-white" />
                  
                  {/* Critical alert animation */}
                  {feed.alert_level === 'critical' && (
                    <>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full animate-pulse">
                        <div className="h-full w-full bg-red-400 rounded-full animate-ping"></div>
                      </div>
                      <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></div>
                    </>
                  )}
                  
                  {/* Count badge */}
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 text-xs font-bold px-2 py-1 rounded-full border shadow-sm">
                    {feed.current_count}
                  </div>
                </div>
                
                {/* Info popup */}
                {selectedFeed === feed.feed_id && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border min-w-64 z-30">
                    <div className="text-center">
                      <h4 className="font-semibold text-base mb-2">{feed.name}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-left">
                          <p className="text-muted-foreground">Count</p>
                          <p className="font-semibold">{feed.current_count}/{feed.max_capacity}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-muted-foreground">Density</p>
                          <p className="font-semibold">{feed.density_percentage}%</p>
                        </div>
                        <div className="text-left">
                          <p className="text-muted-foreground">Status</p>
                          <Badge variant={
                            feed.alert_level === 'critical' ? 'destructive' : 
                            feed.alert_level === 'warning' ? 'default' : 'secondary'
                          } className="text-xs">
                            {alertConfig.label}
                          </Badge>
                        </div>
                        <div className="text-left">
                          <p className="text-muted-foreground">Area</p>
                          <p className="font-semibold capitalize">{feed.area.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
                        📍 {feed.location.lat.toFixed(4)}, {feed.location.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Map controls */}
        <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 flex flex-col gap-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setZoom(Math.min(20, zoom + 1))}
            className="h-8 w-8 p-0"
          >
            +
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setZoom(Math.max(10, zoom - 1))}
            className="h-8 w-8 p-0"
          >
            -
          </Button>
        </div>

        {/* Scale and coordinates */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/90 dark:bg-black/90 px-3 py-2 rounded-lg">
          <div>Scale: 1:{Math.round(1000 / zoom * 100)}m</div>
          <div>Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}</div>
          <div>Zoom: {zoom}</div>
        </div>
      </div>
    </div>
  );
};

export default function MapViewPage() {
  const [feeds, setFeeds] = useState<Record<string, FeedLocation>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const fetchFeeds = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch('/api/feeds');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: FeedsResponse = await response.json();
      setFeeds(data.feeds);
      setLastUpdated(data.timestamp);
      setIsOnline(true);
      
    } catch (err) {
      console.error('API call failed, will not use mock data:', err);
      setError(err instanceof Error ? err.message : 'API not available');
      setIsOnline(false);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchFeeds();
  };

  const feedsArray = Object.entries(feeds).map(([id, feed]) => ({
    ...feed,
    feed_id: id
  }));

  // Group feeds by alert level for legend
  const feedsByAlertLevel = feedsArray.reduce((acc, feed) => {
    if (!acc[feed.alert_level]) acc[feed.alert_level] = [];
    acc[feed.alert_level].push(feed);
    return acc;
  }, {} as Record<string, typeof feedsArray>);

  const formatTimestamp = (timestamp: string) => {
    if(!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {lastUpdated && `Last updated: ${formatTimestamp(lastUpdated)}`}
            </div>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-yellow-500" />
              )}
              <span className={cn("text-xs", isOnline ? "text-green-500" : "text-yellow-500")}>
                {isOnline ? "Live" : "Offline"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline">
              <Maximize className="mr-2 h-4 w-4" />
              Full Screen
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Connection Error</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Could not connect to the data source: {error}
            </p>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Feed Locations</span>
              <Badge variant="outline">
                {feedsArray.length} Active Feeds
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <InteractiveMap 
                feeds={feedsArray}
                selectedFeed={selectedFeed}
                onFeedSelect={setSelectedFeed}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Map Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.entries(alertLevelConfig).map(([level, config]) => {
              const count = feedsByAlertLevel[level]?.length || 0;
              const Icon = config.icon;
              return (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-4 w-4 rounded-full", config.color)}></span>
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Feed Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading feeds...</p>
              </div>
            ) : feedsArray.length === 0 ? (
              <div className="text-center py-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No feeds available</p>
              </div>
            ) : (
              feedsArray.map((feed) => (
                <div key={feed.feed_id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={cn("font-medium", getStatusColor(feed.alert_level))}>
                      {feed.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{feed.density_percentage}%</span>
                      <Badge 
                        variant={feed.alert_level === 'critical' ? 'destructive' : 
                                feed.alert_level === 'warning' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {feed.current_count}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={feed.density_percentage} 
                    className="h-2" 
                    indicatorClassName={getProgressColor(feed.density_percentage)} 
                  />
                  <div className="text-xs text-muted-foreground">
                    {feed.area.replace('_', ' ')} • Updated {formatTimestamp(feed.last_updated)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {selectedFeed && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="text-base">Selected Feed Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {(() => {
                const feed = feeds[selectedFeed];
                if (!feed) return null;
                return (
                  <>
                    <div><strong>Name:</strong> {feed.name}</div>
                    <div><strong>Location:</strong> {feed.location.lat.toFixed(6)}, {feed.location.lng.toFixed(6)}</div>
                    <div><strong>Area:</strong> {feed.area.replace('_', ' ')}</div>
                    <div><strong>Capacity:</strong> {feed.current_count}/{feed.max_capacity}</div>
                    <div><strong>Density:</strong> {feed.density_percentage}%</div>
                    <div><strong>Status:</strong> 
                      <Badge className="ml-2" variant={
                        feed.alert_level === 'critical' ? 'destructive' : 
                        feed.alert_level === 'warning' ? 'default' : 'secondary'
                      }>
                        {feed.alert_level.toUpperCase()}
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

    