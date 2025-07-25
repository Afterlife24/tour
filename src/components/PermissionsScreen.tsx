import React, { useState } from 'react';
import { Camera, MapPin, Smartphone, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Permission {
  name: string;
  icon: React.ReactNode;
  description: string;
  required: boolean;
  status: 'pending' | 'granted' | 'denied';
  apiName: string;
}

interface PermissionsScreenProps {
  onPermissionsGranted: () => void;
  onPermissionsDenied: (deniedPermissions: string[]) => void;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({
  onPermissionsGranted,
  onPermissionsDenied
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      name: 'Camera Access',
      icon: <Camera className="w-6 h-6" />,
      description: 'Required to view the real world through your device camera for AR experiences',
      required: true,
      status: 'pending',
      apiName: 'camera'
    },
    {
      name: 'Device Motion',
      icon: <Smartphone className="w-6 h-6" />,
      description: 'Needed to track device orientation and movement for accurate AR positioning',
      required: true,
      status: 'pending',
      apiName: 'devicemotion'
    },
    {
      name: 'Location Access',
      icon: <MapPin className="w-6 h-6" />,
      description: 'Optional: Helps improve anchor accuracy and enables location-based features',
      required: false,
      status: 'pending',
      apiName: 'geolocation'
    }
  ]);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      // Stop the stream immediately as we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  };

  const requestDeviceMotionPermission = async (): Promise<boolean> => {
    try {
      // For iOS 13+ devices, we need to request permission for device motion
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      }
      // For other devices, assume permission is granted if the API exists
      return typeof DeviceMotionEvent !== 'undefined';
    } catch (error) {
      console.error('Device motion permission denied:', error);
      return false;
    }
  };

  const requestGeolocationPermission = async (): Promise<boolean> => {
    try {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    } catch (error) {
      console.error('Geolocation permission denied:', error);
      return false;
    }
  };

  const requestAllPermissions = async () => {
    setIsRequesting(true);
    const updatedPermissions = [...permissions];
    const deniedPermissions: string[] = [];

    try {
      // Request camera permission
      const cameraGranted = await requestCameraPermission();
      const cameraIndex = updatedPermissions.findIndex(p => p.apiName === 'camera');
      updatedPermissions[cameraIndex].status = cameraGranted ? 'granted' : 'denied';
      if (!cameraGranted) deniedPermissions.push('Camera Access');

      // Request device motion permission
      const motionGranted = await requestDeviceMotionPermission();
      const motionIndex = updatedPermissions.findIndex(p => p.apiName === 'devicemotion');
      updatedPermissions[motionIndex].status = motionGranted ? 'granted' : 'denied';
      if (!motionGranted) deniedPermissions.push('Device Motion');

      // Request geolocation permission (optional)
      const locationGranted = await requestGeolocationPermission();
      const locationIndex = updatedPermissions.findIndex(p => p.apiName === 'geolocation');
      updatedPermissions[locationIndex].status = locationGranted ? 'granted' : 'denied';
      if (!locationGranted) deniedPermissions.push('Location Access');

      setPermissions(updatedPermissions);

      // Check if all required permissions are granted
      const requiredPermissionsGranted = updatedPermissions
        .filter(p => p.required)
        .every(p => p.status === 'granted');

      if (requiredPermissionsGranted) {
        setTimeout(() => onPermissionsGranted(), 1000);
      } else {
        const requiredDenied = deniedPermissions.filter(name => 
          updatedPermissions.find(p => p.name === name)?.required
        );
        onPermissionsDenied(requiredDenied);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      onPermissionsDenied(['Unknown error occurred']);
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const allRequiredGranted = permissions
    .filter(p => p.required)
    .every(p => p.status === 'granted');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-white border border-white/20">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-2xl font-bold mb-2">Permissions Required</h1>
          <p className="text-white/80">
            To provide the best AR experience, we need access to your device's capabilities
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {permissions.map((permission, index) => (
            <div 
              key={index}
              className="flex items-start space-x-4 p-4 bg-white/5 rounded-2xl border border-white/10"
            >
              <div className="flex-shrink-0 text-blue-400 mt-1">
                {permission.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-white">
                    {permission.name}
                    {permission.required && (
                      <span className="text-red-400 text-sm ml-1">*</span>
                    )}
                  </h3>
                  {getStatusIcon(permission.status)}
                </div>
                <p className="text-sm text-white/70">
                  {permission.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-white/60 mb-4">
            <span className="text-red-400">*</span> Required permissions
          </p>
          
          {!allRequiredGranted && (
            <button
              onClick={requestAllPermissions}
              disabled={isRequesting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {isRequesting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Requesting Permissions...</span>
                </div>
              ) : (
                'Grant Permissions'
              )}
            </button>
          )}

          {allRequiredGranted && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-green-400 font-medium mb-2">All Required Permissions Granted!</p>
              <p className="text-sm text-white/70">Starting AR experience...</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-xs text-white/50">
            <AlertTriangle className="w-3 h-3" />
            <span>Your privacy is protected. Permissions are only used for AR functionality.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsScreen;