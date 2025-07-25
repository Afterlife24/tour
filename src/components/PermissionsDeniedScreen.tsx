import React from 'react';
import { XCircle, RefreshCw, Settings, AlertTriangle } from 'lucide-react';

interface PermissionsDeniedScreenProps {
  deniedPermissions: string[];
  onRetry: () => void;
}

const PermissionsDeniedScreen: React.FC<PermissionsDeniedScreenProps> = ({
  deniedPermissions,
  onRetry
}) => {
  const openSettings = () => {
    // This will prompt the user to manually enable permissions in browser settings
    alert('Please enable the required permissions in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Allow Camera and other permissions\n3. Refresh the page');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center text-white border border-white/20">
        <div className="mb-6">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Permissions Required</h1>
          <p className="text-white/80">
            Some required permissions were denied. The AR experience needs these to function properly.
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-4">
            <h3 className="font-medium text-red-300 mb-2">Denied Permissions:</h3>
            <ul className="text-sm text-red-200 space-y-1">
              {deniedPermissions.map((permission, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="font-medium text-blue-300 mb-1">Why we need these permissions:</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Camera: To see the real world for AR</li>
                  <li>• Device Motion: To track your device position</li>
                  <li>• Location: To improve anchor accuracy (optional)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <button 
            onClick={openSettings}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20"
          >
            <Settings className="w-5 h-5" />
            <span>Open Settings Guide</span>
          </button>
        </div>

        <div className="mt-6 text-xs text-white/60">
          <p>If you continue to have issues, try:</p>
          <p>• Refreshing the page</p>
          <p>• Using Chrome or Edge browser</p>
          <p>• Checking your device supports WebXR</p>
        </div>
      </div>
    </div>
  );
};

export default PermissionsDeniedScreen;