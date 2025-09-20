import { Camera, Route, BarChart3, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Camera,
    title: "1. Snap & Report",
    description: "Quickly capture the issue with a photo and add a brief description. Your location is automatically tagged.",
    color: "text-primary"
  },
  {
    icon: Route,
    title: "2. We Route & Assign",
    description: "Our system automatically sends your report to the correct municipal department for action.",
    color: "text-primary"
  },
  {
    icon: BarChart3,
    title: "3. Track Progress",
    description: "Receive real-time notifications and track the status of your report from submission to completion.",
    color: "text-primary"
  },
  {
    icon: CheckCircle2,
    title: "4. Issue Resolved",
    description: "Get a final notification once the work is done. Your contribution has made a difference!",
    color: "text-accent"
  }
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            A Simple, Transparent Process
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From reporting to resolution, stay informed every step of the way.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="text-center gradient-card border-0 shadow-lg hover:shadow-xl transition-smooth transform hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.color === 'text-primary' ? 'bg-primary-soft' : 'bg-accent-soft'} mb-6`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process flow visualization */}
        <div className="hidden lg:flex items-center justify-center mt-12 space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold animate-pulse">
                {i}
              </div>
              {i < 3 && (
                <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent mx-4 rounded-full"></div>
              )}
            </div>
          ))}
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold animate-pulse">
            4
          </div>
        </div>
      </div>
    </section>
  );
};