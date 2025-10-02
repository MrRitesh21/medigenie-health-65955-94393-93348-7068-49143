import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, ArrowLeft, Square, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function VoiceNotes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [structuredNote, setStructuredNote] = useState("");
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        
        const { data, error } = await supabase.functions.invoke("voice-to-text", {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        setTranscript(data.transcript);
        
        // Now structure the transcript
        const { data: structuredData, error: structureError } = await supabase.functions.invoke("structure-notes", {
          body: { transcript: data.transcript },
        });

        if (structureError) throw structureError;

        setStructuredNote(structuredData.structuredNote);
      };
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

        <h1 className="text-3xl font-bold mb-2">Voice Notes to Records</h1>
        <p className="text-muted-foreground mb-6">Record voice notes and convert them to structured medical records</p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Voice Recording
            </CardTitle>
            <CardDescription>
              Click to start recording your medical notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="rounded-full h-24 w-24"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={stopRecording}
                  variant="destructive"
                  className="rounded-full h-24 w-24 animate-pulse"
                >
                  <Square className="w-8 h-8" />
                </Button>
              )}
            </div>

            {isRecording && (
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                Recording... Click stop when finished
              </p>
            )}

            {loading && (
              <p className="text-center text-sm text-muted-foreground">
                Processing audio...
              </p>
            )}
          </CardContent>
        </Card>

        {transcript && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Raw Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={transcript}
                readOnly
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>
        )}

        {structuredNote && (
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Structured Medical Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {structuredNote}
              </div>
              <Button className="w-full mt-4">
                Save to Patient Record
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}