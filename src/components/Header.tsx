import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X } from "lucide-react";
import { ReportModal } from "./ReportModal";
import { useNavigate, useLocation, Link } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const handleAdminAccess = () => {
    navigate("/admin-login");
  };

  const handleViewReports = () => {
    setIsMenuOpen(false);
    navigate("/view-reports");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-surface shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            <img src="public/logo.png" width="32" ></img>
              CiviLink
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                How It Works
              </button>
              <button
                onClick={handleViewReports}
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                View Reports
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("live-map")}
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                Live Map
              </button>
              <button
                onClick={handleAdminAccess}
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                Admin Login
              </button>
            </nav>

            <Button
              onClick={() => setIsReportModalOpen(true)}
              className="hidden md:inline-flex gradient-primary hover:shadow-glow transition-smooth transform hover:scale-105"
              size="lg"
            >
              Report an Issue
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 space-y-4 animate-slide-up">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-smooth"
              >
                How It Works
              </button>
              <button
                onClick={handleViewReports}
                className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-smooth"
              >
                View Reports
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-smooth"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("live-map")}
                className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-smooth"
              >
                Live Map
              </button>
              <button
                onClick={handleAdminAccess}
                className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-smooth"
              >
                Admin Login
              </button>
              <Button
                onClick={() => setIsReportModalOpen(true)}
                className="w-full mt-4 gradient-primary hover:shadow-glow transition-smooth"
                size="lg"
              >
                Report an Issue
              </Button>
            </div>
          )}
        </div>
      </header>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </>
  );
};