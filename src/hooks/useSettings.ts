import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (fetchError) throw fetchError;
      setSettings(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error: updateError } = await supabase
        .from('settings')
        .update({ value })
        .eq('key', key);

      if (updateError) throw updateError;
      await fetchSettings();
    } catch (err: any) {
      console.error('Error updating setting:', err);
      throw err;
    }
  };

  const getSetting = (key: string, defaultValue: string = ''): string => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value || defaultValue;
  };

  const getSettingAsNumber = (key: string, defaultValue: number = 0): number => {
    const value = getSetting(key, defaultValue.toString());
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  return {
    settings,
    loading,
    error,
    updateSetting,
    getSetting,
    getSettingAsNumber,
    refetch: fetchSettings,
  };
}

