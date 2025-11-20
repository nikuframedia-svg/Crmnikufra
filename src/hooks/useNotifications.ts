import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types/crm';

export function useNotifications(userProfileId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!userProfileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_profile_id', userProfileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const notificationsData = data || [];
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter((n) => n.read_at === null).length);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time updates
    if (userProfileId) {
      const channel = supabase
        .channel(`notifications:${userProfileId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_profile_id=eq.${userProfileId}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfileId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_profile_id', userProfileId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!userProfileId) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_profile_id', userProfileId)
        .is('read_at', null);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.read_at === null ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

/**
 * Helper function to create a notification
 * This can be called from anywhere in the app to create notifications
 */
export async function createNotification(input: {
  user_profile_id: string;
  type: Notification['type'];
  message: string;
  entity_type: Notification['entity_type'];
  entity_id: string;
}): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_profile_id: input.user_profile_id,
      type: input.type,
      message: input.message,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
    });

    if (error) throw error;
  } catch (err: any) {
    console.error('Error creating notification:', err);
    throw err;
  }
}

