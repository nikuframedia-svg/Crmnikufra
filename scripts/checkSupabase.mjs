#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[checkSupabase] Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  const { error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[checkSupabase] Error querying profiles:', error.message);
    process.exit(1);
  }

  console.log(
    `[checkSupabase] Supabase reachable. Profiles table count: ${count ?? 'unknown'}`
  );
} catch (err) {
  console.error('[checkSupabase] Unexpected error:', err.message);
  process.exit(1);
}



