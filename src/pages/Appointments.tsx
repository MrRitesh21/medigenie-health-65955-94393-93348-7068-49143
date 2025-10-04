import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Plus, User, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import DoctorRating from "@/components/DoctorRating";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Appointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string>("");
  const { role } = useUserRole();

  useEffect(() => {
    checkAuth();
    fetchAppointments();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get patient ID
      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!patientData) {
        setLoading(false);
        return;
      }

      setPatientId(patientData.id);

      // Fetch appointments
      const { data: appointmentsData, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctors (
            specialization,
            clinic_name,
            clinic_address
          )
        `)
        .eq("patient_id", patientData.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      setAppointments(appointmentsData || []);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-600";
      case "completed":
        return "bg-green-500/10 text-green-600";
      case "cancelled":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Appointments" />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Appointments</h1>
            <p className="text-muted-foreground">View and manage your appointments</p>
          </div>
          <Button onClick={() => navigate("/book-appointment")}>
            <Plus className="mr-2 h-4 w-4" />
            Book New
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No appointments yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Book your first appointment to get started
              </p>
              <Button onClick={() => navigate("/book-appointment")}>
                <Plus className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {appointment.doctors?.specialization || "Specialist"}
                        </CardTitle>
                      </div>
                      <CardDescription className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(appointment.appointment_date)} ({appointment.duration_minutes} mins)</span>
                        </div>
                        {appointment.doctors?.clinic_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.doctors.clinic_name}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                 </CardHeader>
                <CardContent className="space-y-3">
                  {appointment.symptoms && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Symptoms:</strong> {appointment.symptoms}
                    </p>
                  )}
                  
                  {appointment.status === "completed" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Star className="w-4 h-4 mr-2" />
                          Rate Doctor
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Rate Your Experience</DialogTitle>
                        </DialogHeader>
                        <DoctorRating
                          doctorId={appointment.doctor_id}
                          appointmentId={appointment.id}
                          patientId={patientId}
                          onRatingSubmitted={() => {
                            toast({
                              title: "Thank you!",
                              description: "Your rating has been submitted",
                            });
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}
