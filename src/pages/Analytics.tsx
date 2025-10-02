import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowLeft, Users, Calendar, Activity, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalPatients: 0,
    completionRate: 0,
    avgWaitTime: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch basic stats
      const { data: appointments } = await (supabase as any)
        .from("appointments")
        .select("*");

      const { data: patients } = await (supabase as any)
        .from("patients")
        .select("id");

      setStats({
        totalAppointments: appointments?.length || 0,
        totalPatients: patients?.length || 0,
        completionRate: 85, // Mock data
        avgWaitTime: 15 // Mock data
      });

      // Get AI insights
      const { data, error } = await supabase.functions.invoke("analytics-insights", {
        body: { stats: { appointments, patients } },
      });

      if (error) throw error;

      setInsights(data.insights);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      <div className="pt-6 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">AI Analytics Dashboard</h1>
        <p className="text-muted-foreground mb-6">Predictive insights and trends</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">Total Appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{stats.avgWaitTime}m</div>
              <p className="text-xs text-muted-foreground">Avg Wait Time</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Predictive analytics and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing data...</p>
              </div>
            ) : insights ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {insights}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No insights available yet. More data needed for predictions.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trends Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Key Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Peak Hours</span>
                <span className="text-sm font-semibold">10AM - 2PM</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Most Common Issue</span>
                <span className="text-sm font-semibold">Fever & Cold</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Patient Satisfaction</span>
                <span className="text-sm font-semibold">4.8/5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}