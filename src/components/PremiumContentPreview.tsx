import { motion } from 'framer-motion';
import { Lock, FileText, Share2, QrCode, Box, Brain, Download, Gift } from 'lucide-react';

interface PremiumContentPreviewProps {
  onUpgradeClick?: () => void;
}

const premiumFeatures = [
  {
    icon: Box,
    title: 'Modelo 3D Interactivo',
    description: 'Visualiza y rota tu rostro en 3D',
    preview: 'Tecnología WaveSpeed AI'
  },
  {
    icon: Brain,
    title: 'Análisis IA Completo',
    description: '15+ métricas faciales y dentales',
    preview: 'Proporciones áureas, tercios faciales...'
  },
  {
    icon: FileText,
    title: 'Reporte PDF Descargable',
    description: 'Documento profesional para tu dentista',
    preview: 'Incluye gráficos y métricas'
  },
  {
    icon: Share2,
    title: 'Compartir en Redes',
    description: 'Comparte tu análisis en RRSS',
    preview: 'Instagram, WhatsApp, Facebook'
  },
  {
    icon: QrCode,
    title: 'Cupón con QR',
    description: '25% descuento en Clínica Miro',
    preview: 'Escaneable en consulta'
  },
  {
    icon: Gift,
    title: '+1 Análisis Gratis',
    description: 'Para compartir con alguien',
    preview: 'Sin costo adicional'
  }
];

export function PremiumContentPreview({ onUpgradeClick }: PremiumContentPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Contenido Premium</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {premiumFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="relative glass rounded-xl p-4 border border-border/50 overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={onUpgradeClick}
          >
            {/* Blur overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
              
              {/* Locked preview text */}
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-xs text-primary/70 blur-[2px] select-none">
                  {feature.preview}
                </p>
              </div>
            </div>

            {/* Lock indicator */}
            <div className="absolute top-2 right-2">
              <Lock className="w-3 h-3 text-primary/50" />
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Toca cualquier función para desbloquear
      </p>
    </div>
  );
}
