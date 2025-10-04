import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const [role, setRole] = useState<'doctor' | 'patient' | 'pharmacy' | 'admin'>('patient');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check if user is admin first
          const { data: adminRole } = await (supabase as any)
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .single();

          if (adminRole) {
            setIsAdmin(true);
            setRole('admin');
            setLoading(false);
            return;
          }

          // Otherwise, fetch from profiles table for doctor/patient/pharmacy
          const { data: profileData } = await (supabase as any)
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileData?.role) {
            setRole(profileData.role);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, loading, isAdmin };
};
