import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type Collaborator = {
  id: string;
  name: string;
  color: string;
  role?: string;
  email?: string;
};

const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'];

export function useProfiles() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const mappedCollaborators: Collaborator[] = data.map((profile, index) => ({
            id: profile.id,
            name: profile.full_name,
            color: COLORS[index % COLORS.length],
            role: profile.role,
            email: profile.email
          }));
          setCollaborators(mappedCollaborators);
        }
      } catch (err: any) {
        console.error('Error fetching profiles:', err);
        setError('Failed to load collaborators');
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  return { collaborators, loading, error };
}


