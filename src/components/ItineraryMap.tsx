import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapItem {
  lat: number;
  lng: number;
  activity: string;
  time: string;
}

function RecenterMap({ items }: { items: MapItem[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (items.length > 0) {
      const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, items]);
  
  return null;
}

// Custom DivIcon for numbered markers
const createNumberedIcon = (number: number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-6 h-6 rounded-full bg-[#D4AF37] border-2 border-slate-900 shadow-[0_0_10px_rgba(212,175,55,0.5)] flex items-center justify-center text-[10px] font-black text-slate-900">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function ItineraryMap({ items }: { items: MapItem[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-[300px] w-full bg-slate-900/50 animate-pulse rounded-2xl" />;

  const path = items.map(item => [item.lat, item.lng] as [number, number]);

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-slate-900">
      <MapContainer 
        center={[items[0]?.lat || 0, items[0]?.lng || 0]} 
        zoom={13} 
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: '300px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <RecenterMap items={items} />
        
        {items.length > 1 && (
          <Polyline 
            positions={path} 
            color="#D4AF37" 
            weight={3} 
            opacity={0.6}
            dashArray="10, 10"
          />
        )}

        {items.map((item, idx) => (
          <Marker 
            key={`${item.lat}-${item.lng}-${idx}`} 
            position={[item.lat, item.lng]}
            icon={createNumberedIcon(idx + 1)}
          >
            <Popup className="luxury-popup">
              <div className="p-1">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">{item.time}</p>
                <p className="text-xs font-serif italic text-slate-900 font-bold">{item.activity}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style>{`
        .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
        .luxury-popup .leaflet-popup-content {
          margin: 12px 16px !important;
        }
      `}</style>
    </div>
  );
}
