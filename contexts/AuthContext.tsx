import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Role = 'admin' | 'trainer' | 'client';
export type Profile = { id: string; full_name: string | null; phone: string | null; requested_role: string | null; approval_status: 'pending' | 'approved' | 'rejected' | string; rejection_reason: string | null };
type Ctx = { session: Session | null; user: User | null; profile: Profile | null; role: Role | null; loading: boolean; refresh: () => Promise<void>; signOut: () => Promise<void> };

const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Role and approval come from the database (user_roles / profiles); the app never decides them.
  const load = useCallback(async (s: Session | null) => {
    if (!s) { setProfile(null); setRole(null); setLoading(false); return; }
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('id,full_name,phone,requested_role,approval_status,rejection_reason').eq('id', s.user.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', s.user.id).maybeSingle(),
    ]);
    setProfile((p.data as Profile) ?? null);
    setRole((r.data?.role as Role) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); load(data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => load(s), 0); // do not await Supabase calls inside this callback
    });
    return () => subscription.unsubscribe();
  }, [load]);

  const value: Ctx = {
    session, user: session?.user ?? null, profile, role, loading,
    refresh: () => load(session),
    signOut: async () => { await supabase.auth.signOut(); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
