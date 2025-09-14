import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6 m-4 max-w-sm w-full transform transition-transform duration-300 ease-in-out scale-100 animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
