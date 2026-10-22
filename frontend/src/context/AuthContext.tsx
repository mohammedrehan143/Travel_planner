import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithDemo: (role?: 'alice' | 'bob') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEMO_PROFILES: Record<string, UserProfile> = {
  alice: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'alice@trippilot.test',
    full_name: 'Alice Wanderlust',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    preferred_currency: 'USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  bob: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'bob@trippilot.test',
    full_name: 'Bob Adventurer',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    preferred_currency: 'USD',
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
        app_metadata: {},
        user_metadata: { full_name: demoProfile.full_name },
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
        app_metadata: {},
        user_metadata: { full_name: defaultProfile.full_name },
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
      app_metadata: {},
      user_metadata: { full_name: demoProfile.full_name },
      aud: 'authenticated',
      created_at: demoProfile.created_at,
    } as unknown as User);
    setIsDemoMode(true);
    setLoading(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      await signInWithDemo('alice');
      return {};
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      await signInWithDemo('alice');
      return {};
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) return { error: error.message };
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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
