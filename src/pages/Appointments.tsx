import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Plus, User, Star, Video, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DoctorRating from "@/components/DoctorRating";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
export default function Appointments() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string>("");
  const {
    role
  } = useUserRole();
  useEffect(() => {
    checkAuth();
    fetchAppointments();
  }, []);
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };
  const fetchAppointments = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;

      // Get patient ID
      const {
        data: patientData
      } = await supabase.from("patients").select("id").eq("user_id", session.user.id).single();
      if (!patientData) {
        setLoading(false);
        return;
      }
      setPatientId(patientData.id);

      // Fetch appointments
      const {
        data: appointmentsData,
        error
      } = await supabase.from("appointments").select(`
          *,
          doctors (
            specialization,
            clinic_name,
            clinic_address,
            consultation_fee,
            photo_url,
            profiles:user_id (full_name, phone)
          )
        `).eq("patient_id", patientData.id).order("appointment_date", {
        ascending: true
      });
      if (error) throw error;
      setAppointments(appointmentsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
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
      day: "numeric"
    });
  };
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  return <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Appointments" />
      
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 max-w-7xl my-[50px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Appointments</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">View and manage your appointments</p>
          </div>
          <Button onClick={() => navigate("/book-appointment")} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="sm:inline">Book New</span>
          </Button>
        </div>

        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>)}
          </div> : appointments.length === 0 ? <Card>
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
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {appointments.map(appointment => <Card key={appointment.id} className="hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                      <AvatarImage src={appointment.doctors?.photo_url} alt={appointment.doctors?.profiles?.full_name} />
                      <AvatarFallback className="text-base sm:text-lg">
                        {appointment.doctors?.profiles?.full_name?.charAt(0) || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">
                            Dr. {appointment.doctors?.profiles?.full_name || "Doctor"}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {appointment.doctors?.specialization}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(appointment.status)} flex-shrink-0 text-xs`}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      <span className="text-xs sm:text-sm font-medium">{formatDate(appointment.appointment_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      <span className="text-xs sm:text-sm">{formatTime(appointment.appointment_date)} • {appointment.duration_minutes} mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.type === "teleconsult" ? <>
                          <Video className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span className="text-xs sm:text-sm">Teleconsultation</span>
                        </> : <>
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span className="text-xs sm:text-sm">In-Clinic Visit</span>
                        </>}
                    </div>
                    {appointment.doctors?.clinic_name && appointment.type === "in-clinic" && <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium">{appointment.doctors.clinic_name}</p>
                          {appointment.doctors?.clinic_address && <p className="text-xs text-muted-foreground line-clamp-1">{appointment.doctors.clinic_address}</p>}
                        </div>
                      </div>}
                  </CardDescription>
                 </CardHeader>
                <CardContent className="space-y-3 pt-0 flex-1">
                  {appointment.symptoms && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      <strong>Symptoms:</strong> {appointment.symptoms}
                    </p>}
                  
                  {appointment.status === "completed" && <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full text-xs sm:text-sm">
                          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                          Rate Doctor
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">Rate Your Experience</DialogTitle>
                        </DialogHeader>
                        <DoctorRating doctorId={appointment.doctor_id} appointmentId={appointment.id} patientId={patientId} onRatingSubmitted={() => {
                  toast({
                    title: "Thank you!",
                    description: "Your rating has been submitted"
                  });
                }} />
                      </DialogContent>
                    </Dialog>}
                </CardContent>
              </Card>)}
          </div>}
      </div>

      <MobileBottomNav role={role} />
    </div>;
}