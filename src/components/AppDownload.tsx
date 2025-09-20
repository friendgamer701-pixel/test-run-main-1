import { Button } from "@/components/ui/button";
import { Smartphone, Download, Apple, Play } from "lucide-react";

export const AppDownload = () => {
  return (
    <section className="gradient-primary text-white py-20">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 rounded-full p-4">
              <Smartphone className="w-12 h-12" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Take CiviLink With You
          </h2>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Download the mobile app for the easiest way to report issues on the go. Available for iOS and Android devices.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20 transition-smooth transform hover:scale-105 flex items-center gap-3 px-8 py-4"
            >
              <Apple className="w-6 h-6" />
              <div className="text-left">
                <div className="text-xs opacity-75">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20 transition-smooth transform hover:scale-105 flex items-center gap-3 px-8 py-4"
            >
              <Play className="w-6 h-6" />
              <div className="text-left">
                <div className="text-xs opacity-75">Get it on</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
            <div className="space-y-3">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg">Quick Reports</h3>
              <p className="text-blue-100 text-sm">Submit issues in seconds with photo upload and auto-location</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <div className="w-8 h-8 flex items-center justify-center">
                  📱
                </div>
              </div>
              <h3 className="font-semibold text-lg">Offline Capable</h3>
              <p className="text-blue-100 text-sm">Save reports when offline and sync when connected</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <div className="w-8 h-8 flex items-center justify-center">
                  🔔
                </div>
              </div>
              <h3 className="font-semibold text-lg">Push Notifications</h3>
              <p className="text-blue-100 text-sm">Get real-time updates on your report status</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};