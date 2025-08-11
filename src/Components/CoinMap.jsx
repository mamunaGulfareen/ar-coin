import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { showWarningAlert } from '../utils/alert';
import { haversineDistance } from '../utils/utils';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const COINS = [
  { id: 1, lat: 31.5204, lng: 74.3587 },
  { id: 2, lat: 33.6844, lng: 73.0479 },
  { id: 3, lat: 31.660101, lng: 73.935246 },
  { id: 4, lat: 31.420211, lng: 74.24318 },
  { id: 5, lat: 31.660054, lng: 73.935277 },
  { id: 6, lat: 31.5654144, lng: 74.3571456 },
  { id: 7, lat: 31.559992487574895, lng: 74.39599295296996 },
  { id: 8, lat: 30.9723136, lng: 73.9704832 },
  { id: 9, lat: 31.5293696, lng: 74.3243776 },
  { id: 10, lat: 50.8503, lng: 4.3517 }

];

export default function CoinMap({ onEnterAR }) {
  const [userLocation, setUserLocation] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null); // store user marker reference

  // Initialize map & markers (runs only once)
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [74.3587, 31.5204], // default center until userLocation is ready
      zoom: 15,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Create user marker (will move later)
    userMarker.current = new mapboxgl.Marker({ color: 'blue' })
      .setLngLat([74.3587, 31.5204]) // temp
      .addTo(map.current);

    // Add coin markers
    COINS.forEach((coin) => {
      const marker = new mapboxgl.Marker()
        .setLngLat([coin.lng, coin.lat])
        .addTo(map.current);

      const el = marker.getElement();
      el.style.fontSize = '24px';
      el.style.cursor = 'pointer';
      el.innerHTML = '🪙';

      el.addEventListener('click', () => {
        if (!userLocation) return;
        const dist = haversineDistance(userLocation, {
          latitude: coin.lat,
          longitude: coin.lng,
        });
        if (dist < 500) {
          onEnterAR(coin);
        } else {
          showWarningAlert('📍You are too far from the coin.', 'Got it');
        }
      });
    });

    return () => map.current?.remove();
  }, []);

  // Watch & update user location dynamically
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(newLocation);

        // Move user marker if exists
        if (userMarker.current) {
          userMarker.current.setLngLat([newLocation.longitude, newLocation.latitude]);
        }

        // Optionally keep map centered on user
        if (map.current) {
          map.current.setCenter([newLocation.longitude, newLocation.latitude]);
        }
      },
      (err) => console.error('Location error:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Enter AR button handler
  const handleARClick = () => {
    if (!userLocation) {
      showWarningAlert('📍 Location not available.', 'OK');
      return;
    }

    const nearCoin = COINS.find((coin) => {
      const dist = haversineDistance(userLocation, {
        latitude: coin.lat,
        longitude: coin.lng,
      });
      return dist < 500;
    });

    if (nearCoin) {
      onEnterAR(nearCoin);
    } else {
      showWarningAlert('📍You are too far from any coin.', 'Got it');
    }
  };

  return (
    <div className="relative h-screen">
      <div ref={mapContainer} className="h-full" />
      <button
        onClick={handleARClick}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-5 py-3 bg-blue-600 text-white rounded-lg font-bold z-10 shadow-md text-xl"
      >
        🎯 Enter AR View
      </button>
    </div>
  );
}

