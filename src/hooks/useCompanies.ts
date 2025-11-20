import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveProfileId } from '../lib/devFallback';
import type { Company } from '../types/crm';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCompanies(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const addCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const creatorId = await getEffectiveProfileId();

      const { data, error: insertError } = await supabase
        .from('companies')
        .insert({
          ...company,
          created_by: creatorId,
          owner_id: company.owner_id || creatorId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchCompanies();
      return data;
    } catch (err: any) {
      console.error('Error adding company:', err);
      throw err;
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchCompanies();
    } catch (err: any) {
      console.error('Error updating company:', err);
      throw err;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchCompanies();
    } catch (err: any) {
      console.error('Error deleting company:', err);
      throw err;
    }
  };

  const getCompanyById = async (id: string): Promise<Company | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err: any) {
      console.error('Error fetching company:', err);
      return null;
    }
  };

  return {
    companies,
    loading,
    error,
    addCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    refetch: fetchCompanies,
  };
}
