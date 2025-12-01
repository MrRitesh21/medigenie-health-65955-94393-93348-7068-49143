import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowLeft, Plus } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  patient: {
    full_name: string;
  };
}

export default function Schedules() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [doctorId, setDoctorId] = useState<string>("");

  useEffect(() => {
    const checkAuthAndFetch = async () => {
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
      
      // Get doctor ID
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", session.user.id)
        .single();
      
      if (doctorData) {
        setDoctorId(doctorData.id);
        await fetchSchedules(doctorData.id);
      }
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchSchedules = async (doctorId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("appointments")
        .select(`
          id,
          appointment_date,
          status,
          patient:profiles!appointments_patient_id_fkey(full_name)
        `)
        .eq("doctor_id", doctorId)
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      // Send notification to patient
      await supabase.functions.invoke("send-appointment-notification", {
        body: {
          appointmentId,
          action: "status_updated",
          newStatus,
        },
      });

      toast({
        title: "Success",
        description: `Appointment status updated to ${newStatus}`,
      });

      // Refetch appointments
      if (doctorId) {
        await fetchSchedules(doctorId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const upcomingAppointments = appointments.filter(
    apt => apt.status !== "completed" && apt.status !== "cancelled"
  );

  const pastAppointments = appointments.filter(
    apt => apt.status === "completed" || apt.status === "cancelled"
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      <MobileHeader title="My Schedule" profile={profile} />

      <div className="pt-20 px-4 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/doctor-dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Upcoming Appointments */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Appointments
              </h2>
              {upcomingAppointments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id} className="hover:shadow-lg transition-all">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-primary/10">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{appointment.patient?.full_name || "Unknown Patient"}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(appointment.appointment_date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant="outline" className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                            <Select
                              value={appointment.status}
                              onValueChange={(value) => handleStatusUpdate(appointment.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Update status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Past Appointments
                </h2>
                <div className="space-y-3">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-muted">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{appointment.patient?.full_name || "Unknown Patient"}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(appointment.appointment_date)}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <MobileBottomNav role="doctor" />
    </div>
  );
}
