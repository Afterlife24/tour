// WebXR type definitions
declare global {
  interface Navigator {
    xr?: XRSystem;
  }

  interface XRSystem {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
  }

  interface XRSession {
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    end(): Promise<void>;
    renderState: XRRenderState;
    updateRenderState(state: XRRenderStateInit): void;
    requestHitTestSource?(options: XRHitTestOptionsInit): Promise<XRHitTestSource>;
    persistentAnchors?: Set<string>;
    restorePersistentAnchor?(uuid: string): Promise<XRAnchor>;
  }

  interface XRFrame {
    session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
    getPose(space: XRSpace, referenceSpace: XRReferenceSpace): XRPose | null;
    getHitTestResults?(source: XRHitTestSource): XRHitTestResult[];
    createAnchor?(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
  }

  interface XRAnchor {
    anchorSpace: XRSpace;
    requestPersistentHandle?(): Promise<string>;
    delete(): void;
  }

  interface XRRigidTransform {
    position: DOMPointReadOnly;
    orientation: DOMPointReadOnly;
    matrix: Float32Array;
  }

  interface XRHitTestResult {
    getPose(referenceSpace: XRReferenceSpace): XRPose | null;
    createAnchor?(): Promise<XRAnchor>;
  }

  interface XRViewerPose {
    transform: XRRigidTransform;
    views: XRView[];
  }

  interface XRView {
    eye: XREye;
    projectionMatrix: Float32Array;
    transform: XRRigidTransform;
  }

  interface XRPose {
    transform: XRRigidTransform;
    emulatedPosition: boolean;
  }

  type XRSessionMode = 'immersive-ar' | 'immersive-vr' | 'inline';
  type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';
  type XREye = 'left' | 'right' | 'none';
  type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;

  interface XRRenderState {
    baseLayer?: XRWebGLLayer;
  }

  interface XRRenderStateInit {
    baseLayer?: XRWebGLLayer;
  }

  interface XRSessionInit {
    requiredFeatures?: string[];
    optionalFeatures?: string[];
  }

  interface XRWebGLLayer {
    framebuffer: WebGLFramebuffer | null;
    framebufferWidth: number;
    framebufferHeight: number;
    getViewport(view: XRView): XRViewport;
  }

  interface XRViewport {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface XRSpace {}
  interface XRReferenceSpace extends XRSpace {}
  interface XRHitTestSource {}
  interface XRHitTestOptionsInit {
    space: XRSpace;
  }

  var XRWebGLLayer: {
    prototype: XRWebGLLayer;
    new(session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext): XRWebGLLayer;
  };

  var XRRigidTransform: {
    prototype: XRRigidTransform;
    new(position?: DOMPointInit, orientation?: DOMPointInit): XRRigidTransform;
  };
}

export {};