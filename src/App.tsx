import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import BookAppointment from "./pages/BookAppointment";
import Prescriptions from "./pages/Prescriptions";
import SymptomChecker from "./pages/SymptomChecker";
import ReportSimplifier from "./pages/ReportSimplifier";
import MedicineReminder from "./pages/MedicineReminder";
import PrescriptionAssistant from "./pages/PrescriptionAssistant";
import PatientChatbot from "./pages/PatientChatbot";
import VoiceNotes from "./pages/VoiceNotes";
import Analytics from "./pages/Analytics";
import Appointments from "./pages/Appointments";
import Schedules from "./pages/Schedules";
import DoctorRegistration from "./pages/DoctorRegistration";
import SmartDoctorMatch from "./pages/SmartDoctorMatch";
import AIAssistant from "./pages/AIAssistant";
import Records from "./pages/Records";
import Profile from "./pages/Profile";
import HealthFeed from "./pages/HealthFeed";
import HealthRecordShare from "./pages/HealthRecordShare";
import ScanHealthRecord from "./pages/ScanHealthRecord";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/pharmacy-dashboard" element={<PharmacyDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
          <Route path="/report-simplifier" element={<ReportSimplifier />} />
          <Route path="/medicine-reminder" element={<MedicineReminder />} />
          <Route path="/prescription-assistant" element={<PrescriptionAssistant />} />
          <Route path="/patient-chatbot" element={<PatientChatbot />} />
          <Route path="/voice-notes" element={<VoiceNotes />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/doctor-registration" element={<DoctorRegistration />} />
          <Route path="/smart-doctor-match" element={<SmartDoctorMatch />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/records" element={<Records />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/health-feed" element={<HealthFeed />} />
          <Route path="/health-record-share" element={<HealthRecordShare />} />
          <Route path="/scan-health-record" element={<ScanHealthRecord />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
