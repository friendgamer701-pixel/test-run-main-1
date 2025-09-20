import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Upload, X } from "lucide-react";
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

  // Get user's current location
  useEffect(() => {
    if (isOpen && !location) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get location name from reverse geocoding (basic approach)
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const locationName = data.locality || data.city || data.countryName || "Unknown location";
            
            setLocation({
              lat: latitude,
              lng: longitude,
              name: locationName
            });
          } catch (error) {
            setLocation({
              lat: latitude,
              lng: longitude,
              name: "Current location"
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default location if geolocation fails
          setLocation({
            lat: 0,
            lng: 0,
            name: "Location unavailable"
          });
        }
      );
    }
  }, [isOpen, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !description || !title || !location || !photo) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including uploading a photo.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('issues')
          .upload(fileName, photo);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('issues')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      // Insert the issue data
      const { error: insertError } = await supabase
        .from('issues')
        .insert({
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

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Report Submitted Successfully!",
        description: "Your issue has been reported and will be reviewed shortly.",
      });
      
      // Reset form
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
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Report a New Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for the issue..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Issue Category *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {issueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief description of the issue..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-sm font-medium">
              Upload a Photo *
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label htmlFor="photo" className="cursor-pointer">
                {photo ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Selected: {photo.name}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPhoto(null)}
                      className="mt-2"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <div className="text-sm text-muted-foreground">
                      Click to upload a photo
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <Input
                id="location"
                value={location ? location.name : "Detecting location..."}
                disabled
                className="border-0 bg-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your current location will be automatically included with the report.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streetAddress" className="text-sm font-medium">
              Street Address
            </Label>
            <Input
              id="streetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="e.g., 123 Main St"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark" className="text-sm font-medium">
              Landmark
            </Label>
            <Input
              id="landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g., Near the park"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
