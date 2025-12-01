import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  appointmentId: string;
  action: "cancelled" | "rescheduled" | "status_updated";
  newDate?: string;
  newStatus?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { appointmentId, action, newDate, newStatus }: NotificationRequest = await req.json();

    console.log("Sending notification for appointment:", appointmentId, "action:", action);

    // Fetch appointment details with doctor and patient info
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        status,
        symptoms,
        doctors!appointments_doctor_id_fkey (
          id,
          clinic_name,
          specialization,
          profiles:user_id (full_name, email)
        ),
        patients!appointments_patient_id_fkey (
          id,
          profiles:user_id (full_name, email)
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error("Error fetching appointment:", appointmentError);
      throw new Error("Appointment not found");
    }

    const doctorEmail = (appointment.doctors as any)?.profiles?.email;
    const patientName = (appointment.patients as any)?.profiles?.full_name || "Patient";
    const doctorName = (appointment.doctors as any)?.profiles?.full_name || "Doctor";

    if (!doctorEmail) {
      throw new Error("Doctor email not found");
    }

    let subject = "";
    let htmlContent = "";

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    switch (action) {
      case "cancelled":
        subject = `Appointment Cancelled - ${patientName}`;
        htmlContent = `
          <h2>Appointment Cancelled</h2>
          <p>Dear Dr. ${doctorName},</p>
          <p>An appointment has been <strong>cancelled</strong>:</p>
          <ul>
            <li><strong>Patient:</strong> ${patientName}</li>
            <li><strong>Original Date:</strong> ${formatDate(appointment.appointment_date)}</li>
            <li><strong>Clinic:</strong> ${(appointment.doctors as any).clinic_name}</li>
          </ul>
          <p>The patient has cancelled this appointment.</p>
        `;
        break;

      case "rescheduled":
        subject = `Appointment Rescheduled - ${patientName}`;
        htmlContent = `
          <h2>Appointment Rescheduled</h2>
          <p>Dear Dr. ${doctorName},</p>
          <p>An appointment has been <strong>rescheduled</strong>:</p>
          <ul>
            <li><strong>Patient:</strong> ${patientName}</li>
            <li><strong>Original Date:</strong> ${formatDate(appointment.appointment_date)}</li>
            <li><strong>New Date:</strong> ${newDate ? formatDate(newDate) : "Not specified"}</li>
            <li><strong>Clinic:</strong> ${(appointment.doctors as any).clinic_name}</li>
          </ul>
          <p>Please update your schedule accordingly.</p>
        `;
        break;

      case "status_updated":
        subject = `Appointment Status Updated - ${patientName}`;
        htmlContent = `
          <h2>Appointment Status Updated</h2>
          <p>Dear ${patientName},</p>
          <p>Your appointment status has been updated:</p>
          <ul>
            <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
            <li><strong>Specialization:</strong> ${(appointment.doctors as any).specialization}</li>
            <li><strong>Date:</strong> ${formatDate(appointment.appointment_date)}</li>
            <li><strong>New Status:</strong> <strong>${newStatus || appointment.status}</strong></li>
          </ul>
        `;
        break;
    }

    // Send email
    const emailTo = action === "status_updated" 
      ? (appointment.patients as any)?.profiles?.email || ""
      : doctorEmail;

    if (!emailTo) {
      throw new Error("Recipient email not found");
    }

    const emailResponse = await resend.emails.send({
      from: "AI Health Connect <onboarding@resend.dev>",
      to: [emailTo],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
