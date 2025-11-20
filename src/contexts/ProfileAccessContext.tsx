import { createContext, useContext, useEffect, useState } from 'react';
import type { CollaboratorProfile } from '../data/collaborators';
import { COLLABORATORS } from '../data/collaborators';
import { getStoredProfileId, setStoredProfileId } from '../lib/profileAccessStorage';

type ProfileAccessState = {
  profile: CollaboratorProfile | null;
  selectProfile: (collaboratorId: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const ProfileAccessContext = createContext<ProfileAccessState | undefined>(undefined);

export function ProfileAccessProvider({ children }: { children: React.ReactNode }) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => getStoredProfileId());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStoredProfileId(selectedProfileId);
  }, [selectedProfileId]);

  const selectProfile = async (collaboratorId: string, password: string) => {
    const collaborator = COLLABORATORS.find((c) => c.id === collaboratorId);
    if (!collaborator) {
      setError('Colaborador inválido');
      return false;
    }
    if (collaborator.password !== password) {
      setError('Senha incorreta');
      return false;
    }
    setSelectedProfileId(collaborator.id);
    setError(null);
    return true;
  };

  const logout = () => {
    setSelectedProfileId(null);
    setError(null);
  };

  const profile = COLLABORATORS.find((c) => c.id === selectedProfileId) || null;

  return (
    <ProfileAccessContext.Provider
      value={{
        profile,
        selectProfile,
        logout,
      }}
    >
      {children}
    </ProfileAccessContext.Provider>
  );
}

export function useProfileAccess() {
  const ctx = useContext(ProfileAccessContext);
  if (!ctx) {
    throw new Error('useProfileAccess must be used within ProfileAccessProvider');
  }
  return ctx;
}


