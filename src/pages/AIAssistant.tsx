import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, Stethoscope, Pill, MessageSquare, Mic } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
const allAiFeatures = [{
  title: "Symptom Checker",
  description: "Analyze your symptoms with AI-powered assessment",
  icon: Stethoscope,
  path: "/symptom-checker",
  color: "text-blue-600",
  bgColor: "bg-blue-50 dark:bg-blue-950/20",
  allowedRoles: ['patient', 'doctor', 'pharmacy', 'admin']
}, {
  title: "Report Simplifier",
  description: "Get medical reports explained in simple terms",
  icon: FileText,
  path: "/report-simplifier",
  color: "text-green-600",
  bgColor: "bg-green-50 dark:bg-green-950/20",
  allowedRoles: ['patient', 'doctor', 'pharmacy', 'admin']
}, {
  title: "Medicine Reminder",
  description: "Set intelligent medication reminders",
  icon: Pill,
  path: "/medicine-reminder",
  color: "text-purple-600",
  bgColor: "bg-purple-50 dark:bg-purple-950/20",
  allowedRoles: ['patient', 'doctor', 'pharmacy', 'admin']
}, {
  title: "Patient Chatbot",
  description: "Get instant answers to your health questions",
  icon: MessageSquare,
  path: "/patient-chatbot",
  color: "text-orange-600",
  bgColor: "bg-orange-50 dark:bg-orange-950/20",
  allowedRoles: ['patient', 'doctor', 'pharmacy', 'admin']
}, {
  title: "Voice Notes",
  description: "Convert voice notes to structured medical records",
  icon: Mic,
  path: "/voice-notes",
  color: "text-pink-600",
  bgColor: "bg-pink-50 dark:bg-pink-950/20",
  allowedRoles: ['doctor', 'admin']
}, {
  title: "Prescription Assistant",
  description: "AI-powered prescription generation for doctors",
  icon: Brain,
  path: "/prescription-assistant",
  color: "text-indigo-600",
  bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  allowedRoles: ['doctor', 'admin']
}];
export default function AIAssistant() {
  const navigate = useNavigate();
  const {
    role
  } = useUserRole();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  // Filter features based on user role
  const aiFeatures = allAiFeatures.filter(feature => 
    feature.allowedRoles.includes(role)
  );

  return <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="AI Assistant" />
      
      <div className="container mx-auto p-4 max-w-6xl my-[50px]">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">AI Health Assistant</h1>
          <p className="text-muted-foreground">
            Powered by advanced AI to help with your healthcare needs
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aiFeatures.map(feature => <Card key={feature.path} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" onClick={() => navigate(feature.path)}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>)}
        </div>

        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              About AI Assistant
            </CardTitle>
            <CardDescription className="text-foreground/80">
              Our AI assistant uses advanced machine learning models to provide personalized 
              health insights and support. All AI suggestions should be reviewed by healthcare 
              professionals before making medical decisions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <MobileBottomNav role={role} />
    </div>;
}