import { motion } from 'framer-motion';
import { Lock, Sparkles, RotateCcw } from 'lucide-react';

interface Model3DPreviewProps {
  imageUrl: string;
  isLocked?: boolean;
}

export function Model3DPreview({ imageUrl, isLocked = true }: Model3DPreviewProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
      {/* Blurred preview image simulating 3D */}
      <div className="relative aspect-square">
        <img 
          src={imageUrl} 
          alt="3D Preview" 
          className={`w-full h-full object-cover ${isLocked ? 'blur-md scale-110' : ''}`}
        />
        
        {/* Mesh overlay effect */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full opacity-30" viewBox="0 0 100 100">
            <defs>
              <pattern id="mesh" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="0.5" fill="hsl(38, 70%, 50%)" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#mesh)" />
          </svg>
        </div>

        {/* Animated scan lines */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-transparent"
          animate={{ 
            y: ['0%', '100%', '0%']
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ height: '30%' }}
        />

        {/* Lock overlay */}
        {isLocked && (
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4"
              animate={{ 
                boxShadow: [
                  '0 0 0 0 hsla(38, 70%, 50%, 0.4)',
                  '0 0 0 20px hsla(38, 70%, 50%, 0)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Lock className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="font-semibold text-lg mb-1">Modelo 3D Facial</p>
            <p className="text-sm text-muted-foreground text-center px-8">
              Visualiza tu rostro en 3D interactivo con zoom y rotación
            </p>
          </motion.div>
        )}

        {/* Corner decorations */}
        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary/50 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary/50 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary/50 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary/50 rounded-br-lg" />
      </div>

      {/* Bottom info bar */}
      <div className="p-4 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Tripo3D Engine</span>
        </div>
        {!isLocked && (
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" />
            Rotar
          </button>
        )}
      </div>
    </div>
  );
}