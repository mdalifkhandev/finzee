import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { callFunction } from '../services/api';
import { CONFIG } from '../constants/config';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await callFunction('auth-signup', {
        method: 'POST',
        body: {
          email,
          password,
          full_name: fullName,
        },
      });
      return { data };
    } catch (error: any) {
      return { error: error?.message ? String(error.message) : 'Failed to sign up' };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) return { error: `${error.message} | STATUS: ${error.status} | CODE: ${error.code}` };
    return { data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectTo =
        Platform.OS === 'web'
          ? `${CONFIG.WEB_APP_URL.replace(/\/$/, '')}/reset-password`
          : 'finzeeai://reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) return { error: error.message };
      return { data: true };
    } catch (error: any) {
      return { error: error?.message ? String(error.message) : 'Failed to send reset link' };
    }
  };

  return { user, loading, signUp, signIn, signOut, resetPassword };
}
