import React from 'react';
import { AlertTriangle, Smartphone, Wifi } from 'lucide-react';

interface WebXRCompatibilityProps {
  onRetry: () => void;
}

const WebXRCompatibility: React.FC<WebXRCompatibilityProps> = ({ onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center text-white border border-white/20">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h1 className="text-2xl font-bold mb-2">WebXR Not Supported</h1>
          <p className="text-white/80">
            Your browser or device doesn't support WebXR for augmented reality experiences.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3 text-left">
            <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-medium">Use a compatible device</p>
              <p className="text-sm text-white/70">Android phone with ARCore or iPhone with ARKit</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-left">
            <Wifi className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-medium">Try these browsers</p>
              <p className="text-sm text-white/70">Chrome 79+, Edge 79+, or Samsung Internet</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="font-medium">Enable WebXR flags</p>
              <p className="text-sm text-white/70">chrome://flags - Enable WebXR Device API</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105"
          >
            Check Again
          </button>
          
          <p className="text-xs text-white/60">
            Requirements: HTTPS connection, camera permissions, and WebXR-compatible device
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebXRCompatibility;