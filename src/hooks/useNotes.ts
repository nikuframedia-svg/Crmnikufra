import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Note, EntityType } from '../types/crm';
import { useActivities } from './useActivities';

export function useNotes(entityType: EntityType, entityId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addActivity } = useActivities(entityType, entityId);

  const fetchNotes = async () => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotes(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const addNote = async (content: string, author_profile_id: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('notes')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          content,
          author_profile_id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Optimistic update
      setNotes((prev) => [data, ...prev]);

      // Create activity for this note
      try {
        await addActivity({
          entity_type: entityType,
          entity_id: entityId,
          type: 'note',
          author_profile_id,
          metadata: { note_id: data.id, content_preview: content.substring(0, 100) },
        });
      } catch (activityError) {
        console.warn('Failed to create activity for note:', activityError);
        // Don't fail the note creation if activity fails
      }

      setError(null);
    } catch (err: any) {
      console.error('Error adding note:', err);
      setError(err.message || 'Failed to add note');
      throw err;
    }
  };

  return {
    notes,
    loading,
    error,
    addNote,
    refetch: fetchNotes,
  };
}

