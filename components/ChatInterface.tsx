import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import Loader from './Loader';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onRetry: () => void;
  currentlySpeakingId: string | null;
  onToggleSpeech: (message: Message) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onRetry, currentlySpeakingId, onToggleSpeech }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="space-y-6">
      {messages.map((msg, index) => (
        <MessageBubble
            key={msg.id || index}
            message={msg}
            onRetry={onRetry}
            isLastMessage={index === messages.length - 1}
            isSpeaking={currentlySpeakingId === msg.id}
            onToggleSpeech={onToggleSpeech}
        />
      ))}
      {isLoading && <Loader />}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatInterface;