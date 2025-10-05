import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Video, Building2, ArrowLeft, GraduationCap, Briefcase, Star, MapPin, Phone, Clock, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DoctorReviews from "@/components/DoctorReviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BookAppointment() {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(doctorId || "");
  const [appointmentType, setAppointmentType] = useState<"in-clinic" | "teleconsult">("in-clinic");
  const [symptoms, setSymptoms] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [patientId, setPatientId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<"all" | "near">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDoctorDetail, setShowDoctorDetail] = useState(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

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

      // Fetch verified doctors with profile information and ratings
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
          latitude,
          longitude,
          availability_schedule,
          photo_url,
          profiles:user_id (full_name, phone)
        `)
        .eq("is_verified", true);

      if (doctorsError) {
        console.error("Error fetching doctors:", doctorsError);
        return;
      }

      // Fetch ratings for each doctor
      const doctorsWithRatings = await Promise.all(
        (doctorsData || []).map(async (doctor) => {
          const { data: ratingsData } = await supabase
            .from("doctor_ratings")
            .select("rating")
            .eq("doctor_id", doctor.id);

          const totalRatings = ratingsData?.length || 0;
          const averageRating = totalRatings > 0
            ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            : 0;

          return {
            ...doctor,
            total_ratings: totalRatings,
            average_rating: averageRating,
          };
        })
      );

      setDoctors(doctorsWithRatings);
      setFilteredDoctors(doctorsWithRatings);
    };

    fetchData();
  }, [navigate]);

  // Filter doctors based on search and location
  useEffect(() => {
    let filtered = [...doctors];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter === "near" && userLocation) {
      filtered = filtered
        .map((doctor) => {
          if (doctor.latitude && doctor.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              doctor.latitude,
              doctor.longitude
            );
            return { ...doctor, distance };
          }
          return { ...doctor, distance: Infinity };
        })
        .filter((doctor) => doctor.distance < 50) // Within 50km
        .sort((a, b) => a.distance - b.distance);
    }

    setFilteredDoctors(filtered);
  }, [searchQuery, locationFilter, doctors, userLocation]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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

  const renderDoctorCard = (doctor: any) => (
    <Card
      key={doctor.id}
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={() => {
        setSelectedDoctor(doctor.id);
        setShowDoctorDetail(true);
      }}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={doctor.photo_url} alt={doctor.profiles?.full_name} />
            <AvatarFallback className="text-lg">
              {doctor.profiles?.full_name?.charAt(0) || "D"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1">
            {doctor.profiles?.full_name && (
              <CardTitle className="text-xl">Dr. {doctor.profiles.full_name}</CardTitle>
            )}
            <div className="text-base font-medium text-primary">{doctor.specialization}</div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(doctor.average_rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                ({doctor.average_rating.toFixed(1)})
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg font-semibold">
            ₹{doctor.consultation_fee}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
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
        {doctor.clinic_address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {doctor.clinic_address}
          </div>
        )}
        {doctor.distance && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <MapPin className="w-4 h-4" />
            {doctor.distance.toFixed(1)} km away
          </div>
        )}
        {doctor.profiles?.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            {doctor.profiles.phone}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (showDoctorDetail && selectedDoctor) {
    const doctor = doctors.find((d) => d.id === selectedDoctor);
    if (!doctor) return null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
        <div className="pt-6 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDoctorDetail(false)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Doctors
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={doctor.photo_url} alt={doctor.profiles?.full_name} />
                  <AvatarFallback className="text-2xl">
                    {doctor.profiles?.full_name?.charAt(0) || "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3 flex-1">
                  <CardTitle className="text-2xl">Dr. {doctor.profiles?.full_name || "Doctor"}</CardTitle>
                  <div className="text-lg font-medium text-primary">{doctor.specialization}</div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(doctor.average_rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-muted-foreground">
                      ({doctor.average_rating.toFixed(1)}) - {doctor.total_ratings} reviews
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xl font-semibold">
                  ₹{doctor.consultation_fee}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <span>{doctor.qualification}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span>{doctor.experience_years} years experience</span>
                </div>
                {doctor.clinic_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span>{doctor.clinic_name}</span>
                  </div>
                )}
                {doctor.clinic_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{doctor.clinic_address}</span>
                  </div>
                )}
                {doctor.profiles?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>{doctor.profiles.phone}</span>
                  </div>
                )}
              </div>
              {doctor.bio && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground">{doctor.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <div className="mb-6">
            <DoctorReviews doctorId={selectedDoctor} />
          </div>

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

            <TabsContent value="in-clinic">
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
            </TabsContent>

            <TabsContent value="teleconsult">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

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

        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MapPin className="w-8 h-8 text-primary" />
          AI Recommended Doctors
        </h1>
        <p className="text-muted-foreground mb-6">Find doctors near you</p>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors by name, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                <SelectItem value="near">Near You</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Doctor Listings */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No doctors found matching your criteria
              </CardContent>
            </Card>
          ) : (
            filteredDoctors.map((doctor) => renderDoctorCard(doctor))
          )}
        </div>
      </div>
    </div>
  );
}
