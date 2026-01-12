import { useState, useEffect, useCallback, useRef } from 'react';

// Type definitions for Perfect Corp SDK
interface YMKFaceQuality {
  hasFace: boolean;
  area: 'good' | 'notgood' | 'toosmall' | 'outofboundary';
  frontal: 'good' | 'notgood';
  lighting: 'good' | 'ok' | 'notgood';
  nakedeye: 'good' | 'notgood';
  faceangle: 'good' | 'upward' | 'downward' | 'leftward' | 'rightward' | 'lefttilt' | 'righttilt';
}

interface YMKCapturedImage {
  phase: number;
  image: string | Blob;
  width: number;
  height: number;
}

interface YMKCapturedResult {
  mode: string;
  images: YMKCapturedImage[];
}

interface YMKInitOptions {
  faceDetectionMode: 'skincare' | 'hdskincare' | 'shadefinder' | 'makeup' | 'hairlength' | 'hairfrizziness' | 'hairtype' | 'ring' | 'wrist' | 'necklace' | 'earring';
  imageFormat: 'base64' | 'blob';
  language: string;
  width?: number;
  height?: number;
  disableCameraResolutionCheck?: boolean;
}

interface YMKModule {
  init: (options: YMKInitOptions) => void;
  openCameraKit: () => void;
  close: () => void;
  pause: () => void;
  resume: (restartWebcam?: boolean) => void;
  isLoaded: () => boolean;
  addEventListener: (event: string, callback: (data?: any) => void) => string;
  removeEventListener: (id: string) => void;
}

declare global {
  interface Window {
    YMK: YMKModule;
    ymkAsyncInit: () => void;
  }
}

type CaptureMode = 'rest' | 'smile';

interface CapturedPhoto {
  preview: string;
  file: File;
  wasAdapted?: boolean;
  lowResWarning?: boolean;
}

export interface UsePerfectCorpCameraReturn {
  isSDKLoaded: boolean;
  isSDKLoading: boolean;
  isCameraOpen: boolean;
  isCapturing: boolean;
  faceQuality: YMKFaceQuality | null;
  error: string | null;
  restPhoto: CapturedPhoto | null;
  smilePhoto: CapturedPhoto | null;
  currentMode: CaptureMode;
  readyForAnalysis: boolean;
  openCamera: () => void;
  closeCamera: () => void;
  setCurrentMode: (mode: CaptureMode) => void;
  retakePhoto: (mode: CaptureMode) => void;
  clearPhotos: () => void;
}

const SDK_URL = 'https://plugins-media.makeupar.com/v2.2-camera-kit/sdk.js';

