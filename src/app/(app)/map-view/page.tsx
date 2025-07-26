
'use client';
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, HeatmapLayer } from '@react-google-maps/api';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const containerStyle = {
  width: '100%',
  height: '100vh'
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
  fontSize: '12px'
};

// Calculate center point from location coordinates
const calculateCenter = (locations: any[]) => {
  if (locations.length === 0) return { lat: 28.6141, lng: 77.2092 };
  
  const sum = locations.reduce((acc, item) => ({
    lat: acc.lat + parseFloat(item.location.lat),
    lng: acc.lng + parseFloat(item.location.lng)
  }), { lat: 0, lng: 0 });
  
  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length
  };
};

// Default center based on Delhi coordinates
const defaultCenter = {
  lat: 28.6141,
  lng: 77.2092
};

const HeatmapComponent = ({ onDataUpdate, showMarkers = true }: { onDataUpdate?: (data: any) => void, showMarkers?: boolean }) => {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [maxIntensity, setMaxIntensity] = useState(1);
  const [locations, setLocations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // FastAPI endpoint URL
  const API_ENDPOINT = 'http://localhost:5000/api/heatmap';

  // Fetch data from FastAPI
  const fetchFromAPI = async () => {
    setLoading(true);
    try {
      console.log("Fetching heatmap data from API:", API_ENDPOINT);
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiResponse = await response.json();
      console.log("API Response:", apiResponse);
      
      // Extract heatmap data from the response
      const heatmapDataArray = apiResponse.heatmap || [];
      console.log("Extracted heatmap data:", heatmapDataArray);
      
      if (heatmapDataArray.length === 0) {
        throw new Error("No heatmap data received from API");
      }
      
      // Store data in Firestore
      await storeInFirestore(heatmapDataArray, apiResponse.timestamp);
      
      // Process data for heatmap
      await processHeatmapData(heatmapDataArray);
      
      // Notify parent component about data update
      if (onDataUpdate) {
        onDataUpdate({
          locations: heatmapDataArray,
          maxIntensity: Math.max(...heatmapDataArray.map(item => parseFloat(item.intensity || 0)), 1),
          timestamp: apiResponse.timestamp
        });
      }
      
      setError(null);
      console.log("Successfully processed heatmap data");
    } catch (err: any) {
      console.error("Error fetching from API: ", err);
      setError(`Failed to fetch data from API: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Store API data in Firestore
  const storeInFirestore = async (heatmapData: any[], timestamp: string) => {
    try {
      const promises = heatmapData.map(async (item, index) => {
        const docRef = doc(db, 'heatmap_data', `location_${item.area || index}`);
        await setDoc(docRef, {
          ...item,
          apiTimestamp: timestamp,
          firestoreTimestamp: serverTimestamp(),
          lastUpdated: new Date().toISOString()
        });
      });
      
      await Promise.all(promises);
      console.log("Heatmap data stored in Firestore successfully");
    } catch (err) {
      console.error("Error storing data in Firestore: ", err);
      throw err;
    }
  };

  // Process data for heatmap visualization
  const processHeatmapData = async (data: any[]) => {
    try {
      console.log("Processing heatmap data:", data);
      setLocations(data);
      
      // Find the maximum intensity to normalize weights
      const intensities = data.map(item => parseFloat(item.intensity || 0));
      const maxIntensityValue = Math.max(...intensities, 1);
      setMaxIntensity(maxIntensityValue);
      console.log("Max intensity:", maxIntensityValue);
      
      // Create heatmap data points
      const heatmapPoints = data.map((item, index) => {
        const intensity = parseFloat(item.intensity || 0);
        const weight = maxIntensityValue > 0 ? Math.max(0.1, intensity / maxIntensityValue) : 0.1;
        
        console.log(`Location ${index + 1}:`, {
          name: item.name,
          lat: item.location.lat,
          lng: item.location.lng,
          intensity: intensity,
          weight: weight
        });
        
        return {
          location: new google.maps.LatLng(
            parseFloat(item.location.lat), 
            parseFloat(item.location.lng)
          ),
          weight: weight
        };
      });
      
      setHeatmapData(heatmapPoints);
      console.log("Created heatmap points:", heatmapPoints.length);
      
      // Calculate and set map center
      if (data.length > 0) {
        const center = calculateCenter(data);
        setMapCenter(center);
        console.log("Map center set to:", center);
      }
    } catch (err) {
      console.error("Error processing heatmap data: ", err);
      setError("Failed to process heatmap data");
    }
  };

  // Load data from Firestore (fallback)
  const loadFromFirestore = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'heatmap_data'));
      const firestoreData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (firestoreData.length > 0) {
        const hasValidStructure = firestoreData.every(item => 
          item.location && item.location.lat && item.location.lng
        );
        
        if (hasValidStructure) {
          await processHeatmapData(firestoreData);
          console.log("Loaded data from Firestore with valid structure");
        } else {
          console.log("Firestore data has invalid structure, fetching from API...");
          await fetchFromAPI();
        }
      } else {
        console.log("No data in Firestore, fetching from API...");
        await fetchFromAPI();
      }
    } catch (err) {
      console.error("Error loading from Firestore: ", err);
      await fetchFromAPI();
    }
  };

  // Get color for alert level
  const getAlertColor = (alertLevel: string) => {
    switch(alertLevel?.toLowerCase()) {
      case 'high': case 'critical': return '#ff0000';
      case 'warning': case 'medium': return '#ffff00';
      case 'normal': case 'low': default: return '#00ff00';
    }
  };

  // Load initial data - try API first, then Firestore as fallback
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchFromAPI();
      } catch (err) {
        console.log("API fetch failed, trying Firestore fallback...");
        await loadFromFirestore();
      }
    };
    
    initializeData();
  }, []);

  // Expose refresh function to parent
  useEffect(() => {
    if (window) {
      (window as any).refreshHeatmap = fetchFromAPI;
    }
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
        <div className="text-destructive mb-2">⚠️</div>
        <p className="text-sm text-muted-foreground">Google Maps API Key is missing.</p>
         <p className="text-xs text-muted-foreground">Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.</p>
      </div>
    );
  }

  if (error && locations.length === 0) {
    return (
      <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
        <div className="text-destructive mb-2">⚠️</div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button 
          onClick={fetchFromAPI}
          className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Status indicator */}
      {loading && (
        <div style={statusStyle}>
          Fetching heatmap data...
        </div>
      )}

      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={['visualization']}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={16}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_BOTTOM
            }
          }}
        >
          {heatmapData.length > 0 && (
            <HeatmapLayer
              data={heatmapData}
              options={{
                radius: 40,
                opacity: 0.8,
                // Enhanced gradient: Green -> Yellow -> Red based on population intensity
                gradient: [
                  'rgba(0, 255, 0, 0)',      // Transparent green
                  'rgba(0, 255, 0, 0.2)',    // Light green
                  'rgba(0, 255, 0, 0.4)',    // Green
                  'rgba(0, 255, 0, 0.6)',    // Green
                  'rgba(100, 255, 0, 0.6)',  // Green-yellow
                  'rgba(150, 255, 0, 0.7)',  // Yellow-green
                  'rgba(200, 255, 0, 0.7)',  // Yellow-green
                  'rgba(255, 255, 0, 0.8)',  // Yellow
                  'rgba(255, 200, 0, 0.8)',  // Orange-yellow
                  'rgba(255, 150, 0, 0.9)',  // Orange
                  'rgba(255, 100, 0, 0.9)',  // Red-orange
                  'rgba(255, 50, 0, 1)',     // Red-orange
                  'rgba(255, 0, 0, 1)'       // Red
                ]
              }}
            />
          )}

          {/* Camera location markers - only show if enabled */}
          {showMarkers && locations.map((item, index) => (
            <Marker
              key={index}
              position={{ 
                lat: parseFloat(item.location.lat), 
                lng: parseFloat(item.location.lng) 
              }}
              title={`${item.name}\nArea: ${item.area}\nIntensity: ${item.intensity}\nCount: ${item.count}\nAlert Level: ${item.alert_level}`}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="12" fill="${getAlertColor(item.alert_level)}" stroke="white" stroke-width="3"/>
                    <circle cx="14" cy="14" r="7" fill="rgba(0,0,0,0.3)"/>
                    <text x="14" y="18" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${index + 1}</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(28, 28)
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default HeatmapComponent;

    