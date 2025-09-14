import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-start gap-3 max-w-xl mr-auto flex-row">
       <div className="w-full flex justify-start">
         <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white/10">
            <span className="text-gray-300 text-sm animate-shimmer">Elix is thinking...</span>
            <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-glow [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 animate-glow [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 animate-glow"></span>
            </div>
        </div>
       </div>
    </div>
  );
};

export default Loader;