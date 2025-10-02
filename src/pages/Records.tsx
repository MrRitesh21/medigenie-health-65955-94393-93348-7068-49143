import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, User, Pill, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useUserRole } from "@/hooks/useUserRole";

export default function Records() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useUserRole();

  useEffect(() => {
    checkAuth();
    fetchRecords();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchRecords = async () => {
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

      // Fetch prescriptions
      const { data: prescriptionsData } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patientData.id)
        .order("created_at", { ascending: false });

      setPrescriptions(prescriptionsData || []);

      // Fetch appointments
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select(`
          *,
          doctors (
            specialization,
            clinic_name
          )
        `)
        .eq("patient_id", patientData.id)
        .order("appointment_date", { ascending: false })
        .limit(10);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Medical Records" />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">View your prescriptions and appointment history</p>
        </div>

        <Tabs defaultValue="prescriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prescriptions">
              <FileText className="mr-2 h-4 w-4" />
              Prescriptions
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Activity className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : prescriptions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No prescriptions yet</h3>
                  <p className="text-muted-foreground text-center">
                    Your prescriptions will appear here after doctor consultations
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {prescription.diagnosis}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              {formatDate(prescription.created_at)}
                            </div>
                          </CardDescription>
                        </div>
                        {prescription.ai_generated && (
                          <Badge variant="secondary">
                            AI Generated
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Medications
                          </h4>
                          <div className="space-y-2">
                            {Array.isArray(prescription.medications) && prescription.medications.map((med: any, index: number) => (
                              <div key={index} className="p-3 bg-muted rounded-lg">
                                <p className="font-medium">{med.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {med.dosage} - {med.frequency}
                                </p>
                                {med.duration && (
                                  <p className="text-sm text-muted-foreground">
                                    Duration: {med.duration}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {prescription.instructions && (
                          <div>
                            <h4 className="font-semibold mb-2">Instructions</h4>
                            <p className="text-sm text-muted-foreground">
                              {prescription.instructions}
                            </p>
                          </div>
                        )}
                        {prescription.valid_until && (
                          <p className="text-sm text-muted-foreground">
                            Valid until: {formatDate(prescription.valid_until)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
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
                  <Activity className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No appointment history</h3>
                  <p className="text-muted-foreground text-center">
                    Your past appointments will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {appointment.doctors?.specialization || "Specialist"}
                          </CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(appointment.appointment_date)}
                            </div>
                            {appointment.doctors?.clinic_name && (
                              <p className="text-sm">{appointment.doctors.clinic_name}</p>
                            )}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            appointment.status === "completed"
                              ? "default"
                              : appointment.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    {appointment.notes && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}
