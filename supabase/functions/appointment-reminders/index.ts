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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for appointments to remind...");

    // Get current time and 24 hours from now
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Fetch appointments scheduled between 24-25 hours from now
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        status,
        type,
        doctors!appointments_doctor_id_fkey (
          clinic_name,
          clinic_address,
          specialization,
          profiles:user_id (full_name)
        ),
        patients!appointments_patient_id_fkey (
          profiles:user_id (full_name, email)
        )
      `)
      .eq("status", "scheduled")
      .gte("appointment_date", twentyFourHoursFromNow.toISOString())
      .lte("appointment_date", twentyFiveHoursFromNow.toISOString());

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    console.log(`Found ${appointments?.length || 0} appointments to remind`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No appointments to remind", count: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send reminders
    const results = await Promise.allSettled(
      appointments.map(async (appointment) => {
        const patientEmail = (appointment.patients as any)?.profiles?.email;
        const patientName = (appointment.patients as any)?.profiles?.full_name || "Patient";
        const doctorName = (appointment.doctors as any)?.profiles?.full_name || "Doctor";

        if (!patientEmail) {
          console.log(`No email found for appointment ${appointment.id}`);
          return { success: false, appointmentId: appointment.id };
        }

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

        const emailResponse = await resend.emails.send({
          from: "AI Health Connect <onboarding@resend.dev>",
          to: [patientEmail],
          subject: "Appointment Reminder - Tomorrow",
          html: `
            <h2>Appointment Reminder</h2>
            <p>Dear ${patientName},</p>
            <p>This is a friendly reminder about your upcoming appointment:</p>
            <ul>
              <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
              <li><strong>Specialization:</strong> ${(appointment.doctors as any).specialization}</li>
              <li><strong>Date & Time:</strong> ${formatDate(appointment.appointment_date)}</li>
              <li><strong>Type:</strong> ${appointment.type === "teleconsult" ? "Teleconsultation" : "In-Clinic Visit"}</li>
              ${appointment.type === "in-clinic" ? `<li><strong>Location:</strong> ${(appointment.doctors as any).clinic_name}, ${(appointment.doctors as any).clinic_address}</li>` : ""}
            </ul>
            <p>Please make sure to arrive 10 minutes early if it's an in-clinic visit.</p>
            <p>If you need to cancel or reschedule, please do so through the app.</p>
            <br/>
            <p>Best regards,<br/>AI Health Connect Team</p>
          `,
        });

        console.log(`Reminder sent for appointment ${appointment.id}`);
        return { success: true, appointmentId: appointment.id, emailResponse };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Reminders sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        total: appointments.length,
        successful,
        failed,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in appointment-reminders:", error);
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
