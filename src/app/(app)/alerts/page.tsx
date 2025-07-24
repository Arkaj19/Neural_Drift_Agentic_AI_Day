'use client';
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Zap,
  Users,
  TrendingUp,
  Filter,
  ArrowDownUp,
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react";

// Map API alert levels to your existing alert types
const alertLevelMapping = {
  critical: {
    type: "Violence",
    priority: "High",
    icon: Zap,
    variant: "destructive" as const,
    color: "bg-red-900/20 border-red-500",
    badgeClass: "bg-red-500",
  },
  warning: {
    type: "Crowding", 
    priority: "Medium",
    icon: Users,
    variant: "default" as const,
    color: "bg-yellow-900/20 border-yellow-500",
    badgeClass: "bg-yellow-500 text-black",
  },
  normal: {
    type: "Normal",
    priority: "Low", 
    icon: TrendingUp,
    variant: "secondary" as const,
    color: "bg-blue-900/20 border-blue-500",
    badgeClass: "bg-blue-500",
  },
};

interface ApiAlert {
  feed_id: string;
  feed_name: string;
  alert_level: 'critical' | 'warning' | 'normal';
  current_count: number;
  density_percentage: number;
  location: {
    lat: number;
    lng: number;
  };
  area: string;
  timestamp: string;
}

interface AlertsResponse {
  alerts: ApiAlert[];
  count: number;
  timestamp: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'count'>('timestamp');
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'warning'>('all');

  const fetchAlerts = async () => {
    try {
      setError(null);
      const response = await fetch('/api/alerts');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AlertsResponse = await response.json();
      setAlerts(data.alerts);
      setLastUpdated(data.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Set up polling for real-time updates every 10 seconds
    const interval = setInterval(fetchAlerts, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getSortedAndFilteredAlerts = () => {
    let filtered = alerts;
    
    // Filter by alert level
    if (filterLevel !== 'all') {
      filtered = alerts.filter(alert => alert.alert_level === filterLevel);
    }
    
    // Sort alerts
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'priority':
          const priorityOrder = { critical: 3, warning: 2, normal: 1 };
          return priorityOrder[b.alert_level] - priorityOrder[a.alert_level];
        case 'count':
          return b.current_count - a.current_count;
        default:
          return 0;
      }
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchAlerts();
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading alerts</span>
            </div>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedAndFilteredAlerts = getSortedAndFilteredAlerts();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            Last updated: {lastUpdated ? formatTimestamp(lastUpdated) : 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setFilterLevel(filterLevel === 'all' ? 'critical' : filterLevel === 'critical' ? 'warning' : 'all')}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter: {filterLevel === 'all' ? 'All' : filterLevel === 'critical' ? 'Critical' : 'Warning'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSortBy(sortBy === 'timestamp' ? 'priority' : sortBy === 'priority' ? 'count' : 'timestamp')}
          >
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Sort: {sortBy === 'timestamp' ? 'Time' : sortBy === 'priority' ? 'Priority' : 'Count'}
          </Button>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {sortedAndFilteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No alerts found</h3>
              <p className="text-sm text-muted-foreground">
                {filterLevel === 'all' 
                  ? "All systems are operating normally" 
                  : `No ${filterLevel} alerts at this time`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAndFilteredAlerts.map((alert, index) => {
            const details = alertLevelMapping[alert.alert_level];
            const Icon = details.icon;
            
            return (
              <Card key={`${alert.feed_id}-${index}`} className={cn("border-l-4", details.color)}>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                  <div className="flex items-center gap-4 md:col-span-2">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        alert.alert_level === "critical" && "bg-destructive",
                        alert.alert_level === "warning" && "bg-yellow-500",
                        alert.alert_level === "normal" && "bg-blue-500"
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        {details.type} - {alert.feed_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alert.area} • Count: {alert.current_count} • Density: {alert.density_percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={details.variant}
                      className={cn(details.badgeClass)}
                    >
                      {alert.alert_level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.feed_id}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Showing {sortedAndFilteredAlerts.length} of {alerts.length} alerts
        </p>
        <p className="text-xs text-muted-foreground">
          Auto-refresh every 10 seconds
        </p>
      </div>
    </div>
  );
}
