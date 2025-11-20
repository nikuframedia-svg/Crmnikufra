const STORAGE_KEY = 'nikufra_profile_id';

export function getStoredProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredProfileId(value: string | null) {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const PROFILE_STORAGE_KEY = STORAGE_KEY;


