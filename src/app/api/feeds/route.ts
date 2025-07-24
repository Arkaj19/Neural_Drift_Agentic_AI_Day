
import { NextResponse } from 'next/server';

// Mock data - in a real application, this would come from a database or a real-time service
const mockFeeds: Record<string, any> = {
  feed_1: {
    feed_id: "feed_1",
    name: "Main Entrance",
    current_count: 45,
    max_capacity: 50,
    density_percentage: 90,
    alert_level: "critical",
    last_updated: new Date().toISOString(),
    location: { lat: 28.6139, lng: 77.2090 },
    area: "entrance"
  },
  feed_2: {
    feed_id: "feed_2", 
    name: "Mall Stage",
    current_count: 76,
    max_capacity: 100,
    density_percentage: 76,
    alert_level: "warning",
    last_updated: new Date().toISOString(),
    location: { lat: 28.6140, lng: 77.2091 },
    area: "stage"
  },
  feed_3: {
    feed_id: "feed_3",
    name: "Red Street Road", 
    current_count: 18,
    max_capacity: 30,
    density_percentage: 60,
    alert_level: "normal",
    last_updated: new Date().toISOString(),
    location: { lat: 28.6141, lng: 77.2092 },
    area: "food_court"
  },
  feed_4: {
    feed_id: "feed_4",
    name: "Exit Gate",
    current_count: 12,
    max_capacity: 25, 
    density_percentage: 48,
    alert_level: "normal",
    last_updated: new Date().toISOString(),
    location: { lat: 28.6142, lng: 77.2093 },
    area: "exit_a"
  },
  feed_5: {
    feed_id: "feed_5",
    name: "Subway",
    current_count: 20,
    max_capacity: 25,
    density_percentage: 80,
    alert_level: "warning", 
    last_updated: new Date().toISOString(),
    location: { lat: 28.6143, lng: 77.2094 },
    area: "exit_b"
  }
};


function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET() {
  // Simulate some real-time fluctuations
  const updatedFeeds = Object.keys(mockFeeds).reduce((acc, feedId) => {
    const feed = mockFeeds[feedId];
    const count_change = getRandomInt(-5, 5);
    const new_count = Math.max(0, feed.current_count + count_change);
    const new_density = Math.round((new_count / feed.max_capacity) * 100);
    
    let new_level = feed.alert_level;
    if (new_density > 90) {
      new_level = 'critical';
    } else if (new_density > 75) {
      new_level = 'warning';
    } else {
      new_level = 'normal';
    }

    acc[feedId] = {
      ...feed,
      current_count: new_count,
      density_percentage: new_density,
      alert_level: new_level,
      last_updated: new Date().toISOString()
    };
    return acc;
  }, {} as Record<string, any>);

  const total_count = Object.values(updatedFeeds).reduce((sum, feed) => sum + feed.current_count, 0);

  const response = {
    feeds: updatedFeeds,
    total_count: total_count,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

// To prevent caching and ensure dynamic data on every request
export const dynamic = 'force-dynamic';
