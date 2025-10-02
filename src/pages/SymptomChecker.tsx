import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowLeft, AlertCircle, Mic, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VoiceChat from "@/components/VoiceChat";

export default function SymptomChecker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your symptoms",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {
      const { data, error } = await supabase.functions.invoke("symptom-checker", {
        body: { symptoms },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
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

        <h1 className="text-3xl font-bold mb-2">AI Symptom Checker</h1>
        <p className="text-muted-foreground mb-6">Get AI-powered preliminary assessment</p>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is an AI-powered tool for informational purposes only. It does not replace professional medical advice. Please consult a doctor for accurate diagnosis.
          </AlertDescription>
        </Alert>

        <Alert className="mb-6 bg-primary/5 border-primary/20">
          <Mic className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <strong>Multilingual Support:</strong> Speak your symptoms in any language - our AI understands 50+ languages!
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Chat
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Text Input
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice">
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Brain className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-medium mb-1">How Voice Chat Works:</h3>
                      <ol className="text-sm text-muted-foreground space-y-1">
                        <li>1. Tap the microphone to start recording</li>
                        <li>2. Describe your symptoms clearly</li>
                        <li>3. Tap again to stop and send</li>
                        <li>4. AI will analyze and respond with voice</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <VoiceChat
                systemPrompt="You are a medical symptom analyzer. Analyze the described symptoms and provide preliminary insights. Be compassionate and clear. Always recommend consulting a healthcare professional for accurate diagnosis."
                onTranscript={(text) => setSymptoms(text)}
                onResponse={(text) => setAnalysis(text)}
              />

              {analysis && (
                <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardContent className="pt-6">
                    <Button
                      onClick={() => navigate("/book-appointment")}
                      className="w-full"
                    >
                      Book Appointment Now
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Describe Your Symptoms
                </CardTitle>
                <CardDescription>
                  Be as detailed as possible about what you're experiencing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="E.g., I have a headache that started 2 days ago, mild fever, and feeling tired..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={6}
                />

                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Analyzing..." : "Analyze Symptoms"}
                </Button>

                {analysis && (
                  <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardHeader>
                      <CardTitle className="text-lg">AI Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {analysis}
                      </div>
                      <Button
                        onClick={() => navigate("/book-appointment")}
                        className="w-full mt-4"
                      >
                        Book Appointment Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
