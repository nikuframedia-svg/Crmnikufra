import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveProfileId } from '../lib/devFallback';
import type { Task } from '../types/crm';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async (filters?: { month?: number; year?: number; assignee_profile_id?: string }) => {
    try {
      setLoading(true);
      let query = supabase.from('tasks').select('*');

      if (filters?.month !== undefined && filters?.year !== undefined) {
        const startDate = new Date(filters.year, filters.month, 1).toISOString();
        const endDate = new Date(filters.year, filters.month + 1, 0).toISOString();
        query = query.gte('due_date', startDate).lte('due_date', endDate);
      }

      if (filters?.assignee_profile_id) {
        query = query.eq('assigned_to', filters.assignee_profile_id);
      }

      const { data, error: fetchError } = await query.order('due_date', { ascending: true });

      if (fetchError) throw fetchError;
      setTasks(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const userId = await getEffectiveProfileId();

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project_id: task.project_id,
          lead_id: task.lead_id,
          assigned_to: task.assignee_profile_id,
          due_date: task.date ? new Date(task.date).toISOString() : null,
          created_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Create activity if task is associated with lead or project
      if (task.lead_id || task.project_id) {
        try {
          const { supabase: supabaseClient } = await import('../lib/supabase');
          await supabaseClient.from('entity_activities').insert({
            entity_type: task.lead_id ? 'lead' : 'project',
            entity_id: task.lead_id || task.project_id!,
            type: 'task_created',
            author_profile_id: userId,
            metadata: { task_id: data.id, task_title: task.title },
          });
        } catch (activityError) {
          console.warn('Failed to create activity for task:', activityError);
        }
      }
      
      await fetchTasks();
      return data;
    } catch (err: any) {
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'done') {
        updates.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchTasks();
    } catch (err: any) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTaskStatus,
    deleteTask,
    fetchTasks,
    refetch: fetchTasks,
  };
}
