import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportModal } from "./ReportModal";
import heroImage from "@/assets/hero-cityscape.jpg";
import { Link } from "react-router-dom";
import { Camera, ArrowRight, MapPin } from "lucide-react";

export const Hero = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <>
      <section 
        className="relative text-white pt-32 pb-20 min-h-screen flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            Improve Your Community,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              One Report at a Time
            </span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-4xl mx-auto mb-8 animate-slide-up">
            See a pothole, a broken streetlight, or an overflowing bin? Report it in seconds with CiviLink and help make your city a better place.
          </p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <Button
              onClick={() => setIsReportModalOpen(true)}
              size="lg"
              className="font-bold px-6 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Camera className="mr-3 h-6 w-6" />
              Report an Issue
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Link to="/view-reports">
              <Button
                size="lg"
                variant="outline"
                className="font-bold px-6 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg text-white border-white/50 bg-white/10 hover:bg-white/20 hover:border-white backdrop-blur-sm"
              >
                <MapPin className="mr-3 h-6 w-6" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </>
  );
};
