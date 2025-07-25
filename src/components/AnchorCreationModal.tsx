import React, { useState } from 'react';
import { X, MapPin, Type } from 'lucide-react';

interface AnchorCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  position?: { x: number; y: number; z: number };
}

const AnchorCreationModal: React.FC<AnchorCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  position
}) => {
  const [text, setText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsCreating(true);
    try {
      await onSave(text.trim());
      setText('');
      onClose();
    } catch (error) {
      console.error('Failed to create anchor:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Create Anchor</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {position && (
          <div className="mb-4 p-3 bg-blue-50 rounded-2xl">
            <p className="text-xs text-blue-700 font-medium">Position</p>
            <p className="text-sm text-blue-600 font-mono">
              x: {position.x.toFixed(2)}, y: {position.y.toFixed(2)}, z: {position.z.toFixed(2)}
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Type className="w-4 h-4" />
            <span>Annotation Text</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your annotation..."
            className="w-full p-3 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {text.length}/200 characters
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 text-gray-700 font-medium rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() || isCreating}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Anchor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnchorCreationModal;