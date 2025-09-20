
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.gridlayer.googlemutant";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Issue = Database['public']['Tables']['issues']['Row'];

// Fix for default icon issue with webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Function to create custom marker icons
const getMarkerIcon = (category: string) => {
  const getColor = () => {
    const lowerCategory = (category || "").toLowerCase();
    if (lowerCategory.includes("pothole")) {
      return "hsl(var(--dept-public-works))"; // Blue
    } else if (lowerCategory.includes("streetlight")) {
      return "hsl(var(--dept-utilities))"; // Violet
    } else if (lowerCategory.includes("waste")) {
      return "hsl(var(--dept-sanitation))"; // Orange
    } else if (lowerCategory.includes("park")) {
      return "hsl(var(--dept-parks))"; // Green
    } else {
      return "hsl(var(--muted-foreground))"; // Gray
    }
  };

  const color = getColor();

  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
        <circle cx="12" cy="9.5" r="1.5" fill="white" />
      </svg>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to change map view
const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};


export const LiveMap = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setLocationLoading(false);
        },
        () => {
          // On error or permission denied, use default location
          setLocationLoading(false);
        }
      );
    } else {
      // Geolocation not supported
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("issues").select("*");
        if (error) {
          throw error;
        }
        setIssues(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  useEffect(() => {
    if (category === "All") {
      setFilteredIssues(issues);
    } else {
      setFilteredIssues(issues.filter(issue => (issue.category || "").toLowerCase().includes(category.toLowerCase())));
    }
  }, [category, issues]);

  const googleApiLoaded = !!window.google;

  const getDepartmentButtonColor = (category: string) => {
    switch (category) {
      case "Pothole":
        return "bg-department-public-works";
      case "Streetlight":
        return "bg-department-utilities";
      case "Waste":
        return "bg-department-sanitation";
      case "Park":
        return "bg-department-parks";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <section id="live-map" className="py-20 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Live City-Wide Issue Map
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See real-time reports from across your community. Filter by category to see what matters to you.
          </p>
        </div>

        {/* Map Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button variant={category === 'All' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setCategory("All")}>
            <Filter className="w-4 h-4" />
            All Categories
          </Button>
          <Button variant={category === 'Pothole' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setCategory("Pothole")}>
            <div className={`w-3 h-3 ${getDepartmentButtonColor("Pothole")} rounded-full`}></div>
            Potholes
          </Button>
          <Button variant={category === 'Streetlight' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setCategory("Streetlight")}>
            <div className={`w-3 h-3 ${getDepartmentButtonColor("Streetlight")} rounded-full`}></div>
            Streetlights
          </Button>
          <Button variant={category === 'Waste' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setCategory("Waste")}>
            <div className={`w-3 h-3 ${getDepartmentButtonColor("Waste")} rounded-full`}></div>
            Waste Management
          </Button>
          <Button variant={category === 'Park' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setCategory("Park")}>
            <div className={`w-3 h-3 ${getDepartmentButtonColor("Park")} rounded-full`}></div>
            Parks & Recreation
          </Button>
        </div>

        {/* Map Container */}
        <Card className="overflow-hidden shadow-xl border-4 border-white/50 animate-fade-in">
          <div className="relative z-0 h-96 md:h-[500px] lg:h-[600px]">
          {loading || locationLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading map data...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p>Error loading map data: {error}</p>
              </div>
            ) : googleApiLoaded ? (
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
              <ChangeView center={mapCenter} zoom={13} />
              <TileLayer
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              />
              {filteredIssues.map(issue => (
                <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={getMarkerIcon(issue.category || '')}>
                  <Popup>
                    <b>{issue.category}</b><br />
                    {issue.description}<br />
                    Status: {issue.status}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Loading map...</p>
              </div>
            )}
          </div>
        </Card>

        {/* Map Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="text-center p-6 shadow-md hover:shadow-lg transition-smooth">
            <div className="text-2xl font-bold text-primary mb-2">{filteredIssues.filter(r => r.status === 'new').length}</div>
            <div className="text-sm text-muted-foreground">Active Reports</div>
          </Card>
          <Card className="text-center p-6 shadow-md hover:shadow-lg transition-smooth">
            <div className="text-2xl font-bold text-accent mb-2">{filteredIssues.filter(r => r.status === 'resolved').length}</div>
            <div className="text-sm text-muted-foreground">Resolved Issues</div>
          </Card>
          <Card className="text-center p-6 shadow-md hover:shadow-lg transition-smooth">
            <div className="text-2xl font-bold text-warning mb-2">{filteredIssues.filter(r => r.status === 'in_progress').length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </Card>
          <Card className="text-center p-6 shadow-md hover:shadow-lg transition-smooth">
            <div className="text-2xl font-bold text-success mb-2">4.2</div>
            <div className="text-sm text-muted-foreground">Avg Response Days</div>
          </Card>
        </div>
      </div>
    </section>
  );
};
