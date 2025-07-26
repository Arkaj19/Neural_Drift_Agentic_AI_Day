
'use client';
import React, { useState, useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

interface Location {
  lat: string | number;
  lng: string | number;
}

interface HeatmapDataItem {
  name: string;
  area: string;
  location: Location;
  intensity: string | number;
  count: string | number;
  alert_level: string;
  apiTimestamp?: string;
  firestoreTimestamp?: any;
  lastUpdated?: string;
  id?: string;
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '75vh', // Adjusted for better viewing
  position: 'relative',
};

const statusStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  left: '10px',
  zIndex: 1000,
  padding: '8px 12px',
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  borderRadius: '5px',
  fontSize: '12px',
};

const legendStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    zIndex: 1000,
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    fontSize: '12px',
    color: 'black',
};

const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
};

const colorBoxStyle = (color: string): React.CSSProperties => ({
    width: '15px',
    height: '15px',
    backgroundColor: color,
    marginRight: '8px',
    border: '1px solid #ccc',
});


const calculateCenter = (locations: HeatmapDataItem[]): [number, number] => {
  if (locations.length === 0) return [77.2092, 28.6141]; // lng, lat format

  const sum = locations.reduce(
    (acc, item) => ({
      lat: acc.lat + parseFloat(item.location.lat.toString()),
      lng: acc.lng + parseFloat(item.location.lng.toString()),
    }),
    { lat: 0, lng: 0 }
  );

  return [sum.lng / locations.length, sum.lat / locations.length];
};

const defaultCenter: [number, number] = [77.2092, 28.6141]; // lng, lat format

const MapLegend = () => (
    <div style={legendStyle}>
        <div style={{fontWeight: 'bold', marginBottom: '5px'}}>Population Density</div>
        <div style={legendItemStyle}>
            <span style={colorBoxStyle('#ef4444')}></span> High Density
        </div>
        <div style={legendItemStyle}>
            <span style={colorBoxStyle('#f59e0b')}></span> Medium Density
        </div>
        <div style={legendItemStyle}>
            <span style={colorBoxStyle('#22c55e')}></span> Normal Density
        </div>
    </div>
);


const MapViewPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [locations, setLocations] = useState<HeatmapDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  const API_ENDPOINT = 'http://localhost:5000/api/heatmap';

  const getAlertColor = (alertLevel: string): string => {
    switch (alertLevel?.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#ef4444'; // red-500
      case 'warning':
      case 'medium':
        return '#f59e0b'; // amber-500
      case 'normal':
      case 'low':
      default:
        return '#22c55e'; // green-500
    }
  };

  const fetchFromAPI = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const apiResponse = await response.json();
      const heatmapDataArray: HeatmapDataItem[] = apiResponse.heatmap || [];

      if (heatmapDataArray.length === 0) throw new Error("No heatmap data received from API");

      await storeInFirestore(heatmapDataArray, apiResponse.timestamp);
      await processMapData(heatmapDataArray);
    } catch (err: any) {
      console.error("Error fetching from API: ", err);
      setError(`Failed to fetch data from API: ${err.message}`);
      await loadFromFirestore(); // Try fallback
    } finally {
      setLoading(false);
    }
  };

  const storeInFirestore = async (heatmapData: HeatmapDataItem[], timestamp: string): Promise<void> => {
    try {
      const promises = heatmapData.map(async (item, index) => {
        const docRef = doc(db, 'heatmap_data', `location_${item.area || index}`);
        await setDoc(docRef, { ...item, apiTimestamp: timestamp, firestoreTimestamp: serverTimestamp() });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("Error storing data in Firestore: ", err);
    }
  };

  const processMapData = async (data: HeatmapDataItem[]): Promise<void> => {
    setLocations(data);
    if (map.current && data.length > 0) {
      // Clear existing markers by removing their DOM elements
      const existingMarkers = document.querySelectorAll('.custom-marker');
      existingMarkers.forEach(marker => marker.remove());

      // Add new markers
      data.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.backgroundColor = getAlertColor(item.alert_level);
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
        
        const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(
          `<h3>${item.name}</h3><p>Area: ${item.area}</p><p>Density: ${item.intensity}%</p><p>Count: ${item.count}</p><p>Alert: ${item.alert_level}</p>`
        );

        new maptilersdk.Marker({ element: el })
          .setLngLat([parseFloat(item.location.lng.toString()), parseFloat(item.location.lat.toString())])
          .setPopup(popup)
          .addTo(map.current!);
      });

      const center = calculateCenter(data);
      map.current.flyTo({ center: center, zoom: 15 });
    }
  };

  const loadFromFirestore = async (): Promise<void> => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'heatmap_data'));
      const firestoreData: HeatmapDataItem[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeatmapDataItem));
      if (firestoreData.length > 0) {
        await processMapData(firestoreData);
      } else {
        setError("No data in Firestore, and API fetch failed.");
      }
    } catch (err) {
      console.error("Error loading from Firestore: ", err);
      setError("Failed to load data from Firestore.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_MAPTILER_API_KEY_HERE') {
      setError("MapTiler API key is missing or is a placeholder. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env file.");
      return;
    }
    if (map.current || !mapContainer.current) return;

    maptilersdk.config.apiKey = apiKey;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: defaultCenter,
      zoom: 14,
    });
    
    map.current.on('load', () => {
        fetchFromAPI();
        const interval = setInterval(fetchFromAPI, 15000); // Refresh every 15 seconds
        
        // Return cleanup function for interval
        return () => clearInterval(interval);
    });

    // Return cleanup function for map instance
    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [apiKey]);
  
  if (error && locations.length === 0) {
    return (
      <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
        <div className="text-destructive mb-2">⚠️</div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchFromAPI} className="mt-2" variant="outline" disabled={loading}>
          {loading ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div ref={mapContainer} className="absolute w-full h-full" />
      {loading && (
        <div style={statusStyle}>
          Fetching heatmap data...
        </div>
      )}
      <MapLegend />
    </div>
  );
};

export default MapViewPage;
