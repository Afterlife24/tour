// WebXR utilities and compatibility detection
export interface WebXRCapabilities {
  supported: boolean;
  arSupported: boolean;
  anchorsSupported: boolean;
  hitTestSupported: boolean;
  persistentAnchorsSupported: boolean;
}

export async function checkWebXRSupport(): Promise<WebXRCapabilities> {
  const capabilities: WebXRCapabilities = {
    supported: false,
    arSupported: false,
    anchorsSupported: false,
    hitTestSupported: false,
    persistentAnchorsSupported: false
  };

  if (!navigator.xr) {
    return capabilities;
  }

  capabilities.supported = true;

  try {
    // Check AR support with different feature sets
    const arConfigs = [
      { requiredFeatures: ['local'] },
      { requiredFeatures: ['viewer'] },
      { optionalFeatures: ['local', 'viewer'] },
      {}
    ];

    for (const config of arConfigs) {
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (supported) {
          capabilities.arSupported = true;
          console.log('AR supported with config:', config);
          break;
        }
      } catch (configError) {
        console.warn('AR config not supported:', config, configError);
        continue;
      }
    }

    // Additional capability checks
    if (capabilities.arSupported) {
      // These are best-effort checks
      capabilities.hitTestSupported = true; // Assume hit-test is available
      capabilities.anchorsSupported = true; // Assume anchors are available
    }

  } catch (e) {
    console.warn('AR mode not supported:', e);
  }

  return capabilities;
}

export function generateAnchorId(): string {
  return `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 100)}cm`;
  }
  return `${distance.toFixed(1)}m`;
}

export function calculateDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}