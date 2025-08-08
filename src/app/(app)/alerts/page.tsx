
'use client';
import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  BrainCircuit
} from "lucide-react";

// Map API alert levels to proper crowd monitoring alert types
const alertLevelMapping = {
  critical: {
    type: "Critical Crowding",
    priority: "High",
    icon: Zap,
    variant: "destructive" as const,
    color: "bg-red-900/20 border-red-500",
    badgeClass: "bg-red-500",
  },
  warning: {
    type: "High Density", 
    priority: "Medium",
    icon: Users,
    variant: "default" as const,
    color: "bg-yellow-900/20 border-yellow-500",
    badgeClass: "bg-yellow-500 text-black",
  },
  normal: {
    type: "Normal Traffic",
    priority: "Low", 
    icon: TrendingUp,
    variant: "secondary" as const,
    color: "bg-blue-900/20 border-blue-500",
    badgeClass: "bg-blue-500",
  },
  predicted: {
    type: "Predicted Crowding",
    priority: "Medium",
    icon: BrainCircuit,
    variant: "default" as const,
    color: "bg-purple-900/20 border-purple-500",
    badgeClass: "bg-purple-500",
  }
};

// Map API feed areas to sector names for consistency with your UI
const areaSectorMapping: Record<string, string> = {
  "entrance": "Sector A",
  "stage": "Sector B", 
  "food_court": "Sector C",
  "exit_a": "Sector D",
  "exit_b": "Sector E"
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

interface Prediction {
    sectorId: string;
    predictedCrowd: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string;
}

interface PredictedAlert {
  feed_id: string;
  feed_name: string;
  alert_level: 'predicted';
  current_count: number;
  recommendations: string;
  timestamp: string;
}

type CombinedAlert = ApiAlert | PredictedAlert;

interface AlertsResponse {
  alerts: ApiAlert[];
  count: number;
  timestamp: string;
}

interface PredictionsResponse {
  predictions: Prediction[];
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<CombinedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'count'>('timestamp');
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'warning' | 'predicted'>('all');
  const intervalRef = useRef<NodeJS.Timeout>();


  const fetchAlertsAndPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real-time alerts
      const alertsResponse = await fetch('http://localhost:5000/api/alerts');
      // const alertsResponse = await fetch('http://34.122.108.119:8000/api/alerts');
      // const alertsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/alerts`);
      if (!alertsResponse.ok) {
        throw new Error(`HTTP error! status: ${alertsResponse.status}`);
      }
      const alertsData: AlertsResponse = await alertsResponse.json();
      
      // Fetch predictions
      const predictionsResponse = await fetch('http://localhost:5000/api/predictions')
      // const predictionsResponse = await fetch('http://34.122.108.119:8000/api/predictions')
      // const predictionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/predictions`);
       if (!predictionsResponse.ok) {
        throw new Error(`HTTP error! status: ${predictionsResponse.status}`);
      }
      const predictionsData: PredictionsResponse = await predictionsResponse.json();
      
      const predictions = Array.isArray(predictionsData.predictions) ? predictionsData.predictions : [];

      const predictedAlerts: PredictedAlert[] = predictions
        .filter(p => p.riskLevel === 'high')
        .map(p => ({
            feed_id: `pred_${p.sectorId.replace(' ', '_')}`,
            feed_name: p.sectorId,
            alert_level: 'predicted',
            current_count: p.predictedCrowd,
            recommendations: p.recommendations,
            timestamp: new Date().toISOString()
        }));

      setAlerts([...alertsData.alerts, ...predictedAlerts]);
      setLastUpdated(alertsData.timestamp);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch alerts';
      setError(errorMessage);
      console.error('Error fetching alerts:', err);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    fetchAlertsAndPredictions();
    intervalRef.current = setInterval(fetchAlertsAndPredictions, 15000); // Poll every 15s
  };

  useEffect(() => {
    startPolling();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
    
    if (filterLevel !== 'all') {
      filtered = alerts.filter(alert => alert.alert_level === filterLevel);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'priority':
          const priorityOrder = { critical: 4, predicted: 3, warning: 2, normal: 1 };
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
    startPolling();
  };

  const handleFilterChange = () => {
    const levels: ('all' | 'critical' | 'warning' | 'predicted')[] = ['all', 'critical', 'warning', 'predicted'];
    const currentIndex = levels.indexOf(filterLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    setFilterLevel(levels[nextIndex]);
  }

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
        <Card className="border-red-500 bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading alerts</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Could not connect to the alerts service. Please ensure the backend is running and try again.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">Details: {error}</p>
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
            onClick={handleFilterChange}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter: {filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1)}
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
                        details.badgeClass
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        {details.type} - {alert.feed_name}
                      </p>
                       {'density_percentage' in alert && (
                        <p className="text-sm text-muted-foreground">
                          Density: {alert.density_percentage}%
                        </p>
                      )}
                      {'recommendations' in alert && (
                         <p className="text-sm text-muted-foreground">
                          {alert.recommendations}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                  <div className="flex flex-col gap-1 items-start md:items-end">
                    <Badge
                      className={cn(details.badgeClass)}
                    >
                      {alert.alert_level.toUpperCase()}
                    </Badge>
                     {'current_count' in alert && (
                        <span className="text-xs text-muted-foreground">
                            {alert.alert_level === 'predicted' ? 'Predicted' : 'Current'} Count: {alert.current_count}
                        </span>
                     )}
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
          Auto-refresh every 15 seconds
        </p>
      </div>
    </div>
  );
}