export function usePerfectCorpCamera(): UsePerfectCorpCameraReturn {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isSDKLoading, setIsSDKLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceQuality, setFaceQuality] = useState<YMKFaceQuality | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restPhoto, setRestPhoto] = useState<CapturedPhoto | null>(null);
  const [smilePhoto, setSmilePhoto] = useState<CapturedPhoto | null>(null);
  const [currentMode, setCurrentMode] = useState<CaptureMode>('rest');
  
  const listenerIdsRef = useRef<string[]>([]);
  const sdkLoadedRef = useRef(false);

  // Load SDK script
  const loadSDK = useCallback(() => {
    if (sdkLoadedRef.current || window.YMK) {
      setIsSDKLoaded(true);
      return Promise.resolve();
    }

    if (isSDKLoading) {
      return Promise.resolve();
    }

    setIsSDKLoading(true);
    setError(null);

    return new Promise<void>((resolve, reject) => {
      // Setup async init callback
      window.ymkAsyncInit = () => {
        console.log('[PerfectCorp] SDK async init called');
        sdkLoadedRef.current = true;
        setIsSDKLoaded(true);
        setIsSDKLoading(false);
        resolve();
      };

      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${SDK_URL}"]`);
      if (existingScript) {
        if (window.YMK) {
          sdkLoadedRef.current = true;
          setIsSDKLoaded(true);
          setIsSDKLoading(false);
          resolve();
        }
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = SDK_URL;
      
      script.onerror = () => {
        const errorMsg = 'Error cargando el SDK de cámara';
        console.error('[PerfectCorp] SDK load error');
        setError(errorMsg);
        setIsSDKLoading(false);
        reject(new Error(errorMsg));
      };

      document.head.appendChild(script);
    });
  }, [isSDKLoading]);

  // Setup event listeners
  const setupListeners = useCallback(() => {
    if (!window.YMK) return;

    // Clear previous listeners
    listenerIdsRef.current.forEach(id => {
      try {
        window.YMK.removeEventListener(id);
      } catch (e) {
        // Ignore
      }
    });
    listenerIdsRef.current = [];

    // Camera opened
    const openedId = window.YMK.addEventListener('cameraOpened', () => {
      console.log('[PerfectCorp] Camera opened');
      setIsCameraOpen(true);
      setIsCapturing(false);
    });
    listenerIdsRef.current.push(openedId);

    // Camera closed
    const closedId = window.YMK.addEventListener('cameraClosed', () => {
      console.log('[PerfectCorp] Camera closed');
      setIsCameraOpen(false);
    });
    listenerIdsRef.current.push(closedId);

    // Camera failed
    const failedId = window.YMK.addEventListener('cameraFailed', (data: any) => {
      console.error('[PerfectCorp] Camera failed:', data);
      let errorMsg = 'Error de cámara';
      if (data === 'error_permission_denied') {
        errorMsg = 'Permiso de cámara denegado. Por favor permite el acceso.';
      } else if (data === 'error_resolution_unsupported') {
        errorMsg = 'Resolución de cámara no soportada.';
      } else if (data === 'error_access_failed') {
        errorMsg = 'No se pudo acceder a la cámara.';
      }
      setError(errorMsg);
      setIsCameraOpen(false);
    });
    listenerIdsRef.current.push(failedId);

    // Face quality changed
    const qualityId = window.YMK.addEventListener('faceQualityChanged', (quality: YMKFaceQuality) => {
      setFaceQuality(quality);
    });
    listenerIdsRef.current.push(qualityId);

    // Image captured
    const capturedId = window.YMK.addEventListener('faceDetectionCaptured', (result: YMKCapturedResult) => {
      console.log('[PerfectCorp] Image captured:', result.mode, result.images.length);
      
      if (result.images.length > 0) {
        const capturedImage = result.images[0];
        const imageData = capturedImage.image;
        
        // Convert to File and preview
        const isBase64 = typeof imageData === 'string';
        const preview = isBase64 ? imageData : URL.createObjectURL(imageData as Blob);
        
        // Create File object
        const createFile = async () => {
          let blob: Blob;
          if (isBase64) {
            // Convert base64 to blob
            const response = await fetch(imageData as string);
            blob = await response.blob();
          } else {
            blob = imageData as Blob;
          }
          
          const fileName = `capture-${currentMode}-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          
          const photo: CapturedPhoto = {
            preview,
            file,
            wasAdapted: false,
            lowResWarning: capturedImage.width < 800 || capturedImage.height < 800
          };
          
          if (currentMode === 'rest') {
            setRestPhoto(photo);
            // Auto-advance to smile mode
            setTimeout(() => {
              setCurrentMode('smile');
            }, 500);
          } else {
            setSmilePhoto(photo);
          }
          
          // Close camera after capture
          window.YMK.close();
          setIsCameraOpen(false);
          setIsCapturing(false);
        };
        
        createFile();
      }
    });
    listenerIdsRef.current.push(capturedId);

    // Module closed
    const moduleClosedId = window.YMK.addEventListener('closed', () => {
      console.log('[PerfectCorp] Module closed');
      setIsCameraOpen(false);
    });
    listenerIdsRef.current.push(moduleClosedId);
  }, [currentMode]);

  // Open camera
  const openCamera = useCallback(async () => {
    setError(null);
    
    try {
      // Ensure SDK is loaded
      if (!isSDKLoaded && !window.YMK) {
        await loadSDK();
        // Wait a bit for SDK to fully initialize
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!window.YMK) {
        throw new Error('SDK no disponible');
      }

      // Setup listeners
      setupListeners();

      // Determine mode based on current capture target
      // For smile photos, use makeup mode which is more flexible
      // For rest/skin photos, use skincare mode for better quality validation
      const faceDetectionMode = currentMode === 'rest' ? 'skincare' : 'makeup';
      
      console.log('[PerfectCorp] Initializing with mode:', faceDetectionMode);
      
      // Initialize SDK
      window.YMK.init({
        faceDetectionMode,
        imageFormat: 'base64',
        language: 'esp',
        disableCameraResolutionCheck: false
      });

      // Open camera kit
      window.YMK.openCameraKit();
      setIsCapturing(true);
      
    } catch (err) {
      console.error('[PerfectCorp] Open camera error:', err);
      setError(err instanceof Error ? err.message : 'Error al abrir la cámara');
    }
  }, [isSDKLoaded, loadSDK, setupListeners, currentMode]);

  // Close camera
  const closeCamera = useCallback(() => {
    if (window.YMK && isCameraOpen) {
      window.YMK.close();
    }
    setIsCameraOpen(false);
    setIsCapturing(false);
    setFaceQuality(null);
  }, [isCameraOpen]);

  // Retake photo
  const retakePhoto = useCallback((mode: CaptureMode) => {
    if (mode === 'rest') {
      setRestPhoto(null);
    } else {
      setSmilePhoto(null);
    }
    setCurrentMode(mode);
  }, []);

  // Clear all photos
  const clearPhotos = useCallback(() => {
    setRestPhoto(null);
    setSmilePhoto(null);
    setCurrentMode('rest');
  }, []);

  // Ready for analysis check
  const readyForAnalysis = restPhoto !== null && smilePhoto !== null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listenerIdsRef.current.forEach(id => {
        try {
          if (window.YMK) {
            window.YMK.removeEventListener(id);
          }
        } catch (e) {
          // Ignore
        }
      });
      
      if (window.YMK && isCameraOpen) {
        try {
          window.YMK.close();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [isCameraOpen]);

  return {
    isSDKLoaded,
    isSDKLoading,
    isCameraOpen,
    isCapturing,
    faceQuality,
    error,
    restPhoto,
    smilePhoto,
    currentMode,
    readyForAnalysis,
    openCamera,
    closeCamera,
    setCurrentMode,
    retakePhoto,
    clearPhotos
  };
}
