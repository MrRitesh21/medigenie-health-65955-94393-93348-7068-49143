import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MapPin, Star, Award, DollarSign, Sparkles } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";

export default function SmartDoctorMatch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [symptoms, setSymptoms] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleMatch = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your symptoms",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get patient location if available
      let patientLocation = null;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: patient } = await supabase
          .from('patients')
          .select('latitude, longitude')
          .eq('user_id', user.id)
          .single();
        
        if (patient?.latitude && patient?.longitude) {
          patientLocation = {
            latitude: typeof patient.latitude === 'string' ? parseFloat(patient.latitude) : patient.latitude,
            longitude: typeof patient.longitude === 'string' ? parseFloat(patient.longitude) : patient.longitude
          };
        }
      }

      const { data, error } = await supabase.functions.invoke('smart-doctor-matching', {
        body: {
          symptoms,
          specialization: specialization || null,
          patientLocation,
          maxDistance: maxDistance ? parseFloat(maxDistance) : null
        }
      });

      if (error) throw error;

      setRecommendations(data.recommendations);
      
      toast({
        title: "Match Complete!",
        description: `Found ${data.recommendations.length} doctors perfect for you`
      });

    } catch (error: any) {
      console.error('Error matching doctors:', error);
      toast({
        title: "Matching Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = (doctorId: string) => {
    navigate(`/book-appointment?doctor=${doctorId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Smart Doctor Match" />
      
      <div className="container mx-auto p-4 max-w-4xl my-[50px]">
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">AI-Powered Doctor Matching</CardTitle>
            </div>
            <CardDescription>
              Our AI analyzes your symptoms, location, and preferences to recommend the perfect doctors for you
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tell us about your needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="symptoms">Symptoms & Concerns *</Label>
              <Textarea
                id="symptoms"
                placeholder="Describe your symptoms, concerns, or what you need help with..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="min-h-[100px] mt-2"
              />
            </div>

            <div>
              <Label htmlFor="specialization">Preferred Specialization (Optional)</Label>
              <Input
                id="specialization"
                placeholder="e.g., Cardiologist, Dermatologist, General Physician"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="distance">Maximum Distance (km) (Optional)</Label>
              <Input
                id="distance"
                type="number"
                placeholder="e.g., 10"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button 
              onClick={handleMatch} 
              disabled={isLoading || !symptoms.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI is analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Find Perfect Match
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Top Matches For You</h2>
            {recommendations.map((doctor, index) => (
              <Card key={doctor.id} className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          #{index + 1}
                        </div>
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm font-medium">
                          {doctor.match_score}% Match
                        </div>
                      </div>
                      <CardTitle className="text-xl">{doctor.full_name}</CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4" />
                          {doctor.specialization} • {doctor.experience_years} years exp
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-1">Why this doctor?</p>
                    <p className="text-sm text-muted-foreground">{doctor.match_reasoning}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">
                        {doctor.average_rating?.toFixed(1) || 'New'} ({doctor.total_ratings || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">₹{doctor.consultation_fee}</span>
                    </div>
                    {doctor.distance && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{doctor.distance.toFixed(1)} km away</span>
                      </div>
                    )}
                  </div>

                  {doctor.bio && (
                    <p className="text-sm text-muted-foreground border-t pt-3">
                      {doctor.bio}
                    </p>
                  )}

                  <Button 
                    onClick={() => handleBookAppointment(doctor.id)}
                    className="w-full"
                  >
                    Book Appointment
                  </Button>
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