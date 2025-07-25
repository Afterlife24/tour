import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AnchorData } from '../utils/storage';
import { generateAnchorId } from '../utils/webxr';
import ARInterface from './ARInterface';
import AnchorCreationModal from './AnchorCreationModal';

interface DemoARSceneProps {
  onError: (error: string) => void;
}

const DemoARScene: React.FC<DemoARSceneProps> = ({ onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const anchorsRef = useRef<Map<string, { mesh: THREE.Group }>>(new Map());
  const animationFrameRef = useRef<number>(0);

  const [isActive, setIsActive] = useState(false);
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

  // Initialize camera stream
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      return stream;
    } catch (error) {
      console.error('Failed to access camera:', error);
      onError('Failed to access camera for demo mode');
      throw error;
    }
  }, [onError]);

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
    renderer.setClearColor(0x000000, 0);
    
    containerRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

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
      
      storedAnchors.forEach((anchorData) => {
        if (sceneRef.current) {
          const mesh = createAnchorMesh(anchorData);
          mesh.position.set(anchorData.position.x, anchorData.position.y, anchorData.position.z);
          mesh.visible = anchorsVisible;
          sceneRef.current.add(mesh);
          
          anchorsRef.current.set(anchorData.id, { mesh });
        }
      });
    } catch (error) {
      console.error('Failed to load stored anchors:', error);
    }
  }, [anchorsVisible, createAnchorMesh]);

  // Start demo mode
  const startDemo = useCallback(async () => {
    try {
      await initCamera();
      initScene();
      await loadStoredAnchors();

      // Start render loop
      const render = () => {
        if (sceneRef.current && rendererRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();
      setIsActive(true);

    } catch (error) {
      console.error('Demo mode error:', error);
      onError(`Failed to start demo mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [initCamera, initScene, loadStoredAnchors, onError]);

  // Handle anchor creation
  const handleCreateAnchor = useCallback(() => {
    setIsCreating(true);
    
    // Create anchor at a random position in front of camera for demo
    const position = {
      x: (Math.random() - 0.5) * 2,
      y: Math.random() * 0.5,
      z: -1 - Math.random() * 2
    };
    
    setPendingAnchorPosition(position);
    setShowModal(true);
    setIsCreating(false);
  }, []);

  // Save anchor with text
  const handleSaveAnchor = useCallback(async (text: string) => {
    if (!pendingAnchorPosition || !sceneRef.current) return;

    try {
      const anchorId = generateAnchorId();
      const anchorData: AnchorData = {
        id: anchorId,
        text,
        position: pendingAnchorPosition,
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        timestamp: Date.now()
      };

      saveAnchor(anchorData);
      
      const mesh = createAnchorMesh(anchorData);
      mesh.position.set(
        pendingAnchorPosition.x,
        pendingAnchorPosition.y,
        pendingAnchorPosition.z
      );
      mesh.visible = anchorsVisible;
      sceneRef.current.add(mesh);
      
      anchorsRef.current.set(anchorId, { mesh });
      
      setAnchorCount(prev => prev + 1);
      setPendingAnchorPosition(null);
      
    } catch (error) {
      console.error('Failed to save anchor:', error);
      throw error;
    }
  }, [pendingAnchorPosition, anchorsVisible, createAnchorMesh]);

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
  }, []);

  // Initialize demo mode
  useEffect(() => {
    startDemo();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [startDemo]);

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

  return (
    <div className="relative w-full h-full bg-black">
      {/* Camera video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      
      {/* Three.js canvas overlay */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Debug info */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-xs pointer-events-auto">
          Session: {isActive ? 'Active' : 'Inactive'}<br/>
          Anchors: {anchorCount}<br/>
          Creating: {isCreating ? 'Yes' : 'No'}<br/>
          Mode: Demo (WebXR not supported)
        </div>
        
        {/* Demo mode notice */}
        <div className="absolute top-4 right-4 bg-yellow-500/80 text-black p-2 rounded text-xs pointer-events-auto max-w-48">
          <strong>Demo Mode:</strong> WebXR not supported on this device. Anchors will be placed randomly for demonstration.
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

export default DemoARScene;