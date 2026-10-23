import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizePhoneNumber, looksLikePhoneNumber } from '../lib/phone';

const API_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_BACKEND_API_URL ||
  'http://localhost:5000'
).replace(/\/api\/?$/, '').replace(/\/+$/, '').trim();
import { UserProfile } from '../types';

export interface SignUpPayload {
  fullName: string;
  phone?: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithDemo: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithDetails: (payload: SignUpPayload) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
}

const createDemoProfile = (): UserProfile => {
  const now = new Date().toISOString();
  return {
    id: 'demo-local-user',
    email: '',
    preferred_currency: 'INR',
    terms_accepted: true,
    terms_accepted_at: now,
    created_at: now,
    updated_at: now,
  };
};

const createDemoUser = (profile: UserProfile): User => ({
  id: profile.id,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: profile.created_at,
} as unknown as User);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  useEffect(() => {
    // Keep a local development session when the user explicitly chose the demo,
    // or when this workspace has no Supabase configuration.
    const storedDemoUser = localStorage.getItem('trippilot_demo_user');
    if (storedDemoUser || !isSupabaseConfigured) {
      const demoProfile = createDemoProfile();
      setProfile(demoProfile);
      setUser(createDemoUser(demoProfile));
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    // Real Supabase session check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsDemoMode(false);
        fetchProfile(currentSession.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsDemoMode(false);
        fetchProfile(currentSession.user.id);
        if (_event === 'SIGNED_IN') {
          const nowIso = new Date().toISOString();
          supabase.from('profiles').update({ last_login_at: nowIso, updated_at: nowIso }).eq('id', currentSession.user.id).then();
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as UserProfile);
      }
    } catch (e) {
      console.warn('Could not fetch Supabase profile:', e);
    }
  };

  const signInWithDemo = async () => {
    setLoading(true);
    const demoProfile = createDemoProfile();
    localStorage.setItem('trippilot_demo_user', 'true');
    setProfile(demoProfile);
    setUser(createDemoUser(demoProfile));
    setIsDemoMode(true);
    setLoading(false);
  };

  const signInWithEmail = async (identifier: string, password: string) => {
    let cleanIdentifier = identifier.trim();

    // If identifier is a phone number, look up corresponding email via backend lookup
    if (looksLikePhoneNumber(cleanIdentifier) && !cleanIdentifier.includes('@')) {
      try {
        const resp = await fetch(`${API_URL}/api/auth/lookup-identifier`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanIdentifier }),
        });
        if (resp.ok) {
          const json = await resp.json();
          if (json.email) {
            cleanIdentifier = json.email;
          }
        }
      } catch (e) {
        console.warn('Lookup identifier failed:', e);
      }
    }

    const cleanEmail = cleanIdentifier.toLowerCase();

    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const demoProfile: UserProfile = {
        id: `demo-${Date.now()}`,
        email: cleanEmail,
        preferred_currency: 'INR',
        terms_accepted: true,
        terms_accepted_at: now,
        created_at: now,
        updated_at: now,
      };
      setProfile(demoProfile);
      setUser({
        id: demoProfile.id,
        email: demoProfile.email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: demoProfile.created_at,
      } as unknown as User);
      setIsDemoMode(true);
      setLoading(false);
      return {};
    }

    let { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    // If user is unconfirmed, auto-confirm via backend and retry login immediately
    if (error && (error.message.includes('Email not confirmed') || (error as any).code === 'email_not_confirmed')) {
      try {
        const confirmRes = await fetch(`${API_URL}/api/auth/confirm-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        if (confirmRes.ok) {
          const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          data = retry.data;
          error = retry.error;
        }
      } catch (confirmErr) {
        console.warn('Auto-confirm retry failed:', confirmErr);
      }
    }

    if (!error && data?.user) {
      localStorage.removeItem('trippilot_demo_user');
      setUser(data.user);
      setSession(data.session);
      setIsDemoMode(false);
      const nowIso = new Date().toISOString();
      supabase.from('profiles').update({ last_login_at: nowIso, updated_at: nowIso }).eq('id', data.user.id).then();
      await fetchProfile(data.user.id);
    }
    return error ? { error: error.message } : {};
  };

  const signUpWithDetails = async ({ fullName, phone, email, password, termsAccepted }: SignUpPayload) => {
    const rawPhone = phone?.trim() ?? '';
    const formattedPhone = rawPhone ? normalizePhoneNumber(rawPhone) : '';
    if (rawPhone && !formattedPhone) {
      return { error: 'Please enter a valid 10-digit mobile number or standard international format (+91...).' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try server-side registration with auto-confirmation and profile creation first
    try {
      const resp = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          fullName: fullName.trim(),
          phone: formattedPhone || undefined,
          termsAccepted,
        }),
      });

      if (resp.ok) {
        // User created and auto-confirmed in Supabase! Sign in immediately to acquire JWT session
        const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!signinErr && signinData?.user) {
          localStorage.removeItem('trippilot_demo_user');
          setUser(signinData.user);
          setSession(signinData.session);
          setIsDemoMode(false);
          const nowIso = new Date().toISOString();
          supabase.from('profiles').update({ last_login_at: nowIso, updated_at: nowIso }).eq('id', signinData.user.id).then();
          await fetchProfile(signinData.user.id);
          return {};
        }
      }
    } catch (apiErr) {
      console.warn('Backend registration failed, using direct client sign up:', apiErr);
    }

    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const customProfile: UserProfile = {
        id: `demo-${Date.now()}`,
        email: cleanEmail,
        ...(formattedPhone ? { phone: formattedPhone, mobile_number: formattedPhone } : {}),
        full_name: fullName.trim(),
        preferred_currency: 'INR',
        terms_accepted: termsAccepted,
        terms_accepted_at: now,
        created_at: now,
        updated_at: now,
      };
      setProfile(customProfile);
      setUser({
        id: customProfile.id,
        email: customProfile.email,
        phone: customProfile.phone,
        app_metadata: {},
        user_metadata: {
          full_name: customProfile.full_name,
          phone: customProfile.phone,
          terms_accepted: termsAccepted,
        },
        aud: 'authenticated',
        created_at: customProfile.created_at,
      } as unknown as User);
      setIsDemoMode(true);
      return {};
    }

    // 2. Direct client sign up
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          ...(formattedPhone ? { phone: formattedPhone, mobile_number: formattedPhone } : {}),
          terms_accepted: termsAccepted,
        },
      },
    });

    if (error) {
      if (error.message.includes('Database error') || error.message.includes('unexpected_failure')) {
        return {
          error: 'Supabase Database Error: The auth trigger requires missing schema columns. Please run the script in supabase/QUICK_FIX.sql in your Supabase SQL editor.'
        };
      }
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Supabase did not return a new user. Please check your registration settings and try again.' };
    }

    // Auto-confirm via backend if no immediate session
    if (!data.session) {
      try {
        const confirmRes = await fetch(`${API_URL}/api/auth/confirm-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        if (confirmRes.ok) {
          const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (retry.data?.user) {
            localStorage.removeItem('trippilot_demo_user');
            setUser(retry.data.user);
            setSession(retry.data.session);
            setIsDemoMode(false);
            await fetchProfile(retry.data.user.id);
            return {};
          }
        }
      } catch (e) {}

      return {
        message: 'Account created! If confirmation is required, please check your email.',
      };
    }

    localStorage.removeItem('trippilot_demo_user');

    // Create/update profile row under authenticated session
    const { data: savedProfile } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        ...(formattedPhone ? { phone: formattedPhone, mobile_number: formattedPhone } : {}),
        email: cleanEmail,
        full_name: fullName.trim(),
        terms_accepted: termsAccepted,
        terms_accepted_at: new Date().toISOString(),
        preferred_currency: 'INR',
      })
      .select('*')
      .single();

    setSession(data.session);
    setUser(data.user);
    if (savedProfile) setProfile(savedProfile as UserProfile);
    setIsDemoMode(false);
    return {};
  };

  const signOut = async () => {
    localStorage.removeItem('trippilot_demo_user');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isDemoMode,
        signInWithDemo,
        signInWithEmail,
        signUpWithDetails,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
