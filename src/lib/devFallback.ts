import { supabase } from './supabase';
import { getStoredProfileId } from './profileAccessStorage';

/**
 * Default profile ID used when the user is not authenticated locally.
 * This should match an existing profile in the database so that inserts
 * referencing created_by / owner_id keep referential integrity.
 */
export const DEV_FALLBACK_PROFILE_ID =
  import.meta.env.VITE_SUPABASE_DEV_PROFILE_ID || 'd0d54648-1002-4002-a002-000000000002';

/**
 * Returns the currently authenticated Supabase user id or a deterministic
 * fallback profile id so the UI keeps working in local/demo environments.
 */
export async function getEffectiveProfileId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (data.user?.id) return data.user.id;
  const storedProfile = getStoredProfileId();
  return storedProfile || DEV_FALLBACK_PROFILE_ID;
}

