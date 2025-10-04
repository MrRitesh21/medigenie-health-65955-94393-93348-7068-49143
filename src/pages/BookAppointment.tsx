import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Video, Building2, ArrowLeft, GraduationCap, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function BookAppointment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<"in-clinic" | "teleconsult">("in-clinic");
  const [symptoms, setSymptoms] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [patientId, setPatientId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get patient ID
      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (patientData) {
        setPatientId(patientData.id);
      }

      // Fetch verified doctors with profile information
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select(`
          id, 
          specialization, 
          consultation_fee, 
          qualification, 
          experience_years, 
          bio,
          clinic_name,
          clinic_address,
          license_number,
          profiles:user_id (full_name, phone)
        `)
        .eq("is_verified", true);

      if (doctorsError) {
        console.error("Error fetching doctors:", doctorsError);
      }

      setDoctors(doctorsData || []);
    };

    fetchData();
  }, [navigate]);

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !symptoms) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (!patientId) {
        toast({
          title: "Error",
          description: "Patient profile not found. Please complete your profile first.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: selectedDoctor,
        appointment_date: new Date(selectedDate).toISOString(),
        type: appointmentType,
        symptoms: symptoms,
        status: "scheduled",
      });

      if (error) {
        console.error("Appointment booking error:", error);
        throw error;
      }

      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been scheduled successfully",
      });

      navigate("/dashboard");
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

        <h1 className="text-3xl font-bold mb-2">Book Appointment</h1>
        <p className="text-muted-foreground mb-6">Schedule your consultation</p>

        <Tabs value={appointmentType} onValueChange={(v) => setAppointmentType(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="in-clinic" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              In-Clinic
            </TabsTrigger>
            <TabsTrigger value="teleconsult" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Teleconsult
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-clinic" className="space-y-4">
            <div className="space-y-4">
              <Label>Select Doctor</Label>
              {doctors.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No verified doctors available at the moment
                  </CardContent>
                </Card>
              ) : (
                doctors.map((doctor) => (
                  <Card 
                    key={doctor.id} 
                    className={`cursor-pointer transition-all ${
                      selectedDoctor === doctor.id 
                        ? "ring-2 ring-primary border-primary" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedDoctor(doctor.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          {doctor.profiles?.full_name && (
                            <CardTitle className="text-xl">Dr. {doctor.profiles.full_name}</CardTitle>
                          )}
                          <div className="text-base font-medium text-primary">{doctor.specialization}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4" />
                            {doctor.qualification}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="w-4 h-4" />
                            {doctor.experience_years} years experience
                          </div>
                          {doctor.clinic_name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="w-4 h-4" />
                              {doctor.clinic_name}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-lg font-semibold">
                          ₹{doctor.consultation_fee}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {doctor.clinic_address && (
                        <p className="text-sm text-muted-foreground">📍 {doctor.clinic_address}</p>
                      )}
                      {doctor.bio && (
                        <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}

              {selectedDoctor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Complete Booking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="date">Appointment Date & Time</Label>
                      <input
                        type="datetime-local"
                        id="date"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="symptoms">Symptoms</Label>
                      <Textarea
                        id="symptoms"
                        placeholder="Describe your symptoms..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Booking..." : "Book Appointment"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teleconsult" className="space-y-4">
            <div className="space-y-4">
              <Label>Select Doctor</Label>
              {doctors.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No verified doctors available at the moment
                  </CardContent>
                </Card>
              ) : (
                doctors.map((doctor) => (
                  <Card 
                    key={doctor.id} 
                    className={`cursor-pointer transition-all ${
                      selectedDoctor === doctor.id 
                        ? "ring-2 ring-primary border-primary" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedDoctor(doctor.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          {doctor.profiles?.full_name && (
                            <CardTitle className="text-xl">Dr. {doctor.profiles.full_name}</CardTitle>
                          )}
                          <div className="text-base font-medium text-primary">{doctor.specialization}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4" />
                            {doctor.qualification}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="w-4 h-4" />
                            {doctor.experience_years} years experience
                          </div>
                          {doctor.clinic_name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="w-4 h-4" />
                              {doctor.clinic_name}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-lg font-semibold">
                          ₹{doctor.consultation_fee}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {doctor.clinic_address && (
                        <p className="text-sm text-muted-foreground">📍 {doctor.clinic_address}</p>
                      )}
                      {doctor.bio && (
                        <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}

              {selectedDoctor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" />
                      Complete Booking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="date-tele">Appointment Date & Time</Label>
                      <input
                        type="datetime-local"
                        id="date-tele"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="symptoms-tele">Symptoms</Label>
                      <Textarea
                        id="symptoms-tele"
                        placeholder="Describe your symptoms..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Booking..." : "Book Teleconsultation"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
