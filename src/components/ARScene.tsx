import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AnchorData } from '../utils/storage';
import { generateAnchorId } from '../utils/webxr';
import ARInterface from './ARInterface';
import AnchorCreationModal from './AnchorCreationModal';
import DemoARScene from './DemoARScene';

interface ARSceneProps {
  onError: (error: string) => void;
}

const ARScene: React.FC<ARSceneProps> = ({ onError }) => {
  const [useDemoMode, setUseDemoMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const frameRef = useRef<number>(0);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const anchorsRef = useRef<Map<string, { anchor: XRAnchor; mesh: THREE.Group }>>(new Map());
  const reticleRef = useRef<THREE.Mesh | null>(null);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingAnchorPosition, setPendingAnchorPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const [anchorsVisible, setAnchorsVisible] = useState(true);
  const [anchorCount, setAnchorCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Simple localStorage functions
  const saveAnchor = (anchor: AnchorData) => {
    try {
      const anchors = getAllAnchors();
      anchors.push(anchor);
      localStorage.setItem('spatial-anchors', JSON.stringify(anchors));
    } catch (error) {
      console.error('Failed to save anchor:', error);
    }
  };

  const getAllAnchors = (): AnchorData[] => {
    try {
      const stored = localStorage.getItem('spatial-anchors');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load anchors:', error);
      return [];
    }
  };

  const clearAllAnchors = () => {
    try {
      localStorage.removeItem('spatial-anchors');
    } catch (error) {
      console.error('Failed to clear anchors:', error);
    }
  };

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    renderer.setClearColor(0x000000, 0);
    
    containerRef.current.appendChild(renderer.domElement);

    // Create reticle for hit testing visualization
    const reticleGeometry = new THREE.RingGeometry(0.02, 0.04, 32);
    const reticleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    reticleRef.current = reticle;

    return { scene, camera, renderer };
  }, []);

  // Create anchor visualization mesh
  const createAnchorMesh = useCallback((anchorData: AnchorData) => {
    const group = new THREE.Group();
    
    // Create anchor pin
    const pinGeometry = new THREE.ConeGeometry(0.02, 0.1, 8);
    const pinMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.9
    });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    pin.position.y = 0.05;
    group.add(pin);

    // Create text sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const fontSize = 32;
    canvas.width = 512;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(139, 92, 246, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = `${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    const text = anchorData.text.length > 30 ? anchorData.text.substring(0, 30) + '...' : anchorData.text;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.y = 0.15;
    sprite.scale.set(0.2, 0.05, 1);
    group.add(sprite);

    return group;
  }, []);

  // Load existing anchors from storage
  const loadStoredAnchors = useCallback(async () => {
    try {
      const storedAnchors = getAllAnchors();
      setAnchorCount(storedAnchors.length);
      
      // For demonstration, create visual anchors at stored positions
      storedAnchors.forEach((anchorData) => {
        if (sceneRef.current) {
          const mesh = createAnchorMesh(anchorData);
          mesh.position.set(anchorData.position.x, anchorData.position.y, anchorData.position.z);
          mesh.visible = anchorsVisible;
          sceneRef.current.add(mesh);
          
          // Store reference for later management
          anchorsRef.current.set(anchorData.id, { 
            anchor: null as any, // In a real implementation, this would be restored from persistent handles
            mesh 
          });
        }
      });
    } catch (error) {
      console.error('Failed to load stored anchors:', error);
    }
  }, [anchorsVisible, createAnchorMesh, getAllAnchors]);

  // Start AR session
  const startARSession = useCallback(async () => {
    if (!navigator.xr) {
      console.warn('WebXR not supported, switching to demo mode');
      setUseDemoMode(true);
      return;
    }

    try {
      // Try different session configurations with fallbacks
      let session: XRSession | null = null;
      const sessionConfigs = [
        // Most basic configuration
        {},
        // Try with just viewer
        {
          optionalFeatures: ['viewer']
        },
        // Try with local
        {
          optionalFeatures: ['local']
        },
        {
          optionalFeatures: ['local', 'viewer']
        },
        {
          optionalFeatures: ['hit-test', 'local', 'viewer']
        },
        {
          optionalFeatures: ['hit-test', 'anchors', 'local', 'local-floor', 'viewer']
        }
      ];

      for (const config of sessionConfigs) {
        try {
          session = await navigator.xr.requestSession('immersive-ar', config);
          console.log('AR session started with config:', config);
          break;
        } catch (configError) {
          console.warn('Failed to start session with config:', config, configError);
          continue;
        }
      }

      if (!session) {
        console.warn('Failed to create AR session with any configuration, switching to demo mode');
        setUseDemoMode(true);
        return;
      }

      sessionRef.current = session;
      
      if (rendererRef.current) {
        await rendererRef.current.xr.setSession(session);
      }

      // Try different reference space types with fallbacks
      let referenceSpace: XRReferenceSpace | null = null;
      const referenceSpaceTypes: XRReferenceSpaceType[] = ['viewer', 'local', 'local-floor', 'bounded-floor', 'unbounded'];
      
      for (const spaceType of referenceSpaceTypes) {
        try {
          referenceSpace = await session.requestReferenceSpace(spaceType);
          console.log('Using reference space:', spaceType);
          break;
        } catch (spaceError) {
          console.warn(`Failed to get ${spaceType} reference space:`, spaceError);
          continue;
        }
      }

      if (!referenceSpace) {
        console.warn('Failed to obtain any reference space, switching to demo mode');
        session.end();
        setUseDemoMode(true);
        return;
      }
      
      // Setup hit test source
      if (session.requestHitTestSource) {
        try {
          hitTestSourceRef.current = await session.requestHitTestSource({ 
            space: referenceSpace 
          });
          console.log('Hit test source created successfully');
        } catch (error) {
          console.warn('Hit test not supported:', error);
        }
      }

      // Start render loop
      const render = (time: number, frame: XRFrame) => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

        // Handle hit test results
        if (hitTestSourceRef.current && frame.getHitTestResults) {
          try {
            const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
            
            if (hitTestResults.length > 0 && reticleRef.current && referenceSpace) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);
              
              if (pose) {
                reticleRef.current.visible = true;
                reticleRef.current.matrix.fromArray(pose.transform.matrix);
              }
            } else if (reticleRef.current) {
              reticleRef.current.visible = false;
            }
          } catch (hitTestError) {
            console.warn('Hit test error:', hitTestError);
            reticleRef.current.visible = false;
          }
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      // Set reference space type based on what we successfully obtained
      rendererRef.current.setAnimationLoop(render);
      
      setIsSessionActive(true);
      
      // Load existing anchors
      await loadStoredAnchors();

      session.addEventListener('end', () => {
        setIsSessionActive(false);
        if (rendererRef.current) {
          rendererRef.current.setAnimationLoop(null);
        }
      });

    } catch (error) {
      console.error('AR Session Error:', error);
      console.warn('AR session failed, switching to demo mode:', error);
      setUseDemoMode(true);
    }
  }, [loadStoredAnchors]);

  // Handle anchor creation
  const handleCreateAnchor = useCallback(() => {
    if (!reticleRef.current?.visible) return;
    
    setIsCreating(true);
    
    // Get reticle position
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(reticleRef.current.matrix);
    
    setPendingAnchorPosition({
      x: position.x,
      y: position.y,
      z: position.z
    });
    
    setShowModal(true);
    setIsCreating(false);
  }, []);

  // Save anchor with text
  const handleSaveAnchor = useCallback(async (text: string) => {
    if (!pendingAnchorPosition || !sessionRef.current || !sceneRef.current) return;

    try {
      const anchorId = generateAnchorId();
      const anchorData: AnchorData = {
        id: anchorId,
        text,
        position: pendingAnchorPosition,
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        timestamp: Date.now()
      };

      // Save to IndexedDB
      saveAnchor(anchorData);
      
      // Create visual representation
      const mesh = createAnchorMesh(anchorData);
      mesh.position.set(
        pendingAnchorPosition.x,
        pendingAnchorPosition.y,
        pendingAnchorPosition.z
      );
      mesh.visible = anchorsVisible;
      sceneRef.current.add(mesh);
      
      // Store reference
      anchorsRef.current.set(anchorId, {
        anchor: null as any, // Would be actual XRAnchor in full implementation
        mesh
      });
      
      setAnchorCount(prev => prev + 1);
      setPendingAnchorPosition(null);
      
    } catch (error) {
      console.error('Failed to save anchor:', error);
      throw error;
    }
  }, [pendingAnchorPosition, anchorsVisible, createAnchorMesh, saveAnchor]);

  // Toggle anchor visibility
  const handleToggleAnchors = useCallback(() => {
    const newVisibility = !anchorsVisible;
    setAnchorsVisible(newVisibility);
    
    anchorsRef.current.forEach(({ mesh }) => {
      mesh.visible = newVisibility;
    });
  }, [anchorsVisible]);

  // Clear all anchors
  const handleClearAnchors = useCallback(async () => {
    try {
      clearAllAnchors();
      
      // Remove visual representations
      anchorsRef.current.forEach(({ mesh }) => {
        if (sceneRef.current) {
          sceneRef.current.remove(mesh);
        }
      });
      
      anchorsRef.current.clear();
      setAnchorCount(0);
      
    } catch (error) {
      console.error('Failed to clear anchors:', error);
    }
  }, [clearAllAnchors]);

  // Initialize scene and start AR session
  useEffect(() => {
    initScene();
    startARSession();

    return () => {
      if (sessionRef.current) {
        sessionRef.current.end();
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene, startARSession]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && cameraRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If demo mode is enabled, use the demo component
  if (useDemoMode) {
    return <DemoARScene onError={onError} />;
  }

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Always show interface when session is active */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Debug info */}
        <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs pointer-events-auto">
          Session: {isSessionActive ? 'Active' : 'Inactive'}<br/>
          Anchors: {anchorCount}<br/>
          Creating: {isCreating ? 'Yes' : 'No'}<br/>
          Mode: WebXR
        </div>
        
        <ARInterface
          onCreateAnchor={handleCreateAnchor}
          onToggleAnchors={handleToggleAnchors}
          onClearAnchors={handleClearAnchors}
          anchorsVisible={anchorsVisible}
          anchorCount={anchorCount}
          isCreating={isCreating}
        />
      </div>

      <AnchorCreationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPendingAnchorPosition(null);
        }}
        onSave={handleSaveAnchor}
        position={pendingAnchorPosition}
      />
    </div>
  );
};

export default ARScene;