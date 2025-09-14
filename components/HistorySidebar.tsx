import React, { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { PencilIcon, TrashIcon, ResetIcon } from './icons/Icons';
import { ELIX_PERSONALITY } from '../services/geminiService';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (chat: Conversation) => void;
  speechVoice: 'female' | 'male';
  onSpeechVoiceChange: (voice: 'female' | 'male') => void;
  customPersonality: string;
  onCustomPersonalityChange: (personality: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  speechVoice,
  onSpeechVoiceChange,
  customPersonality,
  onCustomPersonalityChange,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [personalityInput, setPersonalityInput] = useState(customPersonality);

  useEffect(() => {
    setPersonalityInput(customPersonality);
  }, [customPersonality]);

  const handleStartEditing = (chat: Conversation) => {
    setEditingChatId(chat.id);
    setNewTitle(chat.title);
  };

  const handleCancelEditing = () => {
    setEditingChatId(null);
    setNewTitle('');
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChatId && newTitle.trim()) {
      onRenameChat(editingChatId, newTitle);
    }
    handleCancelEditing();
  };

  const handleSavePersonality = () => {
    onCustomPersonalityChange(personalityInput);
  };
  
  const handleResetPersonality = () => {
    setPersonalityInput(ELIX_PERSONALITY);
    onCustomPersonalityChange(ELIX_PERSONALITY);
  };

  useEffect(() => {
    if (!isOpen) {
        handleCancelEditing();
    }
  }, [isOpen]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-black/70 backdrop-blur-xl border-r border-white/10 p-4 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Chat History"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-200">Chat History</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full text-left mb-4 px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            + New Chat
          </button>

          <nav className="flex-1 overflow-y-auto pr-1 -mr-2">
            <ul className="space-y-1">
              {conversations.map((chat) => (
                <li key={chat.id} className="group relative">
                  {editingChatId === chat.id ? (
                    <form onSubmit={handleSaveRename}>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={handleSaveRename}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Escape' && handleCancelEditing()}
                        className="w-full text-left px-4 py-2.5 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => onSelectChat(chat.id)}
                      className={`w-full text-left pl-4 pr-12 py-2.5 rounded-lg truncate transition-colors duration-200 ${
                        currentChatId === chat.id
                          ? 'bg-white/20 text-white'
                          : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
                      }`}
                    >
                      {chat.title || 'New Chat'}
                    </button>
                  )}
                  {editingChatId !== chat.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleStartEditing(chat)} 
                        className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10"
                        aria-label={`Rename chat "${chat.title}"`}
                      >
                        <PencilIcon />
                      </button>
                      <button 
                        onClick={() => onDeleteChat(chat)} 
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-white/10"
                        aria-label={`Delete chat "${chat.title}"`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Settings Section */}
          <div className="mt-auto pt-4 border-t border-white/10">
              <h3 className="text-md font-semibold text-gray-300 mb-3">Settings</h3>
              <div className="space-y-4">
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-2">Voice</label>
                      <div className="flex items-center bg-white/10 rounded-full p-1">
                        <button 
                            onClick={() => onSpeechVoiceChange('female')}
                            className={`w-1/2 py-1 text-sm rounded-full transition-colors ${speechVoice === 'female' ? 'bg-violet-500 text-white' : 'text-gray-300'}`}
                        >
                            Female
                        </button>
                        <button 
                            onClick={() => onSpeechVoiceChange('male')}
                            className={`w-1/2 py-1 text-sm rounded-full transition-colors ${speechVoice === 'male' ? 'bg-violet-500 text-white' : 'text-gray-300'}`}
                        >
                            Male
                        </button>
                      </div>
                  </div>
                  <div>
                      <label htmlFor="custom-personality" className="text-sm font-medium text-gray-400 block mb-2">
                          Custom Personality
                      </label>
                      <textarea 
                          id="custom-personality"
                          value={personalityInput}
                          onChange={(e) => setPersonalityInput(e.target.value)}
                          rows={4}
                          className="w-full text-sm p-2 rounded-lg bg-white/10 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                          placeholder="e.g., You are a helpful assistant that speaks like a pirate."
                      />
                       <div className="flex items-center justify-end space-x-2 mt-2">
                            <button 
                                onClick={handleResetPersonality} 
                                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
                                aria-label="Reset to default personality"
                            >
                                <ResetIcon />
                            </button>
                            <button 
                                onClick={handleSavePersonality}
                                className="px-4 py-1.5 text-sm rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
                            >
                                Save
                            </button>
                       </div>
                  </div>
              </div>
          </div>

        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;