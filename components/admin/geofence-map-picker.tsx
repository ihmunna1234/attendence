'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  ZoomIn,
  ZoomOut,
  Layers,
  CheckCircle2,
  Sliders,
  Maximize2,
  Loader2,
} from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker, Circle as LeafletCircle } from 'leaflet';

interface GeofenceMapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onChange: (coords: { lat: number; lng: number; radius: number }) => void;
  projectName?: string;
}

export function GeofenceMapPicker({
  latitude,
  longitude,
  radiusMeters,
  onChange,
  projectName,
}: GeofenceMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const circleRef = useRef<LeafletCircle | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets');
  const tileLayerRef = useRef<any>(null);

  // Initialize Leaflet Map on Client Mount
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Safe valid initial coordinates (fallback to Riyadh if invalid)
      const validLat = isNaN(latitude) || latitude === 0 ? 24.713552 : latitude;
      const validLng = isNaN(longitude) || longitude === 0 ? 46.675296 : longitude;
      const validRadius = isNaN(radiusMeters) || radiusMeters < 50 ? 200 : radiusMeters;

      // Custom high-contrast SVG marker icon
      const pinSvg = `
        <div style="position: relative; width: 40px; height: 40px; transform: translate(-20px, -36px); cursor: grab;">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
          ">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          </div>
          <div style="
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 8px;
            height: 8px;
            background: #2563eb;
            border-radius: 50%;
            box-shadow: 0 0 8px #2563eb;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: pinSvg,
        iconSize: [40, 40],
        iconAnchor: [20, 36],
      });

      // Create Map
      const map = L.map(mapContainerRef.current, {
        center: [validLat, validLng],
        zoom: 16,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      // Streets Tile Layer (OpenStreetMap)
      const streetTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      });
      streetTile.addTo(map);
      tileLayerRef.current = streetTile;

      // Draggable Marker
      const marker = L.marker([validLat, validLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Geofence Circle
      const circle = L.circle([validLat, validLng], {
        radius: validRadius,
        color: '#10b981', // Emerald boundary
        weight: 2,
        opacity: 0.9,
        dashArray: '4, 6',
        fillColor: '#10b981',
        fillOpacity: 0.18,
      }).addTo(map);
      circleRef.current = circle;

      // Click on Map to Move Centroid
      map.on('click', (e) => {
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        onChange({ lat: newLat, lng: newLng, radius: validRadius });
      });

      // Drag Marker to Fine-tune
      marker.on('drag', () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const newLat = parseFloat(pos.lat.toFixed(6));
        const newLng = parseFloat(pos.lng.toFixed(6));
        onChange({ lat: newLat, lng: newLng, radius: validRadius });
      });

      setIsMapReady(true);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker & circle when latitude / longitude props change from outside
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const curPos = markerRef.current.getLatLng();
    if (Math.abs(curPos.lat - latitude) > 0.00001 || Math.abs(curPos.lng - longitude) > 0.00001) {
      markerRef.current.setLatLng([latitude, longitude]);
      circleRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
    }
  }, [latitude, longitude, isMapReady]);

  // Update circle radius when prop changes
  useEffect(() => {
    if (!circleRef.current || isNaN(radiusMeters)) return;
    circleRef.current.setRadius(radiusMeters);
  }, [radiusMeters]);

  // Handle Layer Toggle (Streets vs Satellite)
  const toggleMapLayer = async () => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const L = (await import('leaflet')).default;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (mapLayer === 'streets') {
      // Switch to Esri World Imagery (High-res Satellite)
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }
      );
      satLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = satLayer;
      setMapLayer('satellite');
    } else {
      // Switch back to OSM Streets
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      });
      streetLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = streetLayer;
      setMapLayer('streets');
    }
  };

  // Center on User's Current GPS Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your device.');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));

        if (markerRef.current && circleRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          circleRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.flyTo([newLat, newLng], 17, { duration: 1.2 });
        }

        onChange({ lat: newLat, lng: newLng, radius: radiusMeters });
        setIsLocating(false);
      },
      (err) => {
        setLocateError(err.message || 'Unable to access your GPS position.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search Address or Landmark via Nominatim OpenStreetMap
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
      if (data.length === 0) {
        setLocateError('No locations found matching your search.');
      }
    } catch {
      setLocateError('Network error while searching location.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { lat: string; lon: string; display_name: string }) => {
    const newLat = parseFloat(parseFloat(result.lat).toFixed(6));
    const newLng = parseFloat(parseFloat(result.lon).toFixed(6));

    if (markerRef.current && circleRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      circleRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.flyTo([newLat, newLng], 16, { duration: 1.2 });
    }

    onChange({ lat: newLat, lng: newLng, radius: radiusMeters });
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',')[0]);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="space-y-3">
      {/* Map Control Bar: Search, Locate Me, Layer Toggle */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            placeholder="Search city, district, or landmark (e.g. Riyadh King Fahd, Dubai Marina)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-16 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Center on my current GPS location"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span className="hidden sm:inline">My GPS</span>
          </button>

          <button
            type="button"
            onClick={toggleMapLayer}
            title="Toggle between Satellite and Street View"
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-xs ${
              mapLayer === 'satellite'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapLayer === 'satellite' ? 'Satellite' : 'Street'}</span>
          </button>
        </div>
      </div>

      {/* Search Autocomplete Dropdown */}
      {searchResults.length > 0 && (
        <div className="rounded-xl bg-white border border-slate-200 shadow-lg p-1.5 space-y-1 max-h-48 overflow-y-auto z-20">
          {searchResults.map((res, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSearchResult(res)}
              className="w-full p-2 rounded-lg text-left text-xs hover:bg-blue-50 hover:text-blue-700 transition flex items-start gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span className="truncate text-slate-800 hover:text-blue-700 font-medium">
                {res.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {locateError && (
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
          {locateError}
        </div>
      )}

      {/* Interactive Map Container */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Map Overlays: Zoom Controls */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200 text-slate-700 hover:bg-white flex items-center justify-center transition font-bold"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200 text-slate-700 hover:bg-white flex items-center justify-center transition font-bold"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Map Centered Guidance Pill */}
        <div className="absolute left-3 top-3 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-800">
              Click map or drag pin to position site
            </span>
          </div>
        </div>

        {/* Bottom Floating Stats Pill */}
        <div className="absolute left-3 bottom-3 right-3 z-10 pointer-events-none">
          <div className="p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Site Centroid Coordinates
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Geofence Radius
                </span>
                <span className="font-mono font-black text-emerald-600">
                  {radiusMeters} meters
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Perimeter Radius Slider & Presets */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Geofence Boundary Radius</span>
          </label>
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {radiusMeters} m
          </span>
        </div>

        <input
          type="range"
          min={50}
          max={2000}
          step={25}
          value={radiusMeters}
          onChange={(e) => {
            const rad = parseInt(e.target.value, 10);
            onChange({ lat: latitude, lng: longitude, radius: rad });
          }}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
          <span className="text-[10px] text-slate-500 font-bold">Quick Radius Presets:</span>
          <div className="flex items-center gap-1">
            {[100, 200, 300, 500, 1000].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ lat: latitude, lng: longitude, radius: r })}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition border ${
                  radiusMeters === r
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
