import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DoctorRatingProps {
  doctorId: string;
  appointmentId: string;
  patientId: string;
  onRatingSubmitted?: () => void;
}

export default function DoctorRating({
  doctorId,
  appointmentId,
  patientId,
  onRatingSubmitted,
}: DoctorRatingProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const [canRate, setCanRate] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, [appointmentId, patientId]);

  const checkEligibility = async () => {
    // Check if appointment is completed
    const { data: appointmentData } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", appointmentId)
      .eq("patient_id", patientId)
      .single();

    if (appointmentData?.status === "completed") {
      setCanRate(true);

      // Check if rating already exists
      const { data: ratingData } = await supabase
        .from("doctor_ratings")
        .select("*")
        .eq("appointment_id", appointmentId)
        .eq("patient_id", patientId)
        .maybeSingle();

      if (ratingData) {
        setExistingRating(ratingData);
        setRating(ratingData.rating);
        setReview(ratingData.review || "");
      }
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from("doctor_ratings")
          .update({
            rating,
            review,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRating.id);

        if (error) throw error;

        toast({
          title: "Rating Updated!",
          description: "Your rating has been updated successfully",
        });
      } else {
        // Create new rating
        const { error } = await supabase.from("doctor_ratings").insert({
          doctor_id: doctorId,
          patient_id: patientId,
          appointment_id: appointmentId,
          rating,
          review,
        });

        if (error) throw error;

        toast({
          title: "Rating Submitted!",
          description: "Thank you for your feedback",
        });
      }

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
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

  if (!canRate) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          You can only rate doctors after completing an appointment
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingRating ? "Update Your Rating" : "Rate Your Experience"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        <div>
          <Textarea
            placeholder="Share your experience (optional)..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
          />
        </div>

        <Button onClick={handleSubmitRating} disabled={loading} className="w-full">
          {loading
            ? "Submitting..."
            : existingRating
            ? "Update Rating"
            : "Submit Rating"}
        </Button>
      </CardContent>
    </Card>
  );
}
