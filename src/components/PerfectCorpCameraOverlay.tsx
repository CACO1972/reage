import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Sun, User, Glasses, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface FaceQuality {
  hasFace: boolean;
  area: 'good' | 'notgood' | 'toosmall' | 'outofboundary';
  frontal: 'good' | 'notgood';
  lighting: 'good' | 'ok' | 'notgood';
  nakedeye: 'good' | 'notgood';
  faceangle: 'good' | 'upward' | 'downward' | 'leftward' | 'rightward' | 'lefttilt' | 'righttilt';
}

interface PerfectCorpCameraOverlayProps {
  faceQuality: FaceQuality | null;
  currentMode: 'rest' | 'smile';
}

export function PerfectCorpCameraOverlay({ faceQuality, currentMode }: PerfectCorpCameraOverlayProps) {
  const isAllGood = faceQuality && 
    faceQuality.hasFace && 
    faceQuality.area === 'good' && 
    faceQuality.frontal === 'good' &&
    (faceQuality.lighting === 'good' || faceQuality.lighting === 'ok') &&
    faceQuality.faceangle === 'good';

  const getAngleIcon = () => {
    if (!faceQuality) return null;
    switch (faceQuality.faceangle) {
      case 'upward': return <ArrowUp className="w-5 h-5" />;
      case 'downward': return <ArrowDown className="w-5 h-5" />;
      case 'leftward': return <ArrowLeft className="w-5 h-5" />;
      case 'rightward': return <ArrowRight className="w-5 h-5" />;
      default: return null;
    }
  };

  const getAngleMessage = () => {
    if (!faceQuality) return '';
    switch (faceQuality.faceangle) {
      case 'upward': return 'Baja la barbilla';
      case 'downward': return 'Sube la barbilla';
      case 'leftward': return 'Mira más a la derecha';
      case 'rightward': return 'Mira más a la izquierda';
      case 'lefttilt': return 'Endereza la cabeza';
      case 'righttilt': return 'Endereza la cabeza';
      case 'good': return '';
      default: return '';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top quality indicators */}
      <div className="absolute top-3 left-3 right-3">
        <div className="flex justify-center gap-2 flex-wrap">
          {/* Face detected */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
              faceQuality?.hasFace
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {faceQuality?.hasFace ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {faceQuality?.hasFace ? 'Rostro' : 'Sin rostro'}
          </motion.div>

          {/* Lighting */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
              faceQuality?.lighting === 'good' || faceQuality?.lighting === 'ok'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Sun className="w-3 h-3" />
            {faceQuality?.lighting === 'good' ? 'Luz OK' : faceQuality?.lighting === 'ok' ? 'Luz OK' : 'Poca luz'}
          </motion.div>

          {/* Distance */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
              faceQuality?.area === 'good'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <User className="w-3 h-3" />
            {faceQuality?.area === 'good' ? 'Distancia OK' : 
             faceQuality?.area === 'toosmall' ? 'Acércate' :
             faceQuality?.area === 'outofboundary' ? 'Centra el rostro' : 'Ajusta'}
          </motion.div>

          {/* Glasses */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
              faceQuality?.nakedeye === 'good'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Glasses className="w-3 h-3" />
            {faceQuality?.nakedeye === 'good' ? 'Sin lentes' : 'Quita lentes'}
          </motion.div>
        </div>
      </div>

      {/* Angle correction message */}
      {faceQuality && faceQuality.faceangle !== 'good' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/50 backdrop-blur-sm">
            {getAngleIcon()}
            <span className="text-xs text-amber-400 font-medium">{getAngleMessage()}</span>
          </div>
        </motion.div>
      )}

      {/* Ready indicator */}
      {isAllGood && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/30 border border-green-500/50 backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">
              Capturando automáticamente...
            </span>
          </div>
        </motion.div>
      )}

      {/* Current step instruction */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-center text-xs text-white/90 bg-black/50 rounded-lg px-3 py-2 backdrop-blur-sm">
          {currentMode === 'rest' 
            ? '😐 Rostro relajado • Labios cerrados'
            : '😁 Sonrisa natural • Muestra los dientes'
          }
        </div>
      </div>
    </div>
  );
}
