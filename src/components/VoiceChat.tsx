import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder } from "@/utils/audioRecorder";

interface VoiceChatProps {
  systemPrompt: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

export default function VoiceChat({ systemPrompt, onTranscript, onResponse }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  
  const { toast } = useToast();
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    audioRef.current = new Audio();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      await recorderRef.current?.startRecording();
      setIsRecording(true);
      setTranscript("");
      setResponse("");
      
      toast({
        title: "Recording started",
        description: "Speak now...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecordingAndProcess = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Stop recording and get audio
      const audioBase64 = await recorderRef.current?.stopRecording();
      
      if (!audioBase64) {
        throw new Error("No audio data");
      }

      // Step 1: Convert speech to text
      console.log("Converting speech to text...");
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke(
        'voice-to-text',
        { body: { audio: audioBase64 } }
      );

      if (transcriptionError) throw transcriptionError;
      
      const userText = transcriptionData.text;
      setTranscript(userText);
      onTranscript?.(userText);
      
      console.log("Transcription:", userText);

      // Step 2: Get AI response
      console.log("Getting AI response...");
      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        'symptom-checker',
        { 
          body: { 
            message: userText,
            systemPrompt 
          } 
        }
      );

      if (aiError) throw aiError;
      
      const aiText = aiData.response;
      setResponse(aiText);
      onResponse?.(aiText);
      
      console.log("AI Response:", aiText);

      // Step 3: Convert AI response to speech
      console.log("Converting response to speech...");
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke(
        'text-to-speech',
        { 
          body: { 
            text: aiText,
            voice: 'nova' 
          } 
        }
      );

      if (ttsError) throw ttsError;

      // Step 4: Play the audio
      setIsSpeaking(true);
      const audioBlob = base64ToBlob(ttsData.audioContent, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }

      toast({
        title: "Voice response ready",
        description: "Playing AI response...",
      });

    } catch (error) {
      console.error("Error processing voice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process voice",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            {isProcessing && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-2 text-primary">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span>Speaking...</span>
              </div>
            )}
            {isRecording && !isProcessing && (
              <div className="flex items-center gap-2 text-red-500">
                <Mic className="w-5 h-5 animate-pulse" />
                <span>Recording...</span>
              </div>
            )}
          </div>

          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="rounded-full w-20 h-20"
            onClick={isRecording ? stopRecordingAndProcess : startRecording}
            disabled={isProcessing || isSpeaking}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            {isRecording ? "Tap to stop and send" : "Tap to start recording"}
          </p>
        </div>

        {transcript && (
          <div className="space-y-2">
            <p className="text-sm font-medium">You said:</p>
            <p className="text-sm bg-muted p-3 rounded-lg">{transcript}</p>
          </div>
        )}

        {response && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Response:</p>
            <p className="text-sm bg-primary/10 p-3 rounded-lg">{response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
