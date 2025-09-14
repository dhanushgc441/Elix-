import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat } from '@google/genai';
import { Message, MessageRole, GroundingChunk, Conversation } from './types';
import { initChat, sendMessageStream, generateImage, ELIX_PERSONALITY } from './services/geminiService';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import InputBar from './components/InputBar';
import OfflineNotice from './components/OfflineNotice';
import HistorySidebar from './components/HistorySidebar';
import ConfirmationModal from './components/ConfirmationModal';
import VideoCallModal from './services/VideoCallModal';

const App: React.FC = () => {
  const [allChats, setAllChats] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [chatToDelete, setChatToDelete] = useState<Conversation | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState<boolean>(false);

  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [lastFailedMessage, setLastFailedMessage] = useState<{ text: string; image?: File } | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isDeepSearch, setIsDeepSearch] = useState<boolean>(false);
  
  const [speechVoice, setSpeechVoice] = useState<'female' | 'male'>('female');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [customPersonality, setCustomPersonality] = useState<string>(ELIX_PERSONALITY);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = allChats.find(c => c.id === currentChatId)?.messages ?? [];

  const handleNewChat = useCallback(() => {
    const newChat: Conversation = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
    };
    setAllChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setIsHistoryOpen(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load voices for text-to-speech
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Load saved chats
    try {
      const savedChats = localStorage.getItem('elix-all-chats');
      if (savedChats) {
        const parsedChats: Conversation[] = JSON.parse(savedChats);
        if (parsedChats.length > 0) {
          setAllChats(parsedChats);
          setCurrentChatId(parsedChats[0].id);
        } else {
          handleNewChat();
        }
      } else {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      localStorage.removeItem('elix-all-chats');
      handleNewChat();
    }

    // Load settings
    const savedVoice = localStorage.getItem('elix-speech-voice');
    if (savedVoice === 'male' || savedVoice === 'female') {
      setSpeechVoice(savedVoice);
    }
    const savedPersonality = localStorage.getItem('elix-custom-personality');
    if (savedPersonality) {
      setCustomPersonality(savedPersonality);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [handleNewChat]);

  // Re-initialize chat session when personality changes
  useEffect(() => {
    try {
      // Reset error on re-try
      setInitializationError(null);
      setChat(initChat(customPersonality));
    } catch (error) {
      console.error("Initialization failed:", error);
      if (error instanceof Error) {
        setInitializationError(error.message);
      } else {
        setInitializationError("An unknown error occurred during app initialization.");
      }
      setChat(null); // Ensure chat is null on error
    }
  }, [customPersonality]);

  useEffect(() => {
    if (allChats.length === 0 && currentChatId === null) {
        handleNewChat();
    }
  }, [allChats, currentChatId, handleNewChat]);

  useEffect(() => {
    if (allChats.length > 0) {
      try {
        localStorage.setItem('elix-all-chats', JSON.stringify(allChats));
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    } else {
      localStorage.removeItem('elix-all-chats');
    }
  }, [allChats]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('elix-speech-voice', speechVoice);
  }, [speechVoice]);
  
  useEffect(() => {
    localStorage.setItem('elix-custom-personality', customPersonality);
  }, [customPersonality]);

  const handleSendMessage = useCallback(async (text: string, image?: File, isRetry = false) => {
    if (isLoading || !currentChatId) return;

    let finalText = text;
    if (isDeepSearch) {
      // Modify the prompt for a deep search
      finalText = `Perform a comprehensive "deep search" on the web to answer the following. Provide a detailed, well-structured response and cite multiple high-quality sources. Query: "${text}"`;
      setIsDeepSearch(false); // Reset after using it for one message
    }
    
    const currentConv = allChats.find(c => c.id === currentChatId);

    const updateUserMessage = (message: Message) => {
        const isNewChat = currentConv?.messages.length === 0 && currentConv?.title === 'New Chat';
        setAllChats(prevChats => prevChats.map(chat => {
            if (chat.id !== currentChatId) return chat;
            return {
                ...chat,
                title: isNewChat ? text.substring(0, 40) : chat.title,
                messages: [...chat.messages, message]
            };
        }));
    };

    const updateElixMessage = (message: Message) => {
        setAllChats(prevChats => prevChats.map(chat =>
            chat.id === currentChatId ? { ...chat, messages: [...chat.messages, message] } : chat
        ));
    };

    if (!isOnline) {
       updateUserMessage({ id: Date.now().toString(), role: MessageRole.USER, text });
       updateElixMessage({ id: (Date.now() + 1).toString(), role: MessageRole.MODEL, text: 'Elix needs internet to think 🌐', error: true });
       setIsLoading(false);
       return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text,
      image: image ? await fileToBase64(image) : undefined,
    };
    updateUserMessage(userMessage);
    
    // Hardcoded responses
    const creatorRegex = /(who (made|created) you)|(who is your (owner|creator)\b)/i;
    const founderRegex = /who is the (founder|owner) of elixai/i;
    const dhanushGCRegex = /dhanush gc/i;
    const familyKeywords = /family|parents|mother|father|brother/i;
    const imageCommandRegex = /^(imagine|create|generate|draw)\s+(an image of\s+)?/i;
    
    if (founderRegex.test(text)) {
        updateElixMessage({ id: (Date.now() + 1).toString(), role: MessageRole.MODEL, text: "The founder and owner of ElixAi is Dhanush GC." });
        return;
    }

    if (dhanushGCRegex.test(text)) {
        if (familyKeywords.test(text)) {
            updateElixMessage({ id: (Date.now() + 1).toString(), role: MessageRole.MODEL, text: "Based on information available, Dhanush GC's mother is Rathna HR, his father is Channakeshavamurthy G, and his younger brother is Kushal GC." });
            return;
        } else {
            updateElixMessage({ id: (Date.now() + 1).toString(), role: MessageRole.MODEL, text: "Dhanush GC is a young tech entrepreneur, born on September 17, 2010." });
            return;
        }
    }

    if (creatorRegex.test(text)) {
        updateElixMessage({ id: (Date.now() + 1).toString(), role: MessageRole.MODEL, text: "I was developed by ElixAi." });
        return;
    }
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    const elixResponseId = (Date.now() + 1).toString();

    if (imageCommandRegex.test(text)) {
        setLoadingStatus('Creating Image...');
        const prompt = text.replace(imageCommandRegex, '');
        
        try {
            const imageBase64 = await generateImage(prompt);
            updateElixMessage({ 
                id: elixResponseId, 
                role: MessageRole.MODEL, 
                text: `Here is the image for: "${prompt}"`,
                image: `data:image/jpeg;base64,${imageBase64}`
            });
        } catch (error) {
            console.error('Error generating image:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            updateElixMessage({ 
                id: elixResponseId, 
                role: MessageRole.MODEL, 
                text: `Sorry, I couldn't create that image: ${errorMessage}`, 
                error: true 
            });
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    } else { // Regular chat message
        if (!chat) return;
        setLoadingStatus('Thinking');
        updateElixMessage({ id: elixResponseId, role: MessageRole.MODEL, text: '' });
        
        if (!isRetry) setLastFailedMessage({ text, image });

        try {
          const stream = await sendMessageStream(chat, finalText, image);
          let allSources: GroundingChunk[] = [];
          let finalResponseText = '';
    
          for await (const chunk of stream) {
            if (abortControllerRef.current.signal.aborted) break;
            const chunkText = chunk.text;
            finalResponseText += chunkText;
            const chunkSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
            if (chunkSources) allSources = [...allSources, ...chunkSources];
    
            setAllChats(prevChats => prevChats.map(c => c.id === currentChatId ? { ...c, messages: c.messages.map(m => m.id === elixResponseId ? { ...m, text: m.text + chunkText, sources: allSources.length > 0 ? allSources : undefined } : m) } : c));
          }

          const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
          const match = finalResponseText.match(youtubeRegex);

          if (match && match[1]) {
              const videoId = match[1];
              setAllChats(prevChats => prevChats.map(c => c.id === currentChatId ? { ...c, messages: c.messages.map(m => m.id === elixResponseId ? { ...m, youtubeVideoId: videoId } : m) } : c));
          }

          if (!isRetry) setLastFailedMessage(null);
        } catch (error) {
          console.error('Error streaming message:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          setAllChats(prevChats => prevChats.map(c => c.id === currentChatId ? { ...c, messages: c.messages.map(m => m.id === elixResponseId ? { ...m, text: `Sorry, I encountered an error: ${errorMessage}`, error: true } : m) } : c));
        } finally {
          setIsLoading(false);
          setLoadingStatus('');
          abortControllerRef.current = null;
        }
    }
  }, [chat, isLoading, isOnline, currentChatId, allChats, isDeepSearch]);

  const handleRetry = () => {
    if (lastFailedMessage && currentChatId) {
      setAllChats(prev => prev.map(chat =>
        chat.id === currentChatId
        ? { ...chat, messages: chat.messages.filter(msg => !msg.error && msg.text !== '') }
        : chat
      ));
      handleSendMessage(lastFailedMessage.text, lastFailedMessage.image, true);
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsLoading(false);
    setLoadingStatus('');
    window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);
  };

  const handleToggleSpeech = useCallback((messageToSpeak: Message) => {
    window.speechSynthesis.cancel();
    if (currentlySpeakingId === messageToSpeak.id) {
        setCurrentlySpeakingId(null);
        return;
    }
    if (messageToSpeak.text) {
        const utterance = new SpeechSynthesisUtterance(messageToSpeak.text.replace(/\*\*(.*?)\*\*/g, '$1'));
        
        const selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') &&
            (speechVoice === 'male' ? /male/i.test(voice.name) : !/male/i.test(voice.name) || /female/i.test(voice.name))
        );

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else if (voices.length > 0) {
            // Fallback to the first available English voice
            utterance.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        }

        utterance.onend = () => setCurrentlySpeakingId(null);
        utterance.onerror = (event) => { console.error("Speech synthesis error", event); setCurrentlySpeakingId(null); };
        window.speechSynthesis.speak(utterance);
        setCurrentlySpeakingId(messageToSpeak.id);
    }
  }, [currentlySpeakingId, voices, speechVoice]);

  const handleToggleHistory = () => setIsHistoryOpen(prev => !prev);
  const handleSelectChat = (id: string) => { setCurrentChatId(id); setIsHistoryOpen(false); };
  const handleRenameChat = useCallback((chatId: string, newTitle: string) => {
    setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle.trim() || 'New Chat' } : c));
  }, []);
  const handleDeleteChat = useCallback((chat: Conversation) => setChatToDelete(chat), []);
  const cancelDelete = () => setChatToDelete(null);
  const confirmDelete = useCallback(() => {
    if (!chatToDelete) return;
    let nextChatId: string | null = currentChatId;
    const remainingChats = allChats.filter(chat => chat.id !== chatToDelete.id);

    if (currentChatId === chatToDelete.id) {
        if (remainingChats.length > 0) {
            const deletedIndex = allChats.findIndex(c => c.id === chatToDelete.id);
            const newIndex = Math.max(0, deletedIndex - 1);
            nextChatId = remainingChats[newIndex]?.id ?? remainingChats[0]?.id;
        } else {
            nextChatId = null;
        }
    }
    setAllChats(remainingChats);
    setCurrentChatId(nextChatId);
    setChatToDelete(null);
  }, [chatToDelete, currentChatId, allChats]);

  if (initializationError) {
    return (
      <div className="flex flex-col h-screen bg-black font-sans items-center justify-center text-center p-4">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
            Application Error
          </h1>
          <p className="text-gray-300 mb-2">
            Elix could not start. This is usually due to a configuration issue.
          </p>
          <p className="text-sm text-gray-500 bg-gray-900 p-3 rounded-lg border border-white/10">
            <code>{initializationError}</code>
          </p>
           <p className="text-gray-400 mt-6 text-xs">
            If you are the developer, please ensure the API key is correctly configured in your deployment environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black font-sans overflow-hidden relative">
      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={handleToggleHistory}
        conversations={allChats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        speechVoice={speechVoice}
        onSpeechVoiceChange={setSpeechVoice}
        customPersonality={customPersonality}
        onCustomPersonalityChange={setCustomPersonality}
      />
      <Header 
        loadingStatus={loadingStatus} 
        isListening={isListening} 
        onToggleHistory={handleToggleHistory}
      />
      {!isOnline && <OfflineNotice />}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-24 pb-32">
          <ChatInterface 
            messages={messages} 
            isLoading={isLoading} 
            onRetry={handleRetry}
            currentlySpeakingId={currentlySpeakingId}
            onToggleSpeech={handleToggleSpeech}
          />
      </div>
      <div className="fixed bottom-0 left-0 right-0 px-4 md:px-6 pb-4 bg-black/0">
        <InputBar
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          isListening={isListening}
          setIsListening={setIsListening}
          isDeepSearch={isDeepSearch}
          setIsDeepSearch={setIsDeepSearch}
          onOpenVideoCall={() => setIsVideoCallOpen(true)}
        />
      </div>
       <ConfirmationModal
          isOpen={!!chatToDelete}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          title="Delete Chat"
          message={`Are you sure you want to permanently delete "${chatToDelete?.title}"? This action cannot be undone.`}
      />
      <VideoCallModal
          isOpen={isVideoCallOpen}
          onClose={() => setIsVideoCallOpen(false)}
      />
    </div>
  );
};

export default App;
