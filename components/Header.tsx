import React from 'react';
import { MicrophoneIcon, HistoryIcon } from './icons/Icons';

interface HeaderProps {
    loadingStatus: string;
    isListening: boolean;
    onToggleHistory: () => void;
}

const StatusIndicator: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
    <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm font-medium text-gray-300">{text}</span>
    </div>
);


const Header: React.FC<HeaderProps> = ({ loadingStatus, isListening, onToggleHistory }) => {
    let statusContent: React.ReactNode = null;

    if (loadingStatus) {
        const thinkingDots = (
            <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-pulse" style={{ animationDelay: '-0.3s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 animate-pulse" style={{ animationDelay: '-0.15s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 animate-pulse"></span>
            </div>
        );
        statusContent = <StatusIndicator icon={thinkingDots} text={loadingStatus} />;
    } else if (isListening) {
        statusContent = <StatusIndicator icon={<MicrophoneIcon className="h-4 w-4 text-red-400 animate-pulse" />} text="Listening" />;
    }

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center space-x-4 px-5 py-2 bg-black/70 backdrop-blur-xl rounded-full border border-white/10 shadow-lg transition-all duration-300 ease-in-out">
                <button
                    onClick={onToggleHistory}
                    aria-label="Toggle chat history"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                    <HistoryIcon className="h-5 w-5" />
                </button>
                <div className="w-px h-4 bg-white/20"></div>

                <h1 className="text-xl font-bold text-center">
                    <span
                        className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(238, 130, 238, 0.4))' }}
                    >
                        Elix
                    </span>
                </h1>
                {statusContent && (
                    <>
                        <div className="w-px h-4 bg-white/20"></div>
                        <div className="flex items-center justify-center">
                           {statusContent}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;