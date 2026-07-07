import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  bio: string | null;
  avatar_url: string | null;
  tags: unknown | null; // JSONB can be various types
  income_pattern: string | null;
  pain_points: string[] | null;
  goals: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  bio?: string | null;
  avatar_url?: string | null;
  tags?: string[] | null;
  income_pattern?: string | null;
  pain_points?: string[] | null;
  goals?: string[] | null;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      return { error: null };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('Not authenticated'), url: null };

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }
      
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image must be less than 2MB');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return { error: null, url: publicUrl };
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
      return { error: error as Error, url: null };
    }
  };

  // Helper to get display name
  const displayName = profile 
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null
    : null;

  return {
    profile,
    loading,
    displayName,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
}
