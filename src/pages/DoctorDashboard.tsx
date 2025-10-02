import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, Users, TrendingUp, Mic, Pill, FileText, Brain } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";

export default function DoctorDashboard() {
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

      if (profileData?.role !== 'doctor') {
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      <MobileHeader title="Doctor Portal" profile={profile} />

      <main className="pt-20 px-4 pb-4 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-1">
              Dr. {profile?.full_name?.split(' ')[0] || 'Doctor'} 👨‍⚕️
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your practice efficiently
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/50 mb-2 w-fit">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 mb-2 w-fit">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Patients</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-accent/50 mb-2 w-fit">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Reports</p>
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
                className="cursor-pointer hover:shadow-lg transition-all active:scale-95"
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

        {/* Profile Completion */}
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Complete Your Profile
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
      </main>

      <MobileBottomNav role="doctor" />
    </div>
  );
}
