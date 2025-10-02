import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Package, FileText, TrendingUp, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function PharmacyDashboard() {
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

      if (profileData?.role !== 'pharmacy') {
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
      icon: ShoppingCart,
      label: "New Orders",
      description: "Pending prescriptions",
      path: "/prescriptions",
      gradient: "from-primary to-primary/50"
    },
    {
      icon: Package,
      label: "Inventory",
      description: "Manage stock",
      path: "/prescriptions",
      gradient: "from-secondary to-secondary/50"
    },
    {
      icon: CheckCircle,
      label: "Fulfilled",
      description: "Completed orders",
      path: "/prescriptions",
      gradient: "from-accent to-accent/50"
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      description: "Sales insights",
      path: "/analytics",
      gradient: "from-primary to-secondary"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      <MobileHeader title="Pharmacy Portal" profile={profile} />

      <main className="pt-20 px-4 pb-4 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-1">
              {profile?.full_name?.split(' ')[0] || 'Pharmacy'} 💊
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage prescriptions and inventory
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/50 mb-2 w-fit">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 mb-2 w-fit">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Fulfilled</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-accent/50 mb-2 w-fit">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold mb-1">0</div>
              <p className="text-xs text-muted-foreground">Items</p>
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

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <CardDescription>No pending prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No orders to display</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileBottomNav role="pharmacy" />
    </div>
  );
}
