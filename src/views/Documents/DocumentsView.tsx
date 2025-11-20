import { useState } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { useProjects } from '../../hooks/useProjects';
import { Plus, FileText, FolderOpen, Clock, X, Download, Sparkles, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useAssistant } from '../../hooks/useAssistant';
import type { DocumentRecord } from '../../types/crm';

export default function DocumentsView() {
  const { documents, loading, addDocument, getDocumentUrl, deleteDocument } = useDocuments();
  const { projects } = useProjects();
  const { generateDocumentInsights } = useAssistant();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    is_template: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docSummaries, setDocSummaries] = useState<Record<string, string>>({});
  const [summaryLoadingId, setSummaryLoadingId] = useState<string | null>(null);
  const [summaryErrors, setSummaryErrors] = useState<Record<string, string | null>>({});
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDocument(
        {
          title: formData.title,
          description: formData.description || undefined,
          project_id: formData.project_id || undefined,
          lead_id: undefined,
          parent_id: undefined,
          is_template: formData.is_template,
          storage_path: undefined,
          created_by: '00000000-0000-0000-0000-000000000000', // Will be overridden by hook
        },
        selectedFile || undefined
      );
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        project_id: '',
        is_template: false,
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Erro ao criar documento. Verifica a consola.');
    }
  };

  const handleGenerateSummary = async (doc: DocumentRecord) => {
    try {
      setSummaryLoadingId(doc.id);
      setSummaryErrors((prev) => ({ ...prev, [doc.id]: null }));
      const result = await generateDocumentInsights(doc);
      if (!result) {
        setSummaryErrors((prev) => ({ ...prev, [doc.id]: 'Não foi possível gerar o resumo.' }));
        return;
      }
      setDocSummaries((prev) => ({ ...prev, [doc.id]: result.summary }));
    } catch (error: any) {
      console.error('Error generating summary:', error);
      setSummaryErrors((prev) => ({ ...prev, [doc.id]: error.message || 'Erro ao gerar resumo.' }));
    } finally {
      setSummaryLoadingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">A carregar documentos...</div>;
  }

  return (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Documentação</h2>
            <p className="text-gray-600 mt-1">Documentos e templates internos</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setFormData({ ...formData, is_template: true });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Criar Template</span>
            </button>
            <button
              onClick={() => {
                setFormData({ ...formData, is_template: false });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Documento</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Sem documentos. Crie o primeiro documento.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="relative p-6 hover:bg-gray-50 transition cursor-pointer"
                >
                  <button
                    title="Eliminar documento"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = window.confirm(`Eliminar o documento "${doc.title}"?`);
                      if (!confirmed) return;
                      try {
                        setDeletingDocId(doc.id);
                        await deleteDocument(doc.id);
                        setDocSummaries((prev) => {
                          const next = { ...prev };
                          delete next[doc.id];
                          return next;
                        });
                        setSummaryErrors((prev) => {
                          const next = { ...prev };
                          delete next[doc.id];
                          return next;
                        });
                      } catch (error) {
                        console.error('Error deleting document:', error);
                        alert('Erro ao eliminar documento.');
                      } finally {
                        setDeletingDocId(null);
                      }
                    }}
                    className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-600 rounded"
                  >
                    {deletingDocId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                        {doc.is_template && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                            Template
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {doc.description ? doc.description.substring(0, 150) + '...' : 'Documento sem descrição.'}
                      </p>

                      <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            Resumo do Assistente
                          </div>
                          <button
                            onClick={() => handleGenerateSummary(doc)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
                            disabled={summaryLoadingId === doc.id}
                          >
                            {summaryLoadingId === doc.id ? 'A gerar...' : docSummaries[doc.id] ? 'Atualizar' : 'Gerar resumo'}
                          </button>
                        </div>
                        {summaryLoadingId === doc.id ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                            A gerar resumo...
                          </div>
                        ) : docSummaries[doc.id] ? (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{docSummaries[doc.id]}</p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Ainda não existe resumo gerado. Clica em &quot;Gerar resumo&quot; para pedir ajuda ao assistente.
                          </p>
                        )}
                        {summaryErrors[doc.id] && summaryLoadingId === null && (
                          <div className="mt-2 flex items-center text-xs text-red-500 gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {summaryErrors[doc.id]}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>
                            Atualizado {new Date(doc.updated_at).toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                        {doc.storage_path && (
                          <a
                            href={getDocumentUrl(doc.storage_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {formData.is_template ? 'Novo Template' : 'Novo Documento'}
              </h3>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhum</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ficheiro (opcional)</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">Ficheiro selecionado: {selectedFile.name}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_template"
                  checked={formData.is_template}
                  onChange={(e) => setFormData({ ...formData, is_template: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_template" className="ml-2 text-sm text-gray-700">
                  Marcar como template
                </label>
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
                  Criar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
