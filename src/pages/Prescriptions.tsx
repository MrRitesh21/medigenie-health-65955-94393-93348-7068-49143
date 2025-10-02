import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft, Calendar, User, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Prescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: patientData } = await (supabase as any)
        .from("patients")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        const { data } = await (supabase as any)
          .from("prescriptions")
          .select("*, appointments(*), doctors(*)")
          .eq("patient_id", patientData.id)
          .order("created_at", { ascending: false });

        setPrescriptions(data || []);
      }

      setLoading(false);
    };

    fetchPrescriptions();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading prescriptions...</p>
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

        <h1 className="text-3xl font-bold mb-2">My Prescriptions</h1>
        <p className="text-muted-foreground mb-6">View your medical prescriptions</p>

        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No prescriptions yet</p>
              </CardContent>
            </Card>
          ) : (
            prescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {prescription.diagnosis}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {prescription.ai_generated && (
                      <Badge variant="secondary">AI Assisted</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Medications
                    </h4>
                    <div className="space-y-2">
                      {(prescription.medications as any[])?.map((med: any, idx: number) => (
                        <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                          <div className="font-medium">{med.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {med.dosage} - {med.frequency}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Duration: {med.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {prescription.instructions && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Instructions</h4>
                        <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                      </div>
                    </>
                  )}

                  {prescription.valid_until && (
                    <div className="text-xs text-muted-foreground">
                      Valid until: {new Date(prescription.valid_until).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
