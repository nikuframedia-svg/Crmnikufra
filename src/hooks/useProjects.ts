import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveProfileId } from '../lib/devFallback';
import type { Project, UUID } from '../types/crm';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'> & { created_by?: UUID }) => {
    try {
      const creatorId = await getEffectiveProfileId();

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_by: project.created_by || creatorId,
          owner_id: project.owner_id || creatorId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchProjects();
      return data;
    } catch (err: any) {
      console.error('Error adding project:', err);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchProjects();
    } catch (err: any) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchProjects();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  const getProjectById = async (id: string): Promise<Project | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err: any) {
      console.error('Error fetching project:', err);
      return null;
    }
  };

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    refetch: fetchProjects,
  };
}
