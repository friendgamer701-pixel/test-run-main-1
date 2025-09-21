import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Upload, X, ClipboardList, LayoutGrid, MessageSquare, Map, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const issueCategories = [
  "Pothole",
  "Broken Streetlight",
  "Overflowing Trash Bin",
  "Graffiti",
  "Damaged Public Property",
  "Water Leak",
  "Sidewalk Damage",
  "Traffic Signal Issue",
  "Other"
];

export const ReportModal = ({ isOpen, onClose }: ReportModalProps) => {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !location) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const locationName = data.locality || data.city || data.countryName || "Unknown location";
            setLocation({ lat: latitude, lng: longitude, name: locationName });
          } catch (error) {
            setLocation({ lat: latitude, lng: longitude, name: "Current location" });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Access Required",
            description: "Please enable location services to report an issue.",
            variant: "destructive",
          });
          setLocation({ lat: 0, lng: 0, name: "Location unavailable" });
        }
      );
    }
  }, [isOpen, location, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || location.name === "Location unavailable") {
      toast({
        title: "Location Required",
        description: "Please enable location access and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!photo) {
      toast({
        title: "Photo Required",
        description: "Please upload a photo of the issue.",
        variant: "destructive",
      });
      return;
    }

    if (!title || !category || !description || !streetAddress || !landmark) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('issues').upload(fileName, photo);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('issues').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase.from('issues').insert({
        title,
        category,
        description,
        latitude: location.lat,
        longitude: location.lng,
        location_name: location.name,
        image_url: imageUrl,
        status: 'new',
        street_address: streetAddress,
        landmark,
      });

      if (insertError) throw insertError;

      toast({ title: "Report Submitted!", description: "Thank you for helping improve our community." });
      setTitle("");
      setCategory("");
      setDescription("");
      setStreetAddress("");
      setLandmark("");
      setPhoto(null);
      setLocation(null);
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({ title: "Submission Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto z-50 p-8">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold">Report a New Issue</DialogTitle>
          <DialogDescription className="text-md text-muted-foreground">
            Help us improve your community by reporting local issues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <div className="relative">
                <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Large pothole on Elm St" className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Issue Category *</Label>
              <div className="relative">
                <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {issueCategories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." className="pl-10 pt-2" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Upload a Photo *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input type="file" id="photo" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <label htmlFor="photo" className="cursor-pointer w-full flex flex-col items-center">
                {photo ? (
                  <div className="text-center space-y-2">
                    <img src={URL.createObjectURL(photo)} alt="Preview" className="max-h-32 rounded-lg mx-auto" />
                    <p className="text-sm text-muted-foreground truncate max-w-xs">{photo.name}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setPhoto(null)}><X className="w-4 h-4 mr-2" />Remove</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="font-semibold">Click or drag to upload</p>
                    <p className="text-xs text-muted-foreground">PNG or JPG (max 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address *</Label>
              <div className="relative">
                <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="streetAddress" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="e.g., 123 Main St" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark *</Label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g., Near the old oak tree" className="pl-10" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{location ? location.name : "Detecting location..."}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 gradient-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
