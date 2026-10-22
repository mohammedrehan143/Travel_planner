import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

export interface SignUpPayload {
  fullName: string;
  phone: string;
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
  signInWithDemo: (role?: 'alice' | 'bob') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signUpWithDetails: (payload: SignUpPayload) => Promise<{ error?: string }>;
  signInWithPhoneOrEmail: (identifier: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEMO_PROFILES: Record<string, UserProfile> = {
  alice: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'alice@trippilot.test',
    phone: '+919876543210',
    mobile_number: '+919876543210',
    full_name: 'Alice Wanderlust',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    preferred_currency: 'INR',
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  bob: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'bob@trippilot.test',
    phone: '+919876543211',
    mobile_number: '+919876543211',
    full_name: 'Bob Adventurer',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    preferred_currency: 'INR',
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  useEffect(() => {
    // Check if stored demo user exists
    const storedDemoUser = localStorage.getItem('trippilot_demo_user');
    if (storedDemoUser && DEMO_PROFILES[storedDemoUser]) {
      const demoProfile = DEMO_PROFILES[storedDemoUser];
      setProfile(demoProfile);
      setUser({
        id: demoProfile.id,
        email: demoProfile.email,
        phone: demoProfile.phone,
        app_metadata: {},
        user_metadata: { full_name: demoProfile.full_name, phone: demoProfile.phone },
        aud: 'authenticated',
        created_at: demoProfile.created_at,
      } as unknown as User);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Default auto-login to Alice for instant smooth testing
      const defaultProfile = DEMO_PROFILES.alice;
      setProfile(defaultProfile);
      setUser({
        id: defaultProfile.id,
        email: defaultProfile.email,
        phone: defaultProfile.phone,
        app_metadata: {},
        user_metadata: { full_name: defaultProfile.full_name, phone: defaultProfile.phone },
        aud: 'authenticated',
        created_at: defaultProfile.created_at,
      } as unknown as User);
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

  const signInWithDemo = async (role: 'alice' | 'bob' = 'alice') => {
    setLoading(true);
    const demoProfile = DEMO_PROFILES[role];
    localStorage.setItem('trippilot_demo_user', role);
    setProfile(demoProfile);
    setUser({
      id: demoProfile.id,
      email: demoProfile.email,
      phone: demoProfile.phone,
      app_metadata: {},
      user_metadata: { full_name: demoProfile.full_name, phone: demoProfile.phone },
      aud: 'authenticated',
      created_at: demoProfile.created_at,
    } as unknown as User);
    setIsDemoMode(true);
    setLoading(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    return signInWithPhoneOrEmail(email, password);
  };

  const signInWithPhoneOrEmail = async (identifier: string, password: string) => {
    const cleanId = identifier.trim();
    if (!isSupabaseConfigured) {
      // Find matching demo or default to Alice
      const matched = Object.values(DEMO_PROFILES).find(
        (p) => p.email.toLowerCase() === cleanId.toLowerCase() || p.phone === cleanId || p.mobile_number === cleanId
      );
      if (matched) {
        const key = matched.full_name?.includes('Bob') ? 'bob' : 'alice';
        await signInWithDemo(key as any);
      } else {
        // Create custom demo user on the fly
        const customProfile: UserProfile = {
          id: `demo-${Date.now()}`,
          email: cleanId.includes('@') ? cleanId : `${cleanId.replace(/\D/g, '')}@phone.trippilot.test`,
          phone: cleanId.includes('@') ? '+919876543210' : cleanId,
          mobile_number: cleanId.includes('@') ? '+919876543210' : cleanId,
          full_name: 'Traveler',
          preferred_currency: 'INR',
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(customProfile);
        setUser({
          id: customProfile.id,
          email: customProfile.email,
          phone: customProfile.phone,
          app_metadata: {},
          user_metadata: { full_name: customProfile.full_name, phone: customProfile.phone },
          aud: 'authenticated',
          created_at: customProfile.created_at,
        } as unknown as User);
        setIsDemoMode(true);
      }
      return {};
    }

    // Supabase auth: Check if identifier is phone number
    const isPhone = !cleanId.includes('@') && /^\+?[0-9\s-]{7,15}$/.test(cleanId);
    let authEmail = cleanId;

    if (isPhone) {
      // Lookup profile email for this phone if using email auth, or sign in with phone
      const formattedPhone = cleanId.startsWith('+') ? cleanId.replace(/\s+/g, '') : `+91${cleanId.replace(/\D/g, '')}`;
      const { data: profileMatch } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (profileMatch?.email) {
        authEmail = profileMatch.email;
      } else {
        // Attempt native Supabase phone login
        const { error: phoneErr } = await supabase.auth.signInWithPassword({
          phone: formattedPhone,
          password,
        });
        if (phoneErr) return { error: phoneErr.message };
        return {};
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    return signUpWithDetails({
      fullName,
      phone: '+919876543210',
      email,
      password,
      termsAccepted: true,
    });
  };

  const signUpWithDetails = async ({ fullName, phone, email, password, termsAccepted }: SignUpPayload) => {
    const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+91${phone.replace(/\D/g, '')}`;

    if (!isSupabaseConfigured) {
      const customProfile: UserProfile = {
        id: `demo-${Date.now()}`,
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        mobile_number: formattedPhone,
        full_name: fullName.trim(),
        preferred_currency: 'INR',
        terms_accepted: termsAccepted,
        terms_accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(customProfile);
      setUser({
        id: customProfile.id,
        email: customProfile.email,
        phone: customProfile.phone,
        app_metadata: {},
        user_metadata: { full_name: customProfile.full_name, phone: customProfile.phone, terms_accepted: termsAccepted },
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
          phone: formattedPhone,
          mobile_number: formattedPhone,
          terms_accepted: termsAccepted,
        },
      },
    });

    if (error) return { error: error.message };

    // Direct upsert to ensure profile row with phone is established immediately
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        phone: formattedPhone,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        terms_accepted: termsAccepted,
        terms_accepted_at: new Date().toISOString(),
        preferred_currency: 'INR',
      });
    }

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
        signUpWithEmail,
        signUpWithDetails,
        signInWithPhoneOrEmail,
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
