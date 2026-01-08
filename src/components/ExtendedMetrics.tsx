import { motion } from 'framer-motion';
import { Lock, Ruler, Eye, Smile, Layers } from 'lucide-react';
import { MetricBar } from './MetricBar';

interface FacialThirds {
  upper: number;
  middle: number;
  lower: number;
}

interface ExtendedMetricsProps {
  midlineDeviation: number;
  gingivalDisplay: number;
  buccalCorridorLeft: number;
  buccalCorridorRight: number;
  facialThirds: FacialThirds | null;
  facialMidlineDeviation: number;
  isLocked?: boolean;
}

export function ExtendedMetrics({
  midlineDeviation,
  gingivalDisplay,
  buccalCorridorLeft,
  buccalCorridorRight,
  facialThirds,
  facialMidlineDeviation,
  isLocked = false
}: ExtendedMetricsProps) {
  const avgBuccalCorridor = (buccalCorridorLeft + buccalCorridorRight) / 2;

  // Free metrics (always visible)
  const freeMetrics = [
    {
      label: 'Línea media dental',
      value: midlineDeviation,
      idealMin: 0,
      idealMax: 2,
      unit: 'mm',
      description: 'Desviación respecto al centro facial',
      icon: Ruler
    },
    {
      label: 'Exposición gingival',
      value: gingivalDisplay,
      idealMin: 0,
      idealMax: 3,
      unit: 'mm',
      description: 'Encía visible al sonreír',
      icon: Smile
    }
  ];

  // Premium metrics (locked unless upgraded)
  const premiumMetrics = [
    {
      label: 'Corredor bucal promedio',
      value: avgBuccalCorridor,
      idealMin: 5,
      idealMax: 15,
      unit: '%',
      description: 'Espacio entre dientes y mejilla',
      icon: Eye
    },
    {
      label: 'Corredor bucal izquierdo',
      value: buccalCorridorLeft,
      idealMin: 5,
      idealMax: 15,
      unit: '%',
      description: 'Espacio visible lado izquierdo',
      icon: Eye
    },
    {
      label: 'Corredor bucal derecho',
      value: buccalCorridorRight,
      idealMin: 5,
      idealMax: 15,
      unit: '%',
      description: 'Espacio visible lado derecho',
      icon: Eye
    },
    {
      label: 'Desviación línea media facial',
      value: facialMidlineDeviation,
      idealMin: 0,
      idealMax: 3,
      unit: 'mm',
      description: 'Asimetría del eje central del rostro',
      icon: Ruler
    }
  ];

  return (
    <div className="space-y-6">
      {/* Free Metrics */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Métricas Básicas</h3>
        </div>
        
        <div className="space-y-3">
          {freeMetrics.map((metric) => (
            <MetricBar
              key={metric.label}
              label={metric.label}
              value={metric.value}
              idealMin={metric.idealMin}
              idealMax={metric.idealMax}
              unit={metric.unit}
              description={metric.description}
            />
          ))}
        </div>
      </motion.div>

      {/* Facial Thirds (always visible but simplified) */}
      {facialThirds && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">Tercios Faciales</h3>
          </div>
          
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Superior (frente)</span>
              <span className="font-mono">{facialThirds.upper.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                style={{ width: `${facialThirds.upper}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Medio (nariz)</span>
              <span className="font-mono">{facialThirds.middle.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-1000"
                style={{ width: `${facialThirds.middle}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Inferior (boca-mentón)</span>
              <span className="font-mono">{facialThirds.lower.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                style={{ width: `${facialThirds.lower}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              Ideal: 33.3% cada tercio • Variación normal: ±3%
            </p>
          </div>
        </motion.div>
      )}

      {/* Premium Metrics (locked or visible) */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2">
          {isLocked && <Lock className="w-4 h-4 text-primary" />}
          <h3 className="text-lg font-semibold">
            Métricas Avanzadas
            {isLocked && <span className="text-primary text-sm ml-2">Premium</span>}
          </h3>
        </div>
        
        <div className={`space-y-3 ${isLocked ? 'relative' : ''}`}>
          {isLocked && (
            <div className="absolute inset-0 backdrop-blur-md bg-background/50 z-10 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">4 métricas adicionales</p>
                <p className="text-xs text-muted-foreground">Disponible en Premium</p>
              </div>
            </div>
          )}
          
          {premiumMetrics.map((metric) => (
            <MetricBar
              key={metric.label}
              label={metric.label}
              value={metric.value}
              idealMin={metric.idealMin}
              idealMax={metric.idealMax}
              unit={metric.unit}
              description={metric.description}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
