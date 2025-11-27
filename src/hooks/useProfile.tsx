import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  full_name: string;
  position: string;
  department: string | null;
  avatar_url: string | null;
  email?: string;
}

interface UserRole {
  role: "COLABORADOR" | "GESTOR" | "ADMIN";
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfile({
          ...profileData,
          email: user.email,
        });

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesError) throw rolesError;

        const userRoles = rolesData?.map((r: UserRole) => r.role) || [];
        setRoles(userRoles);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const isAdmin = roles.includes("ADMIN");
  const isGestor = roles.includes("GESTOR");
  const isColaborador = roles.includes("COLABORADOR");

  const canCreateAgreements = isAdmin || isGestor;

  return {
    profile,
    roles,
    loading,
    isAdmin,
    isGestor,
    isColaborador,
    canCreateAgreements,
  };
}
