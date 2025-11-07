import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { QrCode, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";

export default function ScanQRBooking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [scanning, setScanning] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [symptoms, setSymptoms] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [appointmentType, setAppointmentType] = useState<"in-clinic" | "teleconsult">("in-clinic");
  const [booking, setBooking] = useState(false);
  const [patientId, setPatientId] = useState<string>("");

  useEffect(() => {
    checkAuth();
    initScanner();

    return () => {
      const scanner = document.getElementById("qr-reader");
      if (scanner) {
        scanner.innerHTML = "";
      }
    };
  }, []);

  const checkAuth = async () => {
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
  };

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      const qrData = JSON.parse(decodedText);
      
      if (qrData.type !== 'doctor_booking') {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not for doctor appointments",
          variant: "destructive"
        });
        return;
      }

      // Validate token and get doctor info
      const { data: tokenData, error: tokenError } = await supabase
        .from('doctor_booking_tokens')
        .select(`
          *,
          doctors:doctor_id (
            id,
            specialization,
            consultation_fee,
            qualification,
            experience_years,
            clinic_name,
            clinic_address,
            profiles:user_id (full_name, phone)
          )
        `)
        .eq('token', qrData.token)
        .eq('is_active', true)
        .maybeSingle();

      if (tokenError || !tokenData) {
        throw new Error('Invalid or expired token');
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error('This QR code has expired');
      }

      setDoctorInfo(tokenData.doctors);
      setScanning(false);

      toast({
        title: "QR Code Scanned!",
        description: "Doctor information loaded successfully"
      });

    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Invalid QR code",
        variant: "destructive"
      });
    }
  };

  const onScanError = (error: any) => {
    // Ignore scanning errors (camera permission, etc.)
    console.log(error);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !symptoms || !doctorInfo) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!patientId) {
      toast({
        title: "Profile Required",
        description: "Please complete your patient profile first",
        variant: "destructive"
      });
      navigate('/profile');
      return;
    }

    setBooking(true);

    try {
      const { error } = await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: doctorInfo.id,
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
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Scan QR Code" />
      
      <div className="container mx-auto p-4 max-w-4xl my-[50px]">
        {scanning ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <CardTitle>Scan Doctor's QR Code</CardTitle>
              </div>
              <CardDescription>
                Point your camera at the doctor's QR code to book an appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div id="qr-reader" className="w-full"></div>
            </CardContent>
          </Card>
        ) : doctorInfo ? (
          <>
            <Card className="mb-6 border-2 border-green-500">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                  <CardTitle>Doctor Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Name: </span>
                  Dr. {doctorInfo.profiles?.full_name || "Doctor"}
                </div>
                <div>
                  <span className="font-semibold">Specialization: </span>
                  {doctorInfo.specialization}
                </div>
                <div>
                  <span className="font-semibold">Qualification: </span>
                  {doctorInfo.qualification}
                </div>
                <div>
                  <span className="font-semibold">Experience: </span>
                  {doctorInfo.experience_years} years
                </div>
                <div>
                  <span className="font-semibold">Clinic: </span>
                  {doctorInfo.clinic_name}
                </div>
                <div>
                  <span className="font-semibold">Address: </span>
                  {doctorInfo.clinic_address}
                </div>
                <div>
                  <span className="font-semibold">Consultation Fee: </span>
                  ₹{doctorInfo.consultation_fee}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Book Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Appointment Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={appointmentType === "in-clinic" ? "default" : "outline"}
                      onClick={() => setAppointmentType("in-clinic")}
                    >
                      In-Clinic
                    </Button>
                    <Button
                      variant={appointmentType === "teleconsult" ? "default" : "outline"}
                      onClick={() => setAppointmentType("teleconsult")}
                    >
                      Teleconsult
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">Appointment Date & Time</Label>
                  <input
                    type="datetime-local"
                    id="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="symptoms">Symptoms / Reason for Visit</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Describe your symptoms or reason for consultation..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanning(true);
                      setDoctorInfo(null);
                      setTimeout(() => initScanner(), 100);
                    }}
                    className="flex-1"
                  >
                    Scan Another
                  </Button>
                  <Button
                    onClick={handleBookAppointment}
                    disabled={booking}
                    className="flex-1"
                  >
                    {booking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      "Book Appointment"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}