import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ArrowLeft } from "lucide-react";

export default function DoctorRegistration() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const specialization = formData.get("specialization") as string;
    const qualification = formData.get("qualification") as string;
    const licenseNumber = formData.get("licenseNumber") as string;
    const experienceYears = formData.get("experienceYears") as string;
    const clinicName = formData.get("clinicName") as string;
    const clinicAddress = formData.get("clinicAddress") as string;
    const consultationFee = formData.get("consultationFee") as string;
    const bio = formData.get("bio") as string;

    // Validate all required fields
    if (!fullName || !email || !password || !phone || !specialization || 
        !qualification || !licenseNumber || !experienceYears || 
        !clinicName || !clinicAddress || !consultationFee) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'doctor',
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create doctor profile
        const { error: doctorError } = await (supabase as any)
          .from("doctors")
          .insert({
            user_id: authData.user.id,
            specialization,
            qualification,
            license_number: licenseNumber,
            experience_years: parseInt(experienceYears),
            clinic_name: clinicName,
            clinic_address: clinicAddress,
            consultation_fee: parseFloat(consultationFee),
            bio: bio || null,
            is_verified: false,
          });

        if (doctorError) throw doctorError;

        toast({
          title: "Registration Successful",
          description: "Your account has been created. Please wait for verification before you can start practicing.",
        });

        navigate("/auth?mode=signin");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MediCare AI
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Doctor Registration</CardTitle>
            <CardDescription>
              Complete this form to register as a doctor. All fields are mandatory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Dr. Amit Sharma"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="doctor@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      type="text"
                      placeholder="Cardiologist"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification *</Label>
                    <Input
                      id="qualification"
                      name="qualification"
                      type="text"
                      placeholder="MBBS, MD"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      placeholder="MCI-12345"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Years of Experience *</Label>
                    <Input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      min="0"
                      placeholder="5"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Clinic Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    type="text"
                    placeholder="City Medical Center"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Clinic Address *</Label>
                  <Textarea
                    id="clinicAddress"
                    name="clinicAddress"
                    placeholder="123 Main Street, City"
                    required
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultationFee">Consultation Fee (₹) *</Label>
                  <Input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    min="0"
                    placeholder="500"
                    required
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Brief introduction about yourself and your practice..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  Your account will be reviewed and verified by our team. You'll be notified once verification is complete.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register as Doctor"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
