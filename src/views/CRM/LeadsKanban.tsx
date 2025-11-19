import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Euro, Calendar, User } from 'lucide-react';

type Lead = {
  id: string;
  title: string;
  stage: string;
  value: number;
  currency: string;
  expected_close_date: string;
  owner_id: string;
  contact_id: string;
  company_id: string;
  probability: number;
};

const stages = [
  { id: 'new', label: 'Novo', color: 'bg-gray-100' },
  { id: 'contacted', label: 'Contactado', color: 'bg-blue-100' },
  { id: 'qualified', label: 'Qualificado', color: 'bg-green-100' },
  { id: 'proposal', label: 'Proposta', color: 'bg-yellow-100' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-orange-100' },
  { id: 'won', label: 'Ganho', color: 'bg-emerald-100' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-100' },
];

export default function LeadsKanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage === stageId);
  };

  const getTotalValue = (stageLeads: Lead[]) => {
    return stageLeads.reduce((sum, lead) => sum + lead.value, 0);
  };

  if (loading) {
    return <div className="text-center py-8">A carregar leads...</div>;
  }

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
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
                  <div
                    key={lead.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{lead.title}</h4>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Euro className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {lead.value.toLocaleString('pt-PT', { style: 'currency', currency: lead.currency })}
                        </span>
                      </div>

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
                        <span className="text-xs font-medium text-blue-600">{lead.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
