import { createClient } from '@supabase/supabase-js';
import { getStoredProfileId } from './profileAccessStorage';

const DEFAULT_SUPABASE_URL = 'https://qkotmsdonlglwtrlqfja.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrb3Rtc2RvbmxnbHd0cmxxZmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODYxMjAsImV4cCI6MjA3NDY2MjEyMH0.eNLkM1DGKOnOoSFygxRIQ1tfpFjoIfI8RYZfYlBct50';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (
  supabaseUrl === DEFAULT_SUPABASE_URL ||
  supabaseAnonKey === DEFAULT_SUPABASE_ANON_KEY
) {
  console.warn(
    '[Supabase] A utilizar credenciais padrão de desenvolvimento. Substitui estas variáveis no .env para usar outro projecto.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url: string, options?: RequestInit) => {
      const headers = new Headers(options?.headers ?? {});
      if (typeof window !== 'undefined') {
        const profileId = getStoredProfileId();
        if (profileId) {
          headers.set('x-nikufra-profile-id', profileId);
        }
      }
      return fetch(url, { ...options, headers });
    },
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'salesperson' | 'user';
  department?: string;
  created_at: string;
  updated_at: string;
};
