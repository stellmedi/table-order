import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trash2, MapPin } from 'lucide-react';
import type { DeliveryZone } from '@/types/database';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ZONE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface DeliveryZoneMapProps {
  zones: DeliveryZone[];
  onZonesChange: (zones: DeliveryZone[]) => void;
}

// Extend Leaflet types for draw plugin
declare module 'leaflet' {
  namespace Control {
    class Draw extends L.Control {
      constructor(options?: any);
    }
  }
  namespace Draw {
    namespace Event {
      const CREATED: string;
      const DELETED: string;
    }
  }
}

export function DeliveryZoneMap({ zones, onZonesChange }: DeliveryZoneMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006]); // Default NYC
  const zonesRef = useRef(zones);

  // Keep ref updated
  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Keep default if geolocation fails
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(mapCenter, 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialize feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: ZONE_COLORS[0],
            fillOpacity: 0.3,
          },
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Helper to calculate polygon centroid
    const getPolygonCentroid = (polygon: [number, number][]) => {
      const n = polygon.length;
      let cx = 0, cy = 0;
      polygon.forEach(([lng, lat]) => {
        cx += lng;
        cy += lat;
      });
      return [cx / n, cy / n];
    };

    // Reverse geocode to get pin code
    const fetchPinCode = async (lat: number, lng: number): Promise<string | null> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
          { headers: { 'User-Agent': 'RestaurantWidget/1.0' } }
        );
        const data = await response.json();
        return data.address?.postcode || null;
      } catch {
        return null;
      }
    };

    // Handle new polygon creation
    map.on(L.Draw.Event.CREATED, async (e: any) => {
      const layer = e.layer;
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const polygon = latlngs.map((ll: L.LatLng) => [ll.lng, ll.lat] as [number, number]);
      
      // Calculate centroid and fetch pin code
      const [lng, lat] = getPolygonCentroid(polygon);
      const pinCode = await fetchPinCode(lat, lng);
      
      const currentZones = zonesRef.current;
      const newZone: DeliveryZone = {
        name: `Zone ${currentZones.length + 1}`,
        fee: 0,
        min_order: 0,
        polygon,
        pin_codes: pinCode ? [pinCode] : [],
      };
      
      layer.options.color = ZONE_COLORS[currentZones.length % ZONE_COLORS.length];
      layer.options.fillOpacity = 0.3;
      drawnItems.addLayer(layer);
      
      onZonesChange([...currentZones, newZone]);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapCenter, onZonesChange]);

  // Draw existing zones on map
  useEffect(() => {
    if (!drawnItemsRef.current || !mapInstanceRef.current) return;
    
    drawnItemsRef.current.clearLayers();
    
    zones.forEach((zone, index) => {
      if (zone.polygon && zone.polygon.length > 0) {
        const latLngs = zone.polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
        const polygon = L.polygon(latLngs, {
          color: ZONE_COLORS[index % ZONE_COLORS.length],
          fillOpacity: selectedZoneIndex === index ? 0.5 : 0.3,
          weight: selectedZoneIndex === index ? 3 : 2,
        });
        
        polygon.bindPopup(`<strong>${zone.name}</strong><br/>Fee: $${zone.fee}<br/>Min Order: $${zone.min_order}`);
        polygon.on('click', () => setSelectedZoneIndex(index));
        
        drawnItemsRef.current?.addLayer(polygon);
      }
    });
  }, [zones, selectedZoneIndex]);

  const updateZone = (index: number, field: keyof DeliveryZone, value: string | number | string[]) => {
    const updated = [...zones];
    updated[index] = { ...updated[index], [field]: value };
    onZonesChange(updated);
  };

  const removeZone = (index: number) => {
    const updated = zones.filter((_, i) => i !== index);
    onZonesChange(updated);
    setSelectedZoneIndex(null);
  };

  const centerOnZone = (index: number) => {
    const zone = zones[index];
    if (zone.polygon && zone.polygon.length > 0 && mapInstanceRef.current) {
      const latLngs = zone.polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      setSelectedZoneIndex(index);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        ref={mapRef} 
        className="h-[400px] w-full rounded-lg border border-border overflow-hidden"
      />
      
      <p className="text-sm text-muted-foreground">
        Use the polygon tool (top-right of map) to draw delivery zones. Click a zone to select it.
      </p>

      {zones.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Delivery Zones</Label>
          {zones.map((zone, index) => (
            <Card 
              key={index} 
              className={`transition-all ${selectedZoneIndex === index ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: ZONE_COLORS[index % ZONE_COLORS.length] }}
                    />
                    <Input
                      value={zone.name}
                      onChange={(e) => updateZone(index, 'name', e.target.value)}
                      className="w-40 h-8"
                      placeholder="Zone name"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => centerOnZone(index)}
                      title="Center on map"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeZone(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Fee $</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={zone.fee}
                      onChange={(e) => updateZone(index, 'fee', parseFloat(e.target.value) || 0)}
                      className="w-24 h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Min Order $</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={zone.min_order}
                      onChange={(e) => updateZone(index, 'min_order', parseFloat(e.target.value) || 0)}
                      className="w-24 h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Pin Codes (comma separated)</Label>
                  <Input
                    type="text"
                    value={(zone.pin_codes || []).join(', ')}
                    onChange={(e) => {
                      const pins = e.target.value.split(',').map(p => p.trim()).filter(Boolean);
                      updateZone(index, 'pin_codes', pins);
                    }}
                    placeholder="e.g., 10001, 10002, 10003"
                    className="h-8 mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
