import { Smartphone, BellRing, Map, LayoutDashboard, Cog, PieChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const citizenFeatures = [
  {
    icon: Smartphone,
    title: "Effortless Mobile Reporting",
    description: "A clean, simple interface lets you submit issues in under a minute from any device.",
    color: "bg-accent-soft text-accent"
  },
  {
    icon: BellRing,
    title: "Real-Time Notifications",
    description: "Stay in the loop with automatic updates as your report is acknowledged, worked on, and resolved.",
    color: "bg-accent-soft text-accent"
  },
  {
    icon: Map,
    title: "Interactive Community Map",
    description: "View issues reported by your neighbors, helping to highlight priority areas for the city.",
    color: "bg-accent-soft text-accent"
  }
];

const municipalFeatures = [
  {
    icon: LayoutDashboard,
    title: "Centralized Admin Dashboard",
    description: "Manage all incoming reports from a single, powerful web portal. View, filter, and prioritize with ease.",
    color: "bg-primary-soft text-primary"
  },
  {
    icon: Cog,
    title: "Automated Workflow Engine",
    description: "Reports are automatically routed to the correct department based on issue type and location, saving valuable time.",
    color: "bg-primary-soft text-primary"
  },
  {
    icon: PieChart,
    title: "Actionable Data & Analytics",
    description: "Gain insights into reporting trends, departmental response times, and issue hotspots to improve city services.",
    color: "bg-primary-soft text-primary"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            A Platform for Everyone
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful tools for citizens and city administrators alike.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* For Citizens */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-foreground">
                For Citizens
              </h3>
              <div className="w-20 h-1 gradient-accent rounded-full mx-auto lg:mx-0 mb-8"></div>
            </div>
            
            <div className="space-y-6">
              {citizenFeatures.map((feature, index) => (
                <Card 
                  key={index}
                  className="border-0 shadow-md hover:shadow-lg transition-smooth transform hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`${feature.color} rounded-lg p-3 mt-1 flex-shrink-0`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2 text-foreground">
                          {feature.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* For Municipalities */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-foreground">
                For Municipalities
              </h3>
              <div className="w-20 h-1 gradient-primary rounded-full mx-auto lg:mx-0 mb-8"></div>
            </div>
            
            <div className="space-y-6">
              {municipalFeatures.map((feature, index) => (
                <Card 
                  key={index}
                  className="border-0 shadow-md hover:shadow-lg transition-smooth transform hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${(index + 3) * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`${feature.color} rounded-lg p-3 mt-1 flex-shrink-0`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2 text-foreground">
                          {feature.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};