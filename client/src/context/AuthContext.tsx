import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AppRole = "student" | "parent" | "teacher" | "admin" | "super_admin" | "support";
export type AccountStatus = "active" | "suspended" | "deactivated";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  account_status: AccountStatus;
  avatar_url: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,account_status,avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // A teacher may have an approved teacher profile while the base profile still
  // carries an older role (for example, from when the account was first created).
  // Infer the teacher role only for non-admin accounts with an approved profile.
  if (!["teacher", "admin", "super_admin", "support"].includes(data.role)) {
    const { data: teacherProfile, error: teacherError } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("id", userId)
      .eq("verification_status", "approved")
      .maybeSingle();
    if (teacherError) throw teacherError;
    if (teacherProfile) return { ...data, role: "teacher" } as Profile;
  }

  return data as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const currentUser = (await supabase.auth.getUser()).data.user;
    setUser(currentUser);
    setProfile(currentUser ? await fetchProfile(currentUser.id) : null);
  };

  useEffect(() => {
    let mounted = true;

    // Keep this callback synchronous. Supabase warns against awaiting Supabase
    // requests inside onAuthStateChange because it can block subsequent auth work.
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Load the profile outside the auth listener so profile queries cannot block
  // Supabase's auth lock. Ignore stale results if the user changes or unmounts.
  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    fetchProfile(user.id)
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load the signed-in user's profile:", error);
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    profile,
    loading,
    refreshProfile,
    signOut: async () => { await supabase.auth.signOut(); },
  }), [session, user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
