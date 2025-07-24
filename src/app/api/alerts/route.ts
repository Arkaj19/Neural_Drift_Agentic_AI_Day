import { NextResponse } from 'next/server';

// Mock data - in a real application, this would come from a database or a real-time service
const mockAlerts = [
  {
    feed_id: "feed_1",
    feed_name: "Main Entrance",
    alert_level: 'critical' as const,
    current_count: 150,
    density_percentage: 95,
    location: { lat: 34.0522, lng: -118.2437 },
    area: "Sector A",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
  },
  {
    feed_id: "feed_2",
    feed_name: "Food Court",
    alert_level: 'warning' as const,
    current_count: 80,
    density_percentage: 80,
    location: { lat: 34.0530, lng: -118.2445 },
    area: "Sector B",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  },
  {
    feed_id: "feed_3",
    feed_name: "Concert Stage",
    alert_level: 'warning' as const,
    current_count: 250,
    density_percentage: 83,
    location: { lat: 34.0545, lng: -118.2460 },
    area: "Sector C",
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(), // 7 minutes ago
  },
  {
    feed_id: "feed_4",
    feed_name: "Merch Booth",
    alert_level: 'normal' as const,
    current_count: 45,
    density_percentage: 45,
    location: { lat: 34.0525, lng: -118.2455 },
    area: "Sector D",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
  },
  {
    feed_id: "feed_5",
    feed_name: "Exit Gate 3",
    alert_level: 'normal' as const,
    current_count: 20,
    density_percentage: 20,
    location: { lat: 34.0510, lng: -118.2420 },
    area: "Sector E",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
  },
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET() {
  // Simulate some real-time fluctuations
  const updatedAlerts = mockAlerts.map(alert => {
    const count_change = getRandomInt(-5, 5);
    const new_count = Math.max(0, alert.current_count + count_change);
    const new_density = Math.min(100, Math.max(0, alert.density_percentage + count_change));
    
    let new_level = alert.alert_level;
    if (new_density > 90) {
      new_level = 'critical';
    } else if (new_density > 75) {
      new_level = 'warning';
    } else {
      new_level = 'normal';
    }
    
    return {
      ...alert,
      current_count: new_count,
      density_percentage: new_density,
      alert_level: new_level,
      timestamp: new Date().toISOString()
    };
  });

  const response = {
    alerts: updatedAlerts,
    count: updatedAlerts.length,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

// To prevent caching and ensure dynamic data on every request
export const dynamic = 'force-dynamic';
