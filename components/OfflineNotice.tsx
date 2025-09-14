import React from 'react';

const OfflineNotice: React.FC = () => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20">
      <div className="px-5 py-3 bg-red-900/50 backdrop-blur-xl rounded-full border border-red-500/50 shadow-lg text-white text-sm">
        Elix needs internet to think 🌐
      </div>
    </div>
  );
};

export default OfflineNotice;