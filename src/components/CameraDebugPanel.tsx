import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';

interface FaceQuality {
  hasFace: boolean;
  area: 'good' | 'notgood' | 'toosmall' | 'outofboundary';
  frontal: 'good' | 'notgood';
  lighting: 'good' | 'ok' | 'notgood';
  nakedeye: 'good' | 'notgood';
  faceangle: 'good' | 'upward' | 'downward' | 'leftward' | 'rightward' | 'lefttilt' | 'righttilt';
}

interface CameraDebugPanelProps {
  cameraSystem: 'perfectcorp' | 'native';
  currentMode: 'rest' | 'smile';
  isCameraOpen: boolean;
  isCapturing: boolean;
  isSDKLoading?: boolean;
  faceQuality: FaceQuality | null;
  error: string | null;
  restPhotoExists: boolean;
  smilePhotoExists: boolean;
  perfectCorpFailures: number;
}

export function CameraDebugPanel({
  cameraSystem,
  currentMode,
  isCameraOpen,
  isCapturing,
  isSDKLoading,
  faceQuality,
  error,
  restPhotoExists,
  smilePhotoExists,
  perfectCorpFailures,
}: CameraDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const StatusBadge = ({ value, good }: { value: string; good: boolean }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
      good ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {value}
    </span>
  );

  const BoolBadge = ({ value, label }: { value: boolean; label?: string }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
      value ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
    }`}>
      {label || (value ? 'true' : 'false')}
    </span>
  );

  return (
    <div className="fixed bottom-20 left-2 right-2 z-[9999]">
      <motion.div
        layout
        className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-left"
        >
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-zinc-200">Debug Panel</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              cameraSystem === 'perfectcorp' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {cameraSystem === 'perfectcorp' ? 'Pro' : 'Native'}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              currentMode === 'rest' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {currentMode}
            </span>
            {isCameraOpen ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-zinc-500" />
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-zinc-700"
            >
              <div className="px-3 py-2 space-y-2 text-[11px] text-zinc-300">
                {/* Camera State */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Camera State</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-zinc-400">open:</span>
                      <BoolBadge value={isCameraOpen} />
                      <span className="text-zinc-400">capturing:</span>
                      <BoolBadge value={isCapturing} />
                    </div>
                    {isSDKLoading !== undefined && (
                      <div className="flex gap-1">
                        <span className="text-zinc-400">sdk loading:</span>
                        <BoolBadge value={isSDKLoading} />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Photos</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-zinc-400">rest:</span>
                      <BoolBadge value={restPhotoExists} label={restPhotoExists ? '✓' : '—'} />
                      <span className="text-zinc-400">smile:</span>
                      <BoolBadge value={smilePhotoExists} label={smilePhotoExists ? '✓' : '—'} />
                    </div>
                  </div>
                </div>

                {/* Face Quality (only for Perfect Corp) */}
                {cameraSystem === 'perfectcorp' && (
                  <div className="space-y-1">
                    <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Face Quality</div>
                    {faceQuality ? (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-zinc-400">face:</span>
                        <BoolBadge value={faceQuality.hasFace} />
                        <span className="text-zinc-400">area:</span>
                        <StatusBadge value={faceQuality.area} good={faceQuality.area === 'good'} />
                        <span className="text-zinc-400">frontal:</span>
                        <StatusBadge value={faceQuality.frontal} good={faceQuality.frontal === 'good'} />
                        <span className="text-zinc-400">light:</span>
                        <StatusBadge value={faceQuality.lighting} good={faceQuality.lighting === 'good' || faceQuality.lighting === 'ok'} />
                        <span className="text-zinc-400">eye:</span>
                        <StatusBadge value={faceQuality.nakedeye} good={faceQuality.nakedeye === 'good'} />
                        <span className="text-zinc-400">angle:</span>
                        <StatusBadge value={faceQuality.faceangle} good={faceQuality.faceangle === 'good'} />
                      </div>
                    ) : (
                      <span className="text-zinc-500 italic">No face data</span>
                    )}
                  </div>
                )}

                {/* Error & Failures */}
                <div className="space-y-1">
                  <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Status</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-zinc-400">failures:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      perfectCorpFailures > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {perfectCorpFailures}
                    </span>
                    {error && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 truncate max-w-[200px]">
                        {error}
                      </span>
                    )}
                    {!error && (
                      <span className="text-green-400 text-[10px]">No errors</span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-zinc-600 text-[9px] text-right">
                  Last update: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
