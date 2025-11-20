import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeads } from '../../hooks/useLeads';
import { useProfiles } from '../../hooks/useProfiles';
import { Euro, Calendar, User, Plus, X, Trash2, Loader2 } from 'lucide-react';
import type { LeadStage } from '../../types/crm';

const stages: { id: LeadStage; label: string; color: string }[] = [
  { id: 'new', label: 'Novo', color: 'bg-gray-100' },
  { id: 'contacted', label: 'Contactado', color: 'bg-blue-100' },
  { id: 'qualified', label: 'Qualificado', color: 'bg-green-100' },
  { id: 'proposal', label: 'Proposta', color: 'bg-yellow-100' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-orange-100' },
  { id: 'won', label: 'Ganho', color: 'bg-emerald-100' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-100' },
];

export default function LeadsKanban() {
  const { leads, loading, getLeadsByStatus, addLead, deleteLead } = useLeads();
  const { collaborators } = useProfiles();
  const [showModal, setShowModal] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    currency: 'EUR' as const,
    stage: 'new' as LeadStage,
    probability: '50',
    expected_close_date: '',
    notes: '',
    owner_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addLead({
        title: formData.title,
        value: formData.value ? parseFloat(formData.value) : undefined,
        currency: formData.currency,
        stage: formData.stage,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        expected_close_date: formData.expected_close_date || undefined,
        notes: formData.notes || undefined,
        owner_id: formData.owner_id || undefined,
      });
      setShowModal(false);
      setFormData({
        title: '',
        value: '',
        currency: 'EUR',
        stage: 'new',
        probability: '50',
        expected_close_date: '',
        notes: '',
        owner_id: '',
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Erro ao criar lead. Verifica a consola.');
    }
  };

  const getTotalValue = (stageLeads: typeof leads) => {
    return stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  };

  const handleDeleteLead = async (leadId: string, title: string) => {
    const confirmed = window.confirm(`Tens a certeza que queres eliminar a lead "${title}"?`);
    if (!confirmed) return;
    try {
      setDeletingLeadId(leadId);
      await deleteLead(leadId);
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Erro ao eliminar lead. Verifica a consola.');
    } finally {
      setDeletingLeadId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">A carregar leads...</div>;
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lead</span>
        </button>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStatus(stage.id);
          const totalValue = getTotalValue(stageLeads);

          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <div className={`${stage.color} rounded-t-lg px-4 py-3 border-b-2 border-gray-300`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                    {stageLeads.length}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-b-lg p-4 space-y-3 min-h-[500px]">
                {stageLeads.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Sem leads</p>
                ) : (
                  stageLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      to={`/crm/leads/${lead.id}`}
                      className="relative block bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
                    >
                      <button
                        title="Eliminar lead"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteLead(lead.id, lead.title);
                        }}
                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        {deletingLeadId === lead.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <h4 className="font-semibold text-gray-900 mb-2">{lead.title}</h4>

                      <div className="space-y-2">
                        {lead.value !== undefined && lead.value > 0 && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Euro className="w-4 h-4 mr-2" />
                            <span className="font-medium">
                              {lead.value.toLocaleString('pt-PT', { style: 'currency', currency: lead.currency })}
                            </span>
                          </div>
                        )}

                        {lead.expected_close_date && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{new Date(lead.expected_close_date).toLocaleDateString('pt-PT')}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            <span>Proprietário</span>
                          </div>
                          {lead.probability !== undefined && (
                            <span className="text-xs font-medium text-blue-600">{lead.probability}%</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Novo Lead</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Probabilidade (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as LeadStage })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fecho Esperada</label>
                <input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proprietário</label>
                <select
                  value={formData.owner_id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhum</option>
                  {collaborators.map((collab) => (
                    <option key={collab.id} value={collab.id}>
                      {collab.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
