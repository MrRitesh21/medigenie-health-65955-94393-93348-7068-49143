import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, FileText, Users, Brain, Video, Pill, TrendingUp, MessageCircle, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch user profile
      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
      
      // Redirect to role-specific dashboard
      if (profileData?.role === 'doctor') {
        navigate('/doctor-dashboard');
        return;
      } else if (profileData?.role === 'pharmacy') {
        navigate('/pharmacy-dashboard');
        return;
      } else if (profileData?.role === 'patient') {
        navigate('/patient-dashboard');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const quickActions = profile?.role === "doctor" ? [
    {
      icon: Calendar,
      label: "Appointments",
      description: "Manage schedule",
      path: "/appointments",
      gradient: "from-primary to-primary/50"
    },
    {
      icon: Pill,
      label: "AI Prescriptions",
      description: "Smart suggestions",
      path: "/prescription-assistant",
      gradient: "from-secondary to-secondary/50"
    },
    {
      icon: Mic,
      label: "Voice Notes",
      description: "Record to text",
      path: "/voice-notes",
      gradient: "from-accent to-accent/50"
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      description: "AI insights",
      path: "/analytics",
      gradient: "from-primary to-secondary"
    },
  ] : [
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
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      <MobileHeader title="MediCare AI" profile={profile} />

      {/* Main Content */}
      <main className="pt-20 px-4 pb-4 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-1">
              Hello, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile?.role === 'doctor' ? 'Manage your practice efficiently' : 'Your health, simplified'}
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="hover:shadow-lg hover:shadow-primary/10 transition-shadow active:scale-95">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/50">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">
                {profile?.role === 'doctor' ? 'Today\'s Appointments' : 'Upcoming'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:shadow-secondary/10 transition-shadow active:scale-95">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-secondary to-secondary/50">
                  {profile?.role === 'doctor' ? (
                    <Users className="w-5 h-5 text-white" />
                  ) : (
                    <FileText className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">
                {profile?.role === 'doctor' ? 'Total Patients' : 'Prescriptions'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-95"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="pt-6 text-center">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} mb-3`}>
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
            <Brain className="w-5 h-5 text-primary" />
            AI Features
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {aiFeatures.map((feature, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-95"
                onClick={() => navigate(feature.path)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-xs mb-1">{feature.label}</h4>
                  <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Doctor Setup */}
        {profile?.role === "doctor" && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Complete Profile
              </CardTitle>
              <CardDescription>Get verified to receive appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                Add Specialization
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Setup Clinic Details
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Set Consultation Fee
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
