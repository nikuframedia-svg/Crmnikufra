import { useState } from 'react';
import { COLLABORATORS } from '../../data/collaborators';
import { useProfileAccess } from '../../contexts/ProfileAccessContext';
import { Lock } from 'lucide-react';

export default function ProfileGate() {
  const { selectProfile } = useProfileAccess();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPassword('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    const success = await selectProfile(selectedId, password);
    if (!success) {
      setError('Senha incorreta. Tenta novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col space-y-2 mb-8">
          <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Nikufra.ai</p>
          <h1 className="text-3xl font-bold text-slate-900">Seleciona o teu perfil</h1>
          <p className="text-slate-500">Cada colaborador tem uma senha única para aceder ao workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {COLLABORATORS.map((collab) => (
            <button
              key={collab.id}
              onClick={() => handleSelect(collab.id)}
              className={`p-4 rounded-xl border transition ${
                selectedId === collab.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center ${collab.color}`}>
                  {collab.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-900">{collab.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {collab.canAccessBackend ? 'Acesso completo' : 'Acesso colaborador'}
              </p>
            </button>
          ))}
        </div>

        {selectedId && (
          <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              Introduz a senha de acesso
            </label>
            <div className="flex space-x-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {loading ? 'A validar...' : 'Entrar'}
              </button>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </form>
        )}

        <p className="text-xs text-slate-400 mt-6">
          Apenas o perfil do Luís Nicolau pode alterar parâmetros de backend. Todos os restantes perfis têm acesso
          limitado.
        </p>
      </div>
    </div>
  );
}

