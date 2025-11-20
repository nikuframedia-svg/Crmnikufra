import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveProfileId } from '../lib/devFallback';
import type { DocumentRecord } from '../types/crm';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const addDocument = async (
    document: Omit<DocumentRecord, 'id' | 'created_at' | 'updated_at'>,
    file?: File
  ) => {
    try {
      const userId = await getEffectiveProfileId();

      let storagePath: string | undefined;

      // Upload file to storage if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        storagePath = filePath;
      }

      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          ...document,
          storage_path: storagePath || document.storage_path,
          created_by: userId, // Override if provided
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create activity if document is associated with lead or project
      if (document.lead_id || document.project_id) {
        try {
          await supabase.from('entity_activities').insert({
            entity_type: document.lead_id ? 'lead' : 'project',
            entity_id: document.lead_id || document.project_id!,
            type: 'document_added',
            author_profile_id: userId,
            metadata: { document_id: data.id, document_title: data.title },
          });
        } catch (activityError) {
          console.warn('Failed to create activity for document:', activityError);
          // Don't fail document creation if activity fails
        }
      }

      await fetchDocuments();
      return data;
    } catch (err: any) {
      console.error('Error adding document:', err);
      throw err;
    }
  };

  const getDocumentUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('files').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const deleteDocument = async (id: string) => {
    try {
      const doc = documents.find((d) => d.id === id);
      if (doc?.storage_path) {
        await supabase.storage.from('files').remove([doc.storage_path]);
      }

      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    getDocumentUrl,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
