import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserPrefs {
  user_id: string;
  tone: string;
  emoji: string;
  voice: string;
  nudges: boolean;
  created_at: string;
  updated_at: string;
}

interface PrefsUpdate {
  tone?: string;
  emoji?: string;
  voice?: string;
  nudges?: boolean;
}

export function useUserPrefs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrefs();
    } else {
      setPrefs(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPrefs = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_prefs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPrefs(data);
    } catch (error) {
      console.error('Error fetching user prefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrefs = async (updates: PrefsUpdate) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Check if prefs exist first
      const { data: existingPrefs } = await supabase
        .from('user_prefs')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!existingPrefs) {
        // Insert new prefs
        const { error } = await supabase
          .from('user_prefs')
          .insert({
            user_id: user.id,
            ...updates,
          });
        if (error) throw error;
      } else {
        // Update existing prefs
        const { error } = await supabase
          .from('user_prefs')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        if (error) throw error;
      }

      setPrefs(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Preferences saved',
        description: 'Your preferences have been updated.',
      });

      return { error: null };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences.',
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  return {
    prefs,
    loading,
    updatePrefs,
    refetch: fetchPrefs,
  };
}
