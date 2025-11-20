import { useState, useEffect, useRef } from 'react';
import { useChatChannels } from '../../hooks/useChatChannels';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useProfiles } from '../../hooks/useProfiles';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileAccess } from '../../contexts/ProfileAccessContext';
import { MessageSquare, Send, Hash, Plus, X, Lock } from 'lucide-react';

export default function ChatView() {
  const { profile } = useAuth();
  const { profile: accessProfile } = useProfileAccess();
  const currentProfileId = profile?.id || accessProfile?.id || null;
  const { channels, loading: channelsLoading, createChannel } = useChatChannels();
  const { collaborators } = useProfiles();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [newChannelMembers, setNewChannelMembers] = useState<string[]>([]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: messagesLoading, sendMessage } = useChatMessages(selectedChannelId);

  // Select first channel by default
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannelId || isSending) return;
    if (!currentProfileId) {
      alert('Seleciona um perfil antes de enviar mensagens.');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(selectedChannelId, messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Tenta novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const getAuthorName = (authorId: string): string => {
    const author = collaborators.find((p) => p.id === authorId);
    return author?.name || 'Luis Nicolau';
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins}m`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const toggleChannelMember = (profileId: string) => {
    setNewChannelMembers((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || isCreatingChannel) return;
    if (newChannelIsPrivate && newChannelMembers.length === 0) {
      alert('Seleciona pelo menos um colaborador para canais privados.');
      return;
    }

    setIsCreatingChannel(true);
    try {
      const newChannel = await createChannel({
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined,
        isPrivate: newChannelIsPrivate,
        memberIds: newChannelIsPrivate ? newChannelMembers : [],
      });
      setSelectedChannelId(newChannel.id);
      setShowCreateChannelModal(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelIsPrivate(false);
      setNewChannelMembers(accessProfile?.id ? [accessProfile.id] : []);
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Erro ao criar canal. Tenta novamente.');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  if (channelsLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-300">A carregar canais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Channels Sidebar */}
      <div className="w-64 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Canais
          </h2>
          {accessProfile?.canAccessBackend && (
            <button
              onClick={() => {
                setNewChannelMembers(accessProfile?.id ? [accessProfile.id] : []);
                setNewChannelIsPrivate(false);
                setShowCreateChannelModal(true);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-850 rounded transition"
              title="Criar novo canal"
            >
              <Plus className="w-4 h-4 text-gray-600 dark:text-dark-300" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                selectedChannelId === channel.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                  : 'text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-850'
              }`}
            >
              <div className="flex items-center">
                <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{channel.name}</p>
                  {channel.description && (
                    <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">
                      {channel.description}
                    </p>
                  )}
                </div>
                {channel.is_private && (
                  <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-dark-400 ml-2 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-dark-900">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-800">
              <div className="flex items-center">
                <Hash className="w-5 h-5 mr-2 text-gray-500 dark:text-dark-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedChannel.name}</h3>
              </div>
              {selectedChannel.description && (
                <p className="text-sm text-gray-600 dark:text-dark-300 mt-1">{selectedChannel.description}</p>
              )}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-dark-300">A carregar mensagens...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 dark:text-dark-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma mensagem ainda.</p>
                    <p className="text-sm mt-1">Sê o primeiro a enviar uma mensagem!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = currentProfileId ? message.author_profile_id === currentProfileId : false;
                  const authorName = getAuthorName(message.author_profile_id);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                            : 'bg-gray-100 dark:bg-dark-850 text-gray-900 dark:text-white rounded-lg rounded-tl-none'
                        } p-3`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-80">{authorName}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-dark-400'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-800">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={`Enviar mensagem em #${selectedChannel.name}...`}
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-850 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-dark-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Seleciona um canal</p>
              <p className="text-sm mt-1">Escolhe um canal da lista para começar a conversar</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowCreateChannelModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white dark:bg-dark-900 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Criar Novo Canal</h3>
                <button
                  onClick={() => setShowCreateChannelModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-850 rounded transition"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-dark-300" />
                </button>
              </div>
              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                    Nome do Canal *
                  </label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="ex: Desenvolvimento"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-850 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    placeholder="Descrição do canal..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-850 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-dark-300">
                    <Lock className="w-4 h-4 mr-2 text-gray-400" />
                    Canal privado
                  </label>
                  <input
                    type="checkbox"
                    checked={newChannelIsPrivate}
                    onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </div>

                {newChannelIsPrivate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                      Selecionar membros
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-800 rounded-lg divide-y divide-gray-100 dark:divide-dark-700">
                      {collaborators.map((collab) => (
                        <label
                          key={collab.id}
                          className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-dark-200"
                        >
                          <span>{collab.name}</span>
                          <input
                            type="checkbox"
                            checked={newChannelMembers.includes(collab.id)}
                            onChange={() => toggleChannelMember(collab.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-2">
                      Apenas os membros selecionados (mais o criador) terão acesso a este canal.
                    </p>
                  </div>
                )}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateChannelModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-dark-200 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-850 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newChannelName.trim() || isCreatingChannel}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isCreatingChannel ? 'A criar...' : 'Criar Canal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

