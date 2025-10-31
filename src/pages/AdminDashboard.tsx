import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Users, Activity, Calendar, FileText, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    verifiedDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
  });

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

      // Fetch all data
      await Promise.all([fetchDoctors(), fetchPatients(), fetchAppointments()]);
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
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalDoctors: data?.length || 0,
        verifiedDoctors: data?.filter(d => d.is_verified).length || 0,
      }));
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
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
      setPatients(data || []);
      
      setStats(prev => ({
        ...prev,
        totalPatients: data?.length || 0,
      }));
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctors (
            specialization,
            profiles:user_id (full_name)
          ),
          patients (
            profiles:user_id (full_name)
          )
        `)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
      
      setStats(prev => ({
        ...prev,
        totalAppointments: data?.length || 0,
        completedAppointments: data?.filter(a => a.status === "completed").length || 0,
      }));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
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

      await Promise.all([fetchDoctors(), fetchAppointments()]);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card/50 pb-20">
      <MobileHeader title="Admin Dashboard" profile={profile} />

      <main className="pt-20 px-4 pb-4 max-w-7xl mx-auto">
        {/* Welcome Card */}
        <Card className="gradient-accent border-0 shadow-glow mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl gradient-secondary shadow-lg">
                <Shield className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="text-accent-foreground">
                <h2 className="text-2xl font-bold">Admin Panel</h2>
                <p className="text-sm text-accent-foreground/80">Manage platform and users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="doctors">
              <Shield className="w-4 h-4 mr-2" />
              Doctors
            </TabsTrigger>
            <TabsTrigger value="patients">
              <Users className="w-4 h-4 mr-2" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-smooth border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 rounded-xl gradient-primary shadow-glow">
                      <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.totalDoctors}</div>
                  <p className="text-xs text-muted-foreground">Total Doctors</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-secondary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 rounded-xl gradient-secondary shadow-glow-secondary">
                      <CheckCircle className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.verifiedDoctors}</div>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-accent/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 rounded-xl gradient-accent shadow-lg">
                      <Users className="w-5 h-5 text-accent-foreground" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.totalPatients}</div>
                  <p className="text-xs text-muted-foreground">Patients</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 rounded-xl gradient-primary shadow-glow">
                      <Calendar className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">Appointments</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 gradient-primary rounded-full"></div>
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest appointments and registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-smooth bg-card/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg gradient-secondary/20">
                          <Calendar className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {appointment.patients?.profiles?.full_name} → Dr. {appointment.doctors?.profiles?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_date)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={appointment.status === "completed" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-6">
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
                            <div className="flex items-start gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={doctor.photo_url} alt={doctor.profiles?.full_name} />
                                <AvatarFallback>
                                  {doctor.profiles?.full_name?.charAt(0) || "D"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold">Dr. {doctor.profiles?.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{doctor.profiles?.email}</p>
                                  </div>
                                  <Badge variant={doctor.is_verified ? "default" : "secondary"}>
                                    {doctor.is_verified ? "Verified" : "Pending"}
                                  </Badge>
                                </div>
                              </div>
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
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registered Patients</CardTitle>
                <CardDescription>View all registered patients</CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No patients registered yet</p>
                ) : (
                  <div className="space-y-4">
                    {patients.map((patient) => (
                      <Card key={patient.id} className="border border-border/50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {patient.profiles?.full_name?.charAt(0) || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold">{patient.profiles?.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{patient.profiles?.email}</p>
                              {patient.profiles?.phone && (
                                <p className="text-sm text-muted-foreground">{patient.profiles.phone}</p>
                              )}
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                {patient.blood_group && (
                                  <div>
                                    <p className="text-muted-foreground">Blood Group</p>
                                    <p className="font-medium">{patient.blood_group}</p>
                                  </div>
                                )}
                                {patient.date_of_birth && (
                                  <div>
                                    <p className="text-muted-foreground">DOB</p>
                                    <p className="font-medium">{formatDate(patient.date_of_birth)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>View and manage all appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No appointments yet</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <Card key={appointment.id} className="border border-border/50">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">
                                  {appointment.patients?.profiles?.full_name} → Dr. {appointment.doctors?.profiles?.full_name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.doctors?.specialization}
                                </p>
                              </div>
                              <Badge variant={
                                appointment.status === "completed" ? "default" :
                                appointment.status === "cancelled" ? "destructive" :
                                "secondary"
                              }>
                                {appointment.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Date</p>
                                <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Time</p>
                                <p className="font-medium">{formatTime(appointment.appointment_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Type</p>
                                <p className="font-medium capitalize">{appointment.type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Duration</p>
                                <p className="font-medium">{appointment.duration_minutes} mins</p>
                              </div>
                            </div>

                            {appointment.symptoms && (
                              <div>
                                <p className="text-sm text-muted-foreground">Symptoms</p>
                                <p className="text-sm">{appointment.symptoms}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileBottomNav role="admin" />
    </div>
  );
}
