import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft, Upload, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ReportSimplifier() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reportText, setReportText] = useState("");
  const [language, setLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [simplifiedReport, setSimplifiedReport] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain" && file.type !== "application/pdf") {
      toast({
        title: "Invalid File",
        description: "Please upload a text or PDF file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setReportText(text);
    };
    reader.readAsText(file);
  };

  const handleSimplify = async () => {
    if (!reportText.trim()) {
      toast({
        title: "Missing Report",
        description: "Please upload or paste your medical report",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSimplifiedReport("");

    try {
      const { data, error } = await supabase.functions.invoke("report-simplifier", {
        body: { reportText, language },
      });

      if (error) throw error;

      setSimplifiedReport(data.simplifiedReport);
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

        <h1 className="text-3xl font-bold mb-2">Medical Report Simplifier</h1>
        <p className="text-muted-foreground mb-6">
          Upload your lab report and get it explained in simple language
        </p>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              Language Preference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={language} onValueChange={setLanguage}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="english" id="english" />
                <Label htmlFor="english">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hindi" id="hindi" />
                <Label htmlFor="hindi">Hindi</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Upload or Paste Report
            </CardTitle>
            <CardDescription>
              Upload your medical report or paste the text directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/40 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Text or PDF files only
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Label>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or paste text</span>
              </div>
            </div>

            <Textarea
              placeholder="Paste your medical report text here..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={8}
            />

            <Button
              onClick={handleSimplify}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Simplifying..." : "Simplify Report"}
            </Button>

            {simplifiedReport && (
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Simplified Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {simplifiedReport}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
