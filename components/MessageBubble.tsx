import React from 'react';
import { Message, MessageRole } from '../types';
import { SpeakerOnIcon, SpeakerOffIcon } from './icons/Icons';

interface MessageBubbleProps {
  message: Message;
  onRetry: () => void;
  isLastMessage: boolean;
  isSpeaking: boolean;
  onToggleSpeech: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry, isLastMessage, isSpeaking, onToggleSpeech }) => {
  const isUser = message.role === MessageRole.USER;
    
  const formatText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const userBubble = (
    <div className="p-0.5 rounded-3xl rounded-br-lg bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800">
        <div className="bg-gray-900 rounded-[22px]">
            <div className="px-5 py-3 text-white">
                {message.image && (
                    <img src={message.image} alt="User upload" className="rounded-2xl mb-3 max-h-64" />
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    </div>
  );

  const modelBubble = (
    <div className="p-0.5 rounded-3xl rounded-bl-lg bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500">
        <div className="bg-black/80 backdrop-blur-sm rounded-[22px]">
            <div className={`px-5 py-3 ${message.error ? 'text-red-400' : 'text-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  {message.text ? (
                    <p className="whitespace-pre-wrap flex-1" dangerouslySetInnerHTML={{ __html: formatText(message.text) }}></p>
                  ) : (
                    <div className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                  )}
                  {!isUser && message.text && !message.error && (
                    <button 
                      onClick={() => onToggleSpeech(message)} 
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                      aria-label={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                    >
                      {isSpeaking ? <SpeakerOnIcon className="w-5 h-5" /> : <SpeakerOffIcon className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {message.youtubeVideoId && (
                    <div className="mt-4 aspect-video">
                        <iframe
                            className="w-full h-full rounded-2xl"
                            src={`https://www.youtube.com/embed/${message.youtubeVideoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}

                {message.error && isLastMessage && (
                    <div className="mt-3">
                        <button
                            onClick={onRetry}
                            className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold py-1.5 px-4 rounded-full transition-colors duration-200"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className={`flex items-start gap-3 max-w-xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}>
       <div className="w-full">
            {isUser ? userBubble : modelBubble}
       </div>
    </div>
  );
};

export default MessageBubble;