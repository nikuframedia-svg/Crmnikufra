import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatChannel } from '../types/crm';
import { useProfileAccess } from '../contexts/ProfileAccessContext';

type CreateChannelInput = {
  name: string;
  description?: string;
  isPrivate?: boolean;
  memberIds?: string[];
};

export function useChatChannels() {
  const { profile: accessProfile } = useProfileAccess();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listChannels = async () => {
    try {
      setLoading(true);
      if (!accessProfile?.id) {
        setChannels([]);
        setLoading(false);
        return [];
      }

      const [{ data, error: fetchError }, { data: memberships, error: membershipError }] = await Promise.all([
        supabase.from('chat_channels').select('*').order('name', { ascending: true }),
        supabase.from('chat_channel_members').select('channel_id').eq('profile_id', accessProfile.id),
      ]);

      if (membershipError) throw membershipError;
      if (fetchError) throw fetchError;

      const membershipSet = new Set((memberships || []).map((m) => m.channel_id));
      const filtered = (data || []).filter((channel) => !channel.is_private || membershipSet.has(channel.id));

      setChannels(filtered);
      setError(null);
      return filtered;
    } catch (err: any) {
      console.error('Error fetching chat channels:', err);
      setError(err.message || 'Failed to load channels');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getChannelBySlug = async (slug: string): Promise<ChatChannel | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('chat_channels')
        .eq('slug', slug)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err: any) {
      console.error('Error fetching channel by slug:', err);
      return null;
    }
  };

  useEffect(() => {
    listChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessProfile?.id]);

  const createChannel = async ({ name, description, isPrivate = false, memberIds = [] }: CreateChannelInput) => {
    try {
      if (!accessProfile?.canAccessBackend) {
        throw new Error('Apenas administradores podem criar canais');
      }
      // Generate slug from name
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error: insertError } = await supabase
        .from('chat_channels')
        .insert({
          name,
          slug,
          description: description || null,
          is_private: isPrivate,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (isPrivate && data?.id) {
        const uniqueMembers = new Set(memberIds.filter(Boolean));
        uniqueMembers.add(accessProfile.id);
        const rows = Array.from(uniqueMembers).map((profileId) => ({
          channel_id: data.id,
          profile_id: profileId,
        }));
        if (rows.length > 0) {
          const { error: membersError } = await supabase.from('chat_channel_members').insert(rows);
          if (membersError) throw membersError;
        }
      }

      // Refresh channels list
      await listChannels();
      return data;
    } catch (err: any) {
      console.error('Error creating channel:', err);
      setError(err.message || 'Failed to create channel');
      throw err;
    }
  };

  return {
    channels,
    loading,
    error,
    listChannels,
    getChannelBySlug,
    createChannel,
    refetch: listChannels,
  };
}

