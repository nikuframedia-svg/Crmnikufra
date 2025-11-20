export type CollaboratorProfile = {
  id: string;
  name: string;
  role: 'executive' | 'sales' | 'ops';
  password: string;
  canAccessBackend: boolean;
  allowedChannels: Array<'geral' | 'ceos' | 'c-level'>;
  color: string;
};

export const COLLABORATORS: CollaboratorProfile[] = [
  {
    id: 'd0d54648-1001-4001-a001-000000000001',
    name: 'JOAO MILHAZES',
    role: 'executive',
    password: 'K7TQ-V3MJ',
    canAccessBackend: false,
    allowedChannels: ['geral', 'ceos', 'c-level'],
    color: 'bg-blue-600',
  },
  {
    id: 'd0d54648-1002-4002-a002-000000000002',
    name: 'LUIS NICOLAU',
    role: 'executive',
    password: 'N2GX-Y8PR',
    canAccessBackend: true,
    allowedChannels: ['geral', 'ceos', 'c-level'],
    color: 'bg-green-600',
  },
  {
    id: 'd0d54648-1003-4003-a003-000000000003',
    name: 'AFONSO MILHEIRO',
    role: 'executive',
    password: 'C9LM-R4SZ',
    canAccessBackend: false,
    allowedChannels: ['geral', 'c-level'],
    color: 'bg-purple-600',
  },
  {
    id: 'd0d54648-1004-4004-a004-000000000004',
    name: 'MATEUS SILVA',
    role: 'ops',
    password: 'V5PJ-H2BK',
    canAccessBackend: false,
    allowedChannels: ['geral'],
    color: 'bg-orange-600',
  },
];

