import { motion } from 'framer-motion';

interface MetricBarProps {
  label: string;
  value: number;
  idealMin: number;
  idealMax: number;
  unit: string;
  description?: string;
}

export function MetricBar({ label, value, idealMin, idealMax, unit, description }: MetricBarProps) {
  const isInRange = value >= idealMin && value <= idealMax;
  const maxValue = Math.max(idealMax * 1.5, value * 1.2);
  const valuePercent = (value / maxValue) * 100;
  const idealMinPercent = (idealMin / maxValue) * 100;
  const idealMaxPercent = (idealMax / maxValue) * 100;

  return (
    <motion.div 
      className="p-4 rounded-xl bg-muted/30"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{value.toFixed(1)}{unit}</span>
          {isInRange ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">✓ Ideal</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">Fuera de rango</span>
          )}
        </div>
      </div>

      {/* Visual bar */}
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        {/* Ideal range indicator */}
        <div 
          className="absolute h-full bg-accent/20 rounded-full"
          style={{ 
            left: `${idealMinPercent}%`, 
            width: `${idealMaxPercent - idealMinPercent}%` 
          }}
        />
        
        {/* Value indicator */}
        <motion.div
          className={`absolute h-full rounded-full ${isInRange ? 'bg-accent' : 'bg-amber-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${valuePercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Value marker */}
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${isInRange ? 'bg-accent border-accent' : 'bg-amber-500 border-amber-500'}`}
          initial={{ left: 0, scale: 0 }}
          animate={{ left: `calc(${valuePercent}% - 8px)`, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          style={{ boxShadow: '0 0 8px rgba(0,0,0,0.3)' }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>0</span>
        <span className="text-accent">Rango ideal: {idealMin}-{idealMax}{unit}</span>
        <span>{maxValue.toFixed(0)}</span>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </motion.div>
  );
}