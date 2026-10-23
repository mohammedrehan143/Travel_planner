import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizePhoneNumber } from '../lib/phone';
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

  const signInWithEmail = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
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

    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    return error ? { error: error.message } : {};
  };

  const signUpWithDetails = async ({ fullName, phone, email, password, termsAccepted }: SignUpPayload) => {
    const rawPhone = phone?.trim() ?? '';
    const formattedPhone = rawPhone ? normalizePhoneNumber(rawPhone) : '';
    if (rawPhone && !formattedPhone) {
      return { error: 'Enter the full phone number with its country code, starting with +.' };
    }

    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const customProfile: UserProfile = {
        id: `demo-${Date.now()}`,
        email: email.trim().toLowerCase(),
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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          ...(formattedPhone ? { phone: formattedPhone, mobile_number: formattedPhone } : {}),
          terms_accepted: termsAccepted,
        },
      },
    });

    if (error) return { error: error.message };

    if (!data.user) {
      return { error: 'Supabase did not return a new user. Please check your registration settings and try again.' };
    }

    // Email confirmation may be enabled, in which case Supabase creates the auth
    // user without issuing a session. The database trigger creates the profile;
    // an unauthenticated browser request cannot safely write it under RLS.
    if (!data.session) {
      return {
        message: 'Check your email for a confirmation link before signing in.',
      };
    }

    // With an authenticated session, RLS permits the user to create/update only
    // their own profile. Do not hide failures or retry with a reduced row: callers
    // need to know when the schema or profile sync migration is missing.
    const { data: savedProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        ...(formattedPhone ? { phone: formattedPhone, mobile_number: formattedPhone } : {}),
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        terms_accepted: termsAccepted,
        terms_accepted_at: new Date().toISOString(),
        preferred_currency: 'INR',
      })
      .select('*')
      .single();

    if (profileError || !savedProfile) {
      const detail = profileError?.message ?? 'No profile row was returned.';
      return {
        error: `Your account was created, but its profile could not be saved: ${detail}. Check that the Supabase profile sync migration has been applied.`,
      };
    }

    setSession(data.session);
    setUser(data.user);
    setProfile(savedProfile as UserProfile);
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
