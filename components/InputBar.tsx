import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PaperclipIcon, SendIcon, StopIcon, MicrophoneIcon, CameraIcon, MagnifyingGlassIcon, VideoCameraIcon } from './icons/Icons';
import CameraModal from './CameraModal';

// Add SpeechRecognition types to the window object for TypeScript
declare global {
  // Fix: Define the SpeechRecognition interface to resolve the "Cannot find name 'SpeechRecognition'" error.
  interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: () => void;
    onend: () => void;
    onerror: (event: any) => void;
    onresult: (event: any) => void;
  }

  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InputBarProps {
  onSendMessage: (text: string, image?: File) => void;
  isLoading: boolean;
  onStop: () => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  isDeepSearch: boolean;
  setIsDeepSearch: (isDeepSearch: boolean) => void;
  onOpenVideoCall: () => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading, onStop, isListening, setIsListening, isDeepSearch, setIsDeepSearch, onOpenVideoCall }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition is not supported by this browser.");
      return;
    }
    
    // Fix: Add type annotation for the `recognition` constant.
    const recognition: SpeechRecognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText((currentText) => (currentText ? `${currentText} ${transcript}` : transcript));
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      recognitionRef.current?.abort();
    };
  }, [setIsListening]);

  const handleListen = () => {
    if (isLoading || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((text.trim() || imageFile) && !isLoading) {
      onSendMessage(text.trim(), imageFile || undefined);
      setText('');
      setImageFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>, over: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(over);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type.startsWith('image/')) {
        setImageFile(e.dataTransfer.files[0]);
      }
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div 
        className={`relative p-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 ${isDragOver ? 'border-violet-400 ring-2 ring-violet-400' : ''}`}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-gray-900/50 rounded-full flex items-center justify-center text-gray-300 font-semibold pointer-events-none">
            Drop image to attach
          </div>
        )}
        {imageFile && (
          <div className="absolute -top-10 left-4 px-3 py-1.5 flex items-center justify-between bg-gray-800 rounded-full border border-white/10">
            <p className="text-sm text-gray-300 truncate">Attached: {imageFile.name}</p>
            <button onClick={() => setImageFile(null)} className="text-gray-400 hover:text-white ml-2 text-lg">&times;</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            // Fix: Corrected typo from handleFileFileChange to handleFileChange.
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 rounded-full transition-all duration-200 hover:text-white hover:shadow-[0_0_15px_rgba(192,132,252,0.4)]" aria-label="Attach file">
            <PaperclipIcon />
          </button>
          <button type="button" onClick={() => setIsCameraOpen(true)} className="p-2.5 text-gray-400 rounded-full transition-all duration-200 hover:text-white hover:shadow-[0_0_15px_rgba(192,132,252,0.4)]" aria-label="Open camera">
            <CameraIcon />
          </button>
          <button type="button" onClick={onOpenVideoCall} className="p-2.5 text-gray-400 rounded-full transition-all duration-200 hover:text-white hover:shadow-[0_0_15px_rgba(192,132,252,0.4)]" aria-label="Open video analysis">
            <VideoCameraIcon />
          </button>
          <button
            type="button"
            onClick={() => setIsDeepSearch(!isDeepSearch)}
            className={`p-2.5 rounded-full transition-all duration-200 hover:shadow-[0_0_15px_rgba(192,132,252,0.4)] ${
              isDeepSearch
                ? 'text-violet-400'
                : 'text-gray-400 hover:text-white'
            }`}
            aria-label={isDeepSearch ? 'Disable Deep Search' : 'Enable Deep Search'}
          >
            <MagnifyingGlassIcon />
          </button>
           <button
            type="button"
            onClick={handleListen}
            disabled={isLoading}
            className={`p-2.5 rounded-full transition-all duration-200 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(192,132,252,0.4)] ${
              isListening
                ? 'text-red-400 animate-pulse'
                : 'text-gray-400 hover:text-white'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            <MicrophoneIcon />
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message Elix or ask to create an image..."
            className="flex-1 bg-transparent focus:outline-none text-white placeholder-gray-500"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSubmit(e);
              }
            }}
          />
          {isLoading ? (
              <button type="button" onClick={onStop} className="p-2.5 bg-red-600/80 hover:bg-red-500 rounded-full text-white transition-colors duration-200" aria-label="Stop generating">
                  <StopIcon />
              </button>
          ) : (
              <button type="submit" disabled={!text.trim() && !imageFile} className="p-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200" aria-label="Send message">
                  <SendIcon />
              </button>
          )}
        </form>
      </div>
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => {
          setImageFile(file);
          setIsCameraOpen(false);
        }}
      />
    </div>
  );
};

export default InputBar;
