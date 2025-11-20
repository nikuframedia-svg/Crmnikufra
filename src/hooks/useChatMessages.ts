import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveProfileId } from '../lib/devFallback';
import type { ChatMessage } from '../types/crm';

export function useChatMessages(channelId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listMessages = async (channelIdParam?: string) => {
    const targetChannelId = channelIdParam || channelId;
    if (!targetChannelId) {
      setMessages([]);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', targetChannelId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setMessages(data || []);
      setError(null);
      return data || [];
    } catch (err: any) {
      console.error('Error fetching chat messages:', err);
      setError(err.message || 'Failed to load messages');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (channelIdParam: string, content: string) => {
    const authorId = await getEffectiveProfileId();
    try {
      const { data, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelIdParam,
          author_profile_id: authorId,
          content: content.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state immediately for optimistic UI
      if (data) {
        setMessages((prev) => [...prev, data]);
      }

      return data;
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  // Fetch messages when channelId changes
  useEffect(() => {
    if (channelId) {
      listMessages();
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [channelId]);

  // Subscribe to new messages via Realtime
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  return {
    messages,
    loading,
    error,
    listMessages,
    sendMessage,
    refetch: () => listMessages(),
  };
}

