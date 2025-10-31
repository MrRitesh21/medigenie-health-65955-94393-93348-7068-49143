import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Calendar, FileText, Brain, MessageCircle, TrendingUp, Pill } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData?.role !== 'patient') {
        navigate("/dashboard");
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const quickActions = [
    {
      icon: Calendar,
      label: "Book Now",
      description: "New appointment",
      path: "/book-appointment",
      gradient: "from-primary to-primary/50"
    },
    {
      icon: Brain,
      label: "Symptom Check",
      description: "AI analysis",
      path: "/symptom-checker",
      gradient: "from-secondary to-secondary/50"
    },
    {
      icon: FileText,
      label: "Report Simplifier",
      description: "Explain reports",
      path: "/report-simplifier",
      gradient: "from-accent to-accent/50"
    },
    {
      icon: MessageCircle,
      label: "AI Chatbot",
      description: "Health questions",
      path: "/patient-chatbot",
      gradient: "from-primary to-secondary"
    },
  ];

  const aiFeatures = [
    {
      icon: Brain,
      label: "Symptom Checker",
      description: "AI health analysis",
      path: "/symptom-checker",
    },
    {
      icon: FileText,
      label: "Report Simplifier",
      description: "Explain medical reports",
      path: "/report-simplifier",
    },
    {
      icon: MessageCircle,
      label: "Health Chatbot",
      description: "Ask health questions",
      path: "/patient-chatbot",
    },
    {
      icon: Pill,
      label: "Medicine Reminder",
      description: "Smart medication alerts",
      path: "/medicine-reminder",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card/50 pb-20">
      <MobileHeader title="MediCare AI" profile={profile} />

      <main className="pt-20 px-4 pb-4 space-y-6">
        {/* Welcome Card */}
        <Card className="gradient-primary border-0 shadow-glow">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-1 text-primary-foreground">
              Hello, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-sm text-primary-foreground/80">
              Your health, simplified with AI
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="hover:shadow-lg transition-smooth border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-xl gradient-primary shadow-glow">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-smooth border-secondary/20 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-xl gradient-secondary shadow-glow-secondary">
                  <FileText className="w-5 h-5 text-secondary-foreground" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Prescriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <div className="w-1 h-6 gradient-primary rounded-full"></div>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-xl transition-bounce border-primary/10 bg-card/50 backdrop-blur"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="pt-6 text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${action.gradient} mb-3 shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{action.label}</h4>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Features Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-accent">
              <Brain className="w-5 h-5 text-accent-foreground" />
            </div>
            AI-Powered Features
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {aiFeatures.map((feature, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-xl transition-bounce border-accent/10 bg-card/50 backdrop-blur hover:border-accent/30"
                onClick={() => navigate(feature.path)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 mb-3 border border-accent/20">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-xs mb-1">{feature.label}</h4>
                  <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav role="patient" />
    </div>
  );
}
