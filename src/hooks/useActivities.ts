import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Activity, EntityType } from '../types/crm';

export function useActivities(entityType: EntityType, entityId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('entity_activities')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setActivities(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  const addActivity = async (input: Omit<Activity, 'id' | 'created_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id || '00000000-0000-0000-0000-000000000000';

      const { data, error: insertError } = await supabase
        .from('entity_activities')
        .insert({
          ...input,
          author_profile_id: input.author_profile_id || userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Optimistic update
      setActivities((prev) => [data, ...prev]);
      setError(null);
    } catch (err: any) {
      console.error('Error adding activity:', err);
      setError(err.message || 'Failed to add activity');
      throw err;
    }
  };

  return {
    activities,
    loading,
    error,
    addActivity,
    refetch: fetchActivities,
  };
}


