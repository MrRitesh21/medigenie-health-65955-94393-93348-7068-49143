import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: adminRole } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!adminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Fetch profile
      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      // Fetch all doctors
      await fetchDoctors();
    } catch (error) {
      console.error("Error checking admin auth:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("doctors")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load doctors list",
        variant: "destructive",
      });
    }
  };

  const handleVerifyDoctor = async (doctorId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("doctors")
        .update({ is_verified: !currentStatus })
        .eq("id", doctorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Doctor ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });

      await fetchDoctors();
    } catch (error) {
      console.error("Error updating doctor verification:", error);
      toast({
        title: "Error",
        description: "Failed to update doctor verification",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      <MobileHeader title="Admin Dashboard" profile={profile} />

      <main className="pt-20 px-4 pb-4 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Admin Panel</h2>
                <p className="text-sm text-muted-foreground">Manage doctors and verification</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/50">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{doctors.length}</div>
              <p className="text-xs text-muted-foreground">Total Doctors</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-secondary to-secondary/50">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">
                {doctors.filter(d => d.is_verified).length}
              </div>
              <p className="text-xs text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Doctors List */}
        <Card>
          <CardHeader>
            <CardTitle>Doctor Verification</CardTitle>
            <CardDescription>Review and verify doctor registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No doctors registered yet</p>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <Card key={doctor.id} className="border border-border/50">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{doctor.profiles?.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{doctor.profiles?.email}</p>
                          </div>
                          <Badge variant={doctor.is_verified ? "default" : "secondary"}>
                            {doctor.is_verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Specialization</p>
                            <p className="font-medium">{doctor.specialization}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Experience</p>
                            <p className="font-medium">{doctor.experience_years} years</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">License</p>
                            <p className="font-medium">{doctor.license_number}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fee</p>
                            <p className="font-medium">₹{doctor.consultation_fee}</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleVerifyDoctor(doctor.id, doctor.is_verified)}
                          className="w-full"
                          variant={doctor.is_verified ? "outline" : "default"}
                        >
                          {doctor.is_verified ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Revoke Verification
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify Doctor
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <MobileBottomNav />
    </div>
  );
}
