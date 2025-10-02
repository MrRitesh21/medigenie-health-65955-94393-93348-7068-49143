import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Video, Building2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      const { data: patientData } = await (supabase as any)
        .from("patients")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        setPatientId(patientData.id);
      }

      // Fetch verified doctors using the secure public view
      const { data: doctorsData } = await (supabase as any)
        .from("public_doctors")
        .select("id, specialization, consultation_fee");

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
      const { error } = await (supabase as any).from("appointments").insert({
        patient_id: patientId,
        doctor_id: selectedDoctor,
        appointment_date: new Date(selectedDate).toISOString(),
        type: appointmentType,
        symptoms: symptoms,
        status: "scheduled",
      });

      if (error) throw error;

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  In-Clinic Visit
                </CardTitle>
                <CardDescription>Visit the doctor's clinic for consultation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="doctor">Select Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.specialization} - ₹{doctor.consultation_fee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
          </TabsContent>

          <TabsContent value="teleconsult" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Online Consultation
                </CardTitle>
                <CardDescription>Connect with doctor via video call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="doctor-tele">Select Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.specialization} - ₹{doctor.consultation_fee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
