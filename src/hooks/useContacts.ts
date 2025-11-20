import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveProfileId } from '../lib/devFallback';
import type { Contact } from '../types/crm';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setContacts(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const addContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const creatorId = await getEffectiveProfileId();

      const { data, error: insertError } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          created_by: creatorId,
          owner_id: contact.owner_id || creatorId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchContacts();
      return data;
    } catch (err: any) {
      console.error('Error adding contact:', err);
      throw err;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchContacts();
    } catch (err: any) {
      console.error('Error updating contact:', err);
      throw err;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchContacts();
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      throw err;
    }
  };

  const getContactById = async (id: string): Promise<Contact | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err: any) {
      console.error('Error fetching contact:', err);
      return null;
    }
  };

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    getContactById,
    refetch: fetchContacts,
  };
}
