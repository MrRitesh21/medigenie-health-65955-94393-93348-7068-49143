import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { QrCode, Calendar, Loader2, CheckCircle2, Camera, RefreshCw } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";

export default function ScanQRBooking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [symptoms, setSymptoms] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [appointmentType, setAppointmentType] = useState<"in-clinic" | "teleconsult">("in-clinic");
  const [booking, setBooking] = useState(false);
  const [patientId, setPatientId] = useState<string>("");
  const [cameraError, setCameraError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkAuth();
    
    const timer = setTimeout(() => {
      initScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: patientData } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (patientData) {
      setPatientId(patientData.id);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING state
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.log('Scanner stop error:', error);
      }
    }
  };

  const initScanner = async () => {
    setIsInitializing(true);
    setCameraError(false);
    setErrorMessage("");

    try {
      // First stop any existing scanner
      await stopScanner();

      // Check if element exists
      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        console.log('QR reader element not found, retrying...');
        setTimeout(() => initScanner(), 300);
        return;
      }

      // Check for available cameras first
      let cameras;
      try {
        cameras = await Html5Qrcode.getCameras();
        console.log('Available cameras:', cameras);
      } catch (cameraListError: any) {
        console.error('Error getting cameras:', cameraListError);
        throw new Error('Camera access denied. Please allow camera permissions in your browser settings.');
      }

      if (!cameras || cameras.length === 0) {
        throw new Error('No camera found on this device. Please ensure your device has a camera.');
      }

      // Create new scanner instance
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Try to use back camera first, fallback to first available
      const backCamera = cameras.find(c => 
        c.label.toLowerCase().includes('back') || 
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      );
      
      const cameraId = backCamera?.id || cameras[0].id;
      console.log('Using camera:', cameraId);

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        onScanSuccess,
        (errorMessage) => {
          // This is called for every frame without a QR code - ignore these
        }
      );

      setIsInitializing(false);
      console.log('Scanner started successfully');

    } catch (error: any) {
      console.error('Scanner initialization error:', error);
      setIsInitializing(false);
      setCameraError(true);
      
      // Provide specific error messages
      let message = error.message || 'Failed to initialize camera';
      
      if (error.name === 'NotAllowedError' || message.includes('denied')) {
        message = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (error.name === 'NotFoundError' || message.includes('No camera')) {
        message = 'No camera found. Please ensure your device has a camera.';
      } else if (error.name === 'NotSupportedError') {
        message = 'Camera not supported. Please use HTTPS or localhost.';
      } else if (error.name === 'NotReadableError') {
        message = 'Camera is in use by another application. Please close other apps using the camera.';
      }
      
      setErrorMessage(message);
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive"
      });
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanner after successful scan
    await stopScanner();
    
    try {
      const qrData = JSON.parse(decodedText);
      
      if (qrData.type !== 'doctor_booking') {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not for doctor appointments",
          variant: "destructive"
        });
        // Restart scanner
        setTimeout(() => initScanner(), 1000);
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
      console.error('QR Scan error:', error);
      toast({
        title: "Scan Failed",
        description: error.message || "Invalid QR code",
        variant: "destructive"
      });
      
      // Restart scanner on error
      setTimeout(() => initScanner(), 1000);
    }
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

  const handleRetry = async () => {
    setCameraError(false);
    setErrorMessage("");
    await stopScanner();
    setTimeout(() => initScanner(), 300);
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
            <CardContent className="space-y-4">
              {cameraError ? (
                <div className="text-center py-8 space-y-4">
                  <Camera className="h-16 w-16 mx-auto text-destructive opacity-50" />
                  <div>
                    <p className="font-semibold mb-2 text-destructive">Camera Error</p>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      {errorMessage || "Failed to access camera. Please check your permissions."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleRetry} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Make sure to allow camera access when prompted
                    </p>
                  </div>
                </div>
              ) : isInitializing ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Initializing camera...</p>
                </div>
              ) : null}
              
              {/* Always render qr-reader but hide when not needed */}
              <div 
                id="qr-reader" 
                className="w-full min-h-[300px]"
                style={{ display: cameraError || isInitializing ? 'none' : 'block' }}
              ></div>
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
                    onClick={async () => {
                      setScanning(true);
                      setDoctorInfo(null);
                      setCameraError(false);
                      setIsInitializing(true);
                      await stopScanner();
                      setTimeout(() => initScanner(), 300);
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