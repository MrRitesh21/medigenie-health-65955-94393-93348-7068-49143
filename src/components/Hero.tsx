import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Video, Brain, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-medical.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      
      {/* Hero image with overlay */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src={heroImage} 
          alt="Medical AI Technology" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm text-primary font-medium">AI-Powered Healthcare Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Transform Your Clinic
            </span>
            <br />
            <span className="text-foreground">with AI Intelligence</span>
          </h1>

          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete clinic management with AI-powered prescriptions, teleconsultation, 
            and intelligent patient care. Built for the modern Indian healthcare system.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="gap-2 text-lg px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Features
              </Button>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-colors">
              <div className="p-3 rounded-lg bg-primary/10">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Teleconsultation</div>
                <div className="text-sm text-muted-foreground">HD Video Calls</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-secondary/50 transition-colors">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Brain className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">AI Prescriptions</div>
                <div className="text-sm text-muted-foreground">Smart Suggestions</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-accent/50 transition-colors">
              <div className="p-3 rounded-lg bg-accent/10">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Easy Booking</div>
                <div className="text-sm text-muted-foreground">One-Click Appointments</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
