import { 
  Brain, 
  Calendar, 
  FileText, 
  Video, 
  Mic, 
  Pill,
  TrendingUp,
  Shield
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Prescription Assistant",
    description: "Get intelligent medicine and dosage suggestions based on diagnosis. Reduce errors and save time.",
    color: "from-primary to-primary/50"
  },
  {
    icon: Mic,
    title: "Voice-to-Text Records",
    description: "Speak naturally and watch as AI transcribes and structures patient records automatically.",
    color: "from-secondary to-secondary/50"
  },
  {
    icon: Video,
    title: "Teleconsultation",
    description: "High-quality video consultations with patients. Reach more patients, save travel time.",
    color: "from-accent to-accent/50"
  },
  {
    icon: FileText,
    title: "Digital Prescriptions",
    description: "Generate, store, and share digital prescriptions instantly with patients and pharmacies.",
    color: "from-primary to-secondary"
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automated appointment management with reminders for both doctors and patients.",
    color: "from-secondary to-accent"
  },
  {
    icon: Pill,
    title: "Pharmacy Integration",
    description: "One-click medicine ordering. Prescriptions automatically shared with nearby pharmacies.",
    color: "from-accent to-primary"
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    description: "Track patient trends, revenue, and seasonal disease patterns with AI insights.",
    color: "from-primary to-primary/50"
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "Bank-level encryption. All data is stored securely and complies with healthcare regulations.",
    color: "from-secondary to-secondary/50"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Run
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              a Modern Clinic
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful features designed for Indian healthcare professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
