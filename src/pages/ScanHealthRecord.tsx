import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ScanLine, User, Calendar, FileText, AlertCircle, Heart, Phone, MapPin } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ScanHealthRecord() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is a doctor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'doctor') {
      toast({
        title: "Access Denied",
        description: "Only doctors can access this feature",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  };

  const handleScan = async () => {
    if (!token.trim()) {
      toast({
        title: "Missing Token",
        description: "Please enter a valid access token",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('access-health-records', {
        body: { token: token.trim() }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message || 'Access denied');
      }

      setPatientData(data);
      toast({
        title: "Access Granted",
        description: "Patient records loaded successfully"
      });

    } catch (error: any) {
      console.error('Error accessing records:', error);
      toast({
        title: "Access Failed",
        description: error.message,
        variant: "destructive"
      });
      setPatientData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Scan Health Records" />
      
      <div className="container mx-auto p-4 max-w-4xl my-[50px]">
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScanLine className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Access Patient Records</CardTitle>
            </div>
            <CardDescription>
              Scan QR code or enter access token to view patient's medical history
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Token Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Access Token</CardTitle>
            <CardDescription>Input the token shared by the patient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                placeholder="Enter 16-character token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-2 font-mono"
                maxLength={16}
              />
            </div>

            <Button 
              onClick={handleScan} 
              disabled={isLoading || !token.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accessing Records...
                </>
              ) : (
                <>
                  <ScanLine className="mr-2 h-4 w-4" />
                  Access Records
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Patient Data Display */}
        {patientData && (
          <div className="space-y-4">
            {/* Patient Info */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-semibold">{patientData.patient.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-semibold">
                      {patientData.patient.date_of_birth 
                        ? new Date(patientData.patient.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-semibold">{patientData.patient.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Blood Group</Label>
                    <p className="font-semibold">{patientData.patient.blood_group || 'N/A'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <Label className="text-muted-foreground">Contact</Label>
                      <p>{patientData.patient.phone || patientData.patient.email}</p>
                    </div>
                  </div>
                  {patientData.patient.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <Label className="text-muted-foreground">Address</Label>
                        <p>{patientData.patient.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {(patientData.patient.allergies || patientData.patient.medical_conditions) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {patientData.patient.allergies && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-1" />
                          <div>
                            <Label className="text-red-600">Allergies</Label>
                            <p>{patientData.patient.allergies}</p>
                          </div>
                        </div>
                      )}
                      {patientData.patient.medical_conditions && (
                        <div className="flex items-start gap-2">
                          <Heart className="h-4 w-4 text-orange-500 mt-1" />
                          <div>
                            <Label className="text-orange-600">Medical Conditions</Label>
                            <p>{patientData.patient.medical_conditions}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Appointments History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientData.appointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No appointments found</p>
                ) : (
                  <div className="space-y-3">
                    {patientData.appointments.map((apt: any) => (
                      <Card key={apt.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                                  {apt.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(apt.appointment_date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-semibold">{apt.doctors?.profiles?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{apt.doctors?.specialization}</p>
                              {apt.symptoms && (
                                <p className="text-sm mt-2">Symptoms: {apt.symptoms}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientData.prescriptions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No prescriptions found</p>
                ) : (
                  <div className="space-y-3">
                    {patientData.prescriptions.map((rx: any) => (
                      <Card key={rx.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{rx.diagnosis}</p>
                              <span className="text-sm text-muted-foreground">
                                {new Date(rx.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              By: {rx.doctors?.profiles?.full_name} ({rx.doctors?.specialization})
                            </p>
                            {rx.instructions && (
                              <p className="text-sm mt-2">{rx.instructions}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}