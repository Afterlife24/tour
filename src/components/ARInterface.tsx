import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react';

interface ARInterfaceProps {
  onCreateAnchor: () => void;
  onToggleAnchors: () => void;
  onClearAnchors: () => void;
  anchorsVisible: boolean;
  anchorCount: number;
  isCreating: boolean;
}

const ARInterface: React.FC<ARInterfaceProps> = ({
  onCreateAnchor,
  onToggleAnchors,
  onClearAnchors,
  anchorsVisible,
  anchorCount,
  isCreating
}) => {
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Top Status Bar */}
      <div className="absolute top-16 left-4 right-4 flex justify-between items-center pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-lg rounded-2xl px-4 py-2 text-white border border-white/20">
          <p className="text-sm font-medium">
            {anchorCount} {anchorCount === 1 ? 'Anchor' : 'Anchors'}
          </p>
        </div>
        
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-black/60 backdrop-blur-lg rounded-full p-3 text-white hover:bg-black/80 transition-colors border border-white/20"
        >
          <RotateCcw className={`w-5 h-5 transition-transform ${showControls ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-12 h-12 relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-2xl border-2 border-purple-500" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-white rounded-full opacity-60 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 border border-purple-400 rounded-full opacity-40" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-4 right-4 pointer-events-auto">
        {showControls && (
          <div className="flex justify-center space-x-4">
            {/* Create Anchor Button */}
            <button
              onClick={onCreateAnchor}
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white p-5 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110 disabled:transform-none border-2 border-white/20"
            >
              <Plus className={`w-7 h-7 ${isCreating ? 'animate-spin' : ''}`} />
            </button>

            {/* Toggle Anchors Visibility */}
            <button
              onClick={onToggleAnchors}
              className="bg-black/60 backdrop-blur-lg hover:bg-black/80 text-white p-5 rounded-full shadow-lg transition-colors border border-white/20"
            >
              {anchorsVisible ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
            </button>

            {/* Clear All Anchors */}
            {anchorCount > 0 && (
              <button
                onClick={onClearAnchors}
                className="bg-red-500/80 backdrop-blur-lg hover:bg-red-600/90 text-white p-5 rounded-full shadow-lg transition-colors border border-white/20"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-white text-sm bg-black/60 backdrop-blur-lg rounded-2xl px-4 py-3 inline-block border border-white/20 shadow-lg">
            {isCreating 
              ? 'Creating anchor...' 
              : 'Point camera at surface and tap + to create anchor'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ARInterface;