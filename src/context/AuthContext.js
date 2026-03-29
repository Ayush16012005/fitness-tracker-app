'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();

// Demo user for when Supabase is not configured
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@fittrack.app',
};

const DEMO_PROFILE = {
  id: 'demo-user-id',
  full_name: 'Demo User',
  height_cm: 175,
  weight_kg: 78,
  fitness_goal: 'build_muscle',
  units: 'metric',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured) {
      setProfile(DEMO_PROFILE);
      return;
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode — auto-login
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session error:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          // Avoid awaiting Supabase calls inside the auth listener. It can stall
          // sign-in/sign-out flows because the callback is expected to stay sync.
          void fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Set env vars to enable authentication.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        updated_at: new Date().toISOString()
      });
    }
    return data;
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Set env vars to enable authentication.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithProvider = async (provider) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Set env vars to enable authentication.');
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      // In demo mode, just redirect
      window.location.href = '/';
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!isSupabaseConfigured) {
      setProfile((prev) => ({ ...prev, ...updates }));
      return { ...profile, ...updates };
    }
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signInWithProvider,
      signOut,
      updateProfile,
      fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
