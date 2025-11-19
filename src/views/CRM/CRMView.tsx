import { useState } from 'react';
import { Plus, Users, Building2, TrendingUp, Upload } from 'lucide-react';
import ContactsList from './ContactsList';
import CompaniesList from './CompaniesList';
import LeadsKanban from './LeadsKanban';

type Tab = 'contacts' | 'companies' | 'leads';

export default function CRMView() {
  const [activeTab, setActiveTab] = useState<Tab>('leads');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">CRM & Vendas</h2>
          <p className="text-gray-600 mt-1">Gestão de contactos, leads e empresas</p>
        </div>

        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Upload className="w-4 h-4" />
            <span>Importar CSV</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg">
            <Plus className="w-4 h-4" />
            <span>Novo {activeTab === 'contacts' ? 'Contacto' : activeTab === 'companies' ? 'Empresa' : 'Lead'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition ${
              activeTab === 'leads'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Leads</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition ${
              activeTab === 'contacts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Contactos</span>
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition ${
              activeTab === 'companies'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Empresas</span>
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'leads' && <LeadsKanban />}
        {activeTab === 'contacts' && <ContactsList />}
        {activeTab === 'companies' && <CompaniesList />}
      </div>
    </div>
  );
}
