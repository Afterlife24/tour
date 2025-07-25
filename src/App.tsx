import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, AlertTriangle } from 'lucide-react';
import ARScene from './components/ARScene';
import WebXRCompatibility from './components/WebXRCompatibility';
import PermissionsScreen from './components/PermissionsScreen';
import PermissionsDeniedScreen from './components/PermissionsDeniedScreen';
import { checkWebXRSupport, WebXRCapabilities } from './utils/webxr';

function App() {
  const [capabilities, setCapabilities] = useState<WebXRCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionsState, setPermissionsState] = useState<'checking' | 'requesting' | 'granted' | 'denied'>('checking');
  const [deniedPermissions, setDeniedPermissions] = useState<string[]>([]);

  const checkSupport = async () => {
    setIsLoading(true);
    setError(null);
    setPermissionsState('checking');
    
    try {
      const caps = await checkWebXRSupport();
      setCapabilities(caps);
      
      // If WebXR is supported, move to permissions step
      if (caps.supported && caps.arSupported) {
        setPermissionsState('requesting');
      }
    } catch (err) {
      setError('Failed to check WebXR support');
      console.error('WebXR support check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSupport();
  }, []);

  const handleRetry = () => {
    checkSupport();
  };

  const handlePermissionsGranted = () => {
    setPermissionsState('granted');
  };

  const handlePermissionsDenied = (denied: string[]) => {
    setDeniedPermissions(denied);
    setPermissionsState('denied');
  };

  const handlePermissionsRetry = () => {
    setPermissionsState('requesting');
    setDeniedPermissions([]);
  };
  const handleARError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">
            {permissionsState === 'checking' ? 'Checking WebXR Support...' : 'Initializing AR Experience...'}
          </p>
          <p className="text-sm text-white/70 mt-2">
            {permissionsState === 'checking' 
              ? 'Detecting device capabilities...' 
              : 'Preparing camera and sensors...'
            }
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center text-white border border-white/20">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-white/80 mb-6">{error}</p>
          <button 
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!capabilities?.supported || !capabilities?.arSupported) {
    return <WebXRCompatibility onRetry={handleRetry} />;
  }

  // Show permissions screen if we need to request permissions
  if (permissionsState === 'requesting') {
    return (
      <PermissionsScreen 
        onPermissionsGranted={handlePermissionsGranted}
        onPermissionsDenied={handlePermissionsDenied}
      />
    );
  }

  // Show permissions denied screen if permissions were denied
  if (permissionsState === 'denied') {
    return (
      <PermissionsDeniedScreen 
        deniedPermissions={deniedPermissions}
        onRetry={handlePermissionsRetry}
      />
    );
  }

  // Only show AR scene if permissions are granted
  if (permissionsState !== 'granted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">Preparing AR Experience...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <ARScene onError={handleARError} />
      
      {/* Welcome overlay */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 text-center text-white pointer-events-none">
        <h1 className="text-xl font-bold mb-1">Spatial Annotations</h1>
        <p className="text-sm text-white/80">Create anchors in your real-world space</p>
      </div>
    </div>
  );
}

export default App;