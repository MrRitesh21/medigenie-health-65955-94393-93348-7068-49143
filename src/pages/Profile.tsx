import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, LogOut, Save, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const { role } = useUserRole();
  
  const [patientFormData, setPatientFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    address: "",
    emergency_contact: "",
    allergies: "",
    medical_conditions: "",
  });

  const [doctorFormData, setDoctorFormData] = useState({
    full_name: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience_years: 0,
    license_number: "",
    clinic_name: "",
    clinic_address: "",
    consultation_fee: 0,
    bio: "",
  });

  useEffect(() => {
    checkAuth();
    fetchProfile();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      if (profileData.role === 'doctor') {
        // Fetch doctor data
        const { data: doctorInfo } = await (supabase as any)
          .from("doctors")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (doctorInfo) {
          setDoctorData(doctorInfo);
          setDoctorFormData({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            specialization: doctorInfo.specialization || "",
            qualification: doctorInfo.qualification || "",
            experience_years: doctorInfo.experience_years || 0,
            license_number: doctorInfo.license_number || "",
            clinic_name: doctorInfo.clinic_name || "",
            clinic_address: doctorInfo.clinic_address || "",
            consultation_fee: doctorInfo.consultation_fee || 0,
            bio: doctorInfo.bio || "",
          });
        } else {
          setDoctorFormData({
            ...doctorFormData,
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
          });
        }
      } else {
        // Fetch patient data
        const { data: patientInfo } = await (supabase as any)
          .from("patients")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (patientInfo) {
          setPatientData(patientInfo);
          setPatientFormData({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            date_of_birth: patientInfo.date_of_birth || "",
            gender: patientInfo.gender || "",
            blood_group: patientInfo.blood_group || "",
            address: patientInfo.address || "",
            emergency_contact: patientInfo.emergency_contact || "",
            allergies: patientInfo.allergies || "",
            medical_conditions: patientInfo.medical_conditions || "",
          });
        } else {
          setPatientFormData({
            ...patientFormData,
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (profile?.role === 'doctor') {
        // Update profile
        const { error: profileError } = await (supabase as any)
          .from("profiles")
          .update({
            full_name: doctorFormData.full_name,
            phone: doctorFormData.phone,
          })
          .eq("id", session.user.id);

        if (profileError) throw profileError;

        // Update or create doctor data
        if (doctorData) {
          const { error: doctorError } = await (supabase as any)
            .from("doctors")
            .update({
              specialization: doctorFormData.specialization,
              qualification: doctorFormData.qualification,
              experience_years: doctorFormData.experience_years,
              license_number: doctorFormData.license_number,
              clinic_name: doctorFormData.clinic_name,
              clinic_address: doctorFormData.clinic_address,
              consultation_fee: doctorFormData.consultation_fee,
              bio: doctorFormData.bio,
            })
            .eq("user_id", session.user.id);

          if (doctorError) throw doctorError;
        } else {
          const { error: createError } = await (supabase as any)
            .from("doctors")
            .insert({
              user_id: session.user.id,
              specialization: doctorFormData.specialization,
              qualification: doctorFormData.qualification,
              experience_years: doctorFormData.experience_years,
              license_number: doctorFormData.license_number,
              clinic_name: doctorFormData.clinic_name,
              clinic_address: doctorFormData.clinic_address,
              consultation_fee: doctorFormData.consultation_fee,
              bio: doctorFormData.bio,
            });

          if (createError) throw createError;
        }
      } else {
        // Update profile
        const { error: profileError } = await (supabase as any)
          .from("profiles")
          .update({
            full_name: patientFormData.full_name,
            phone: patientFormData.phone,
          })
          .eq("id", session.user.id);

        if (profileError) throw profileError;

        // Update or create patient data
        if (patientData) {
          const { error: patientError } = await (supabase as any)
            .from("patients")
            .update({
              date_of_birth: patientFormData.date_of_birth || null,
              gender: patientFormData.gender || null,
              blood_group: patientFormData.blood_group || null,
              address: patientFormData.address || null,
              emergency_contact: patientFormData.emergency_contact || null,
              allergies: patientFormData.allergies || null,
              medical_conditions: patientFormData.medical_conditions || null,
            })
            .eq("user_id", session.user.id);

          if (patientError) throw patientError;
        } else {
          const { error: createError } = await (supabase as any)
            .from("patients")
            .insert({
              user_id: session.user.id,
              date_of_birth: patientFormData.date_of_birth || null,
              gender: patientFormData.gender || null,
              blood_group: patientFormData.blood_group || null,
              address: patientFormData.address || null,
              emergency_contact: patientFormData.emergency_contact || null,
              allergies: patientFormData.allergies || null,
              medical_conditions: patientFormData.medical_conditions || null,
            });

          if (createError) throw createError;
        }
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      fetchProfile();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      <MobileHeader title="Profile" />
      
      <div className="container mx-auto p-4 max-w-2xl pt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {profile?.role === 'doctor' ? 'Doctor Profile' : 'Profile'}
          </h1>
          <p className="text-muted-foreground">
            {profile?.role === 'doctor' 
              ? 'Manage your professional information' 
              : 'Manage your account information'}
          </p>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {profile?.role === 'doctor' ? (
                  <Stethoscope className="h-8 w-8 text-primary" />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <CardTitle>
                  {profile?.role === 'doctor' ? doctorFormData.full_name : patientFormData.full_name || "User"}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {profile?.email}
                </CardDescription>
                {profile?.role === 'doctor' && (
                  <div className="mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Doctor
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile?.role === 'doctor' ? doctorFormData.full_name : patientFormData.full_name}
                onChange={(e) => {
                  if (profile?.role === 'doctor') {
                    setDoctorFormData({ ...doctorFormData, full_name: e.target.value });
                  } else {
                    setPatientFormData({ ...patientFormData, full_name: e.target.value });
                  }
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile?.role === 'doctor' ? doctorFormData.phone : patientFormData.phone}
                onChange={(e) => {
                  if (profile?.role === 'doctor') {
                    setDoctorFormData({ ...doctorFormData, phone: e.target.value });
                  } else {
                    setPatientFormData({ ...patientFormData, phone: e.target.value });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {profile?.role === 'doctor' ? (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Update your medical credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    value={doctorFormData.specialization}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, specialization: e.target.value })}
                    placeholder="e.g., Cardiologist, Pediatrician"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="qualification">Qualification *</Label>
                  <Input
                    id="qualification"
                    value={doctorFormData.qualification}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, qualification: e.target.value })}
                    placeholder="e.g., MBBS, MD"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={doctorFormData.experience_years}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, experience_years: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="license_number">License Number *</Label>
                  <Input
                    id="license_number"
                    value={doctorFormData.license_number}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, license_number: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={doctorFormData.bio}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, bio: e.target.value })}
                    placeholder="Brief description about yourself and your practice"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>Update your clinic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="clinic_name">Clinic Name *</Label>
                  <Input
                    id="clinic_name"
                    value={doctorFormData.clinic_name}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, clinic_name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="clinic_address">Clinic Address *</Label>
                  <Textarea
                    id="clinic_address"
                    value={doctorFormData.clinic_address}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, clinic_address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                  <Input
                    id="consultation_fee"
                    type="number"
                    value={doctorFormData.consultation_fee}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, consultation_fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={patientFormData.date_of_birth}
                    onChange={(e) => setPatientFormData({ ...patientFormData, date_of_birth: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={patientFormData.gender}
                    onChange={(e) => setPatientFormData({ ...patientFormData, gender: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Input
                    id="blood_group"
                    value={patientFormData.blood_group}
                    onChange={(e) => setPatientFormData({ ...patientFormData, blood_group: e.target.value })}
                    placeholder="e.g., A+, O-, B+"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={patientFormData.address}
                    onChange={(e) => setPatientFormData({ ...patientFormData, address: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    type="tel"
                    value={patientFormData.emergency_contact}
                    onChange={(e) => setPatientFormData({ ...patientFormData, emergency_contact: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>Keep your medical history updated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={patientFormData.allergies}
                    onChange={(e) => setPatientFormData({ ...patientFormData, allergies: e.target.value })}
                    placeholder="e.g., Penicillin, Peanuts"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Input
                    id="medical_conditions"
                    value={patientFormData.medical_conditions}
                    onChange={(e) => setPatientFormData({ ...patientFormData, medical_conditions: e.target.value })}
                    placeholder="e.g., Diabetes, Hypertension"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}