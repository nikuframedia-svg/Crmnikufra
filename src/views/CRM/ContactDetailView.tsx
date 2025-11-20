import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useContacts } from '../../hooks/useContacts';
import { useActivities } from '../../hooks/useActivities';
import { useNotes } from '../../hooks/useNotes';
import { useProfiles } from '../../hooks/useProfiles';
import { useCompanies } from '../../hooks/useCompanies';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Mail, Phone, Briefcase, Building2, Plus, Clock, Trash2 } from 'lucide-react';

export default function ContactDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getContactById, deleteContact } = useContacts();
  const { activities, loading: activitiesLoading } = useActivities('contact', id || '');
  const { notes, addNote, loading: notesLoading } = useNotes('contact', id || '');
  const { collaborators } = useProfiles();
  const { companies } = useCompanies();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadContact();
    }
  }, [id]);

  const loadContact = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getContactById(id);
    setContact(data);
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setSubmittingNote(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id || '00000000-0000-0000-0000-000000000000';
      await addNote(newNote, userId);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Erro ao adicionar nota');
    } finally {
      setSubmittingNote(false);
    }
  };

  const getAuthorName = (authorId: string) => {
    const profile = collaborators.find((c) => c.id === authorId);
    return profile?.name || 'Desconhecido';
  };

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return null;
    const company = companies.find((c) => c.id === companyId);
    return company?.name || null;
  };

  const handleDeleteContact = async () => {
    if (!id || !contact) return;
    const confirmed = window.confirm(`Eliminar o contacto "${contact.first_name} ${contact.last_name}"?`);
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deleteContact(id);
      navigate('/crm');
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Erro ao eliminar contacto.');
    } finally {
      setDeleting(false);
    }
  };

  const formatActivity = (activity: any) => {
    const author = getAuthorName(activity.author_profile_id);
    const date = new Date(activity.created_at).toLocaleString('pt-PT');
    
    let activityText = '';
    let icon = '📝';
    
    switch (activity.type) {
      case 'note':
        const preview = activity.metadata?.content_preview || '';
        activityText = `Nota adicionada por ${author}: ${preview}`;
        break;
      case 'task_created':
        const taskTitle = activity.metadata?.task_title || '';
        activityText = `Tarefa criada: "${taskTitle}" por ${author}`;
        icon = '✅';
        break;
      case 'document_added':
        const docTitle = activity.metadata?.document_title || '';
        activityText = `Documento adicionado: "${docTitle}" por ${author}`;
        icon = '📄';
        break;
      default:
        activityText = `Atividade por ${author}`;
    }
    
    return { icon, text: activityText, date };
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar contacto...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contacto não encontrado</h2>
          <button
            onClick={() => navigate('/crm')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voltar ao CRM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/crm')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao CRM</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {contact.first_name} {contact.last_name}
            </h1>
            <div className="flex items-center space-x-4">
              {contact.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-1" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.company_id && getCompanyName(contact.company_id) && (
                <Link
                  to={`/crm/companies/${contact.company_id}`}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Building2 className="w-4 h-4 mr-1" />
                  {getCompanyName(contact.company_id)}
                </Link>
              )}
            </div>
          </div>
          <button
            onClick={handleDeleteContact}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'A eliminar...' : 'Eliminar Contacto'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informações</h2>
            <div className="space-y-3">
              {contact.job_title && (
                <div className="flex items-center text-sm">
                  <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Cargo: </span>
                  <span className="font-medium ml-1">{contact.job_title}</span>
                </div>
              )}
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Criado em: </span>
                <span className="font-medium ml-1">
                  {new Date(contact.created_at).toLocaleDateString('pt-PT')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
            {activitiesLoading ? (
              <p className="text-gray-500 text-sm">A carregar...</p>
            ) : activities.length === 0 ? (
              <p className="text-gray-500 text-sm">Sem atividades</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const formatted = formatActivity(activity);
                  return (
                    <div key={activity.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                      <p className="text-sm text-gray-900">{formatted.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatted.date}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Adicionar Nota</h2>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escreva uma nota..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={handleAddNote}
              disabled={submittingNote || !newNote.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submittingNote ? 'A adicionar...' : 'Adicionar Nota'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

