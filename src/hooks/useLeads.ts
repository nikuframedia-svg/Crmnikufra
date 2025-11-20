import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveProfileId } from '../lib/devFallback';
import type { Lead, LeadStage } from '../types/crm';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setLeads(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const addLead = async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const creatorId = await getEffectiveProfileId();

      const { data, error: insertError } = await supabase
        .from('leads')
        .insert({
          ...lead,
          created_by: creatorId,
          owner_id: lead.owner_id || creatorId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchLeads();
      return data;
    } catch (err: any) {
      console.error('Error adding lead:', err);
      throw err;
    }
  };

  const updateLeadStatus = async (id: string, stage: LeadStage) => {
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchLeads();
    } catch (err: any) {
      console.error('Error updating lead:', err);
      throw err;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchLeads();
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      throw err;
    }
  };

  const getLeadsByStatus = (stage: LeadStage) => {
    return leads.filter((lead) => lead.stage === stage);
  };

  const getLeadById = async (id: string): Promise<Lead | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err: any) {
      console.error('Error fetching lead:', err);
      return null;
    }
  };

  return {
    leads,
    loading,
    error,
    addLead,
    updateLeadStatus,
    deleteLead,
    getLeadsByStatus,
    getLeadById,
    refetch: fetchLeads,
  };
}
