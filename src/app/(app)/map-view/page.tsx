
'use client';
import React, { useState, useEffect, useRef } from 'react';
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
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

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
    label: "Critical Alert",
    markerColor: "#f54242"
  },
  warning: {
    color: "bg-yellow-500", 
    textColor: "text-yellow-400",
    icon: AlertTriangle,
    label: "Warning",
    markerColor: "#f5a742"
  },
  normal: {
    color: "bg-green-500",
    textColor: "text-green-400", 
    icon: TrendingUp,
    label: "Normal",
    markerColor: "#42f54b"
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
const InteractiveMap = ({ feeds }: {
  feeds: FeedLocation[];
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [lng] = useState(77.6353);
  const [lat] = useState(12.9667);
  const [zoom] = useState(14);
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.error("MapTiler API key is missing. Please add it to your .env file.");
      return;
    }

    if (map.current || !mapContainer.current) return;

    maptilersdk.config.apiKey = apiKey;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREET,
      center: [lng, lat],
      zoom: zoom
    });
    
    feeds.forEach(feed => {
        const el = document.createElement('div');
        el.className = `p-2 rounded-full shadow-lg border-2 border-white ${alertLevelConfig[feed.alert_level]?.color || 'bg-gray-500'}`;
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';


        const popup = new maptilersdk.Popup({ closeButton: false, offset: 25 })
          .setHTML(`
            <div class="p-2 bg-card text-card-foreground rounded-lg shadow-xl border min-w-56">
                <h4 class="font-semibold text-base mb-2 text-center">${feed.name}</h4>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><p class="text-muted-foreground">Count</p><p class="font-semibold">${feed.current_count}/${feed.max_capacity}</p></div>
                    <div><p class="text-muted-foreground">Density</p><p class="font-semibold">${feed.density_percentage}%</p></div>
                    <div><p class="text-muted-foreground">Status</p><span class="text-xs font-semibold px-2 py-0.5 rounded-full ${feed.alert_level === 'critical' ? 'bg-destructive text-destructive-foreground' : feed.alert_level === 'warning' ? 'bg-yellow-500 text-black' : 'bg-secondary text-secondary-foreground'}">${alertLevelConfig[feed.alert_level].label}</span></div>
                    <div><p class="text-muted-foreground">Area</p><p class="font-semibold capitalize">${feed.area.replace('_', ' ')}</p></div>
                </div>
                <div class="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    📍 ${feed.location.lat.toFixed(4)}, ${feed.location.lng.toFixed(4)}
                </div>
            </div>
          `);

        new maptilersdk.Marker({ 
            element: el,
            color: alertLevelConfig[feed.alert_level].markerColor 
        })
        .setLngLat([feed.location.lng, feed.location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

  }, [feeds, lat, lng, zoom, apiKey]);

  if (!apiKey) {
    return (
        <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">MapTiler API Key Missing</h3>
            <p className="text-muted-foreground">
                Please add your <code className="bg-muted-foreground/20 px-1 py-0.5 rounded">NEXT_PUBLIC_MAPTILER_API_KEY</code> to your <code className="bg-muted-foreground/20 px-1 py-0.5 rounded">.env</code> file.
            </p>
        </div>
    )
  }

  return (
    <div className="aspect-video w-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default function MapViewPage() {
  const [feeds, setFeeds] = useState<Record<string, FeedLocation>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/feeds');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: FeedsResponse = await response.json();
      setFeeds(data.feeds);
      setLastUpdated(data.timestamp);
      setIsOnline(true);
      
    } catch (err) {
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

  const feedsArray = Object.values(feeds);

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
              const count = feedsByAlertLevel[level as keyof typeof feedsByAlertLevel]?.length || 0;
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
      </div>
    </div>
  );
}

    