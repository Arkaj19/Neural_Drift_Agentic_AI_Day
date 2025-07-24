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
  Loader2
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

export default function MapViewPage() {
  const [feeds, setFeeds] = useState<Record<string, FeedLocation>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);

  const fetchFeeds = async () => {
    try {
      setError(null);
      const response = await fetch('/api/feeds');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FeedsResponse = await response.json();
      setFeeds(data.feeds);
      setLastUpdated(data.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feeds');
      console.error('Error fetching feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchFeeds();
  };

  const feedsArray = Object.entries(feeds).map(([id, feed]) => ({
    id,
    ...feed
  }));

  // Calculate map bounds based on feed locations
  const getMapBounds = () => {
    if (feedsArray.length === 0) return { center: { lat: 28.6139, lng: 77.2090 }, zoom: 15 };
    
    const lats = feedsArray.map(f => f.location.lat);
    const lngs = feedsArray.map(f => f.location.lng);
    
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    
    return { 
      center: { lat: centerLat, lng: centerLng },
      zoom: 16
    };
  };

  const mapBounds = getMapBounds();

  // Group feeds by alert level for legend
  const feedsByAlertLevel = feedsArray.reduce((acc, feed) => {
    if (!acc[feed.alert_level]) acc[feed.alert_level] = [];
    acc[feed.alert_level].push(feed);
    return acc;
  }, {} as Record<string, typeof feedsArray>);

  const formatTimestamp = (timestamp: string) => {
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
          <div className="text-sm text-muted-foreground">
            {lastUpdated && `Last updated: ${formatTimestamp(lastUpdated)}`}
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
            {error ? (
              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 font-medium">Unable to load map data</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-lg relative overflow-hidden">
                {/* Simulated Map View - In real implementation, use Google Maps, Mapbox, or Leaflet */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-700 dark:to-slate-600">
                  <div className="absolute inset-4">
                    {/* Grid lines for map effect */}
                    <div className="w-full h-full opacity-20">
                      <div className="grid grid-cols-8 grid-rows-6 w-full h-full border border-slate-300">
                        {Array.from({length: 48}).map((_, i) => (
                          <div key={i} className="border border-slate-200"></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Feed Location Markers */}
                    {feedsArray.map((feed, index) => {
                      const alertConfig = alertLevelConfig[feed.alert_level];
                      // Position markers based on relative coordinates (simplified)
                      const x = 20 + (index * 15) % 60; // Distribute horizontally
                      const y = 20 + Math.floor(index / 4) * 20; // Stack vertically
                      
                      return (
                        <div
                          key={feed.id}
                          className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200",
                            selectedFeed === feed.id ? "scale-125 z-10" : "hover:scale-110"
                          )}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => setSelectedFeed(selectedFeed === feed.id ? null : feed.id)}
                        >
                          <div className={cn("relative p-2 rounded-full shadow-lg", alertConfig.color)}>
                            <MapPin className="h-6 w-6 text-white" />
                            {feed.alert_level === 'critical' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full animate-pulse">
                                <div className="h-full w-full bg-red-400 rounded-full animate-ping"></div>
                              </div>
                            )}
                          </div>
                          
                          {selectedFeed === feed.id && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border min-w-48 z-20">
                              <h4 className="font-semibold text-sm">{feed.name}</h4>
                              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                                <p>Count: {feed.current_count}/{feed.max_capacity}</p>
                                <p>Density: {feed.density_percentage}%</p>
                                <p>Status: <span className={alertConfig.textColor}>{alertConfig.label}</span></p>
                                <p>Lat: {feed.location.lat.toFixed(4)}, Lng: {feed.location.lng.toFixed(4)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/80 dark:bg-black/80 px-2 py-1 rounded">
                  100m scale • Center: {mapBounds.center.lat.toFixed(4)}, {mapBounds.center.lng.toFixed(4)}
                </div>
              </div>
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
                <div key={feed.id} className="space-y-2">
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
                    {feed.area} • Updated {formatTimestamp(feed.last_updated)}
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
                    <div><strong>Area:</strong> {feed.area}</div>
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

    