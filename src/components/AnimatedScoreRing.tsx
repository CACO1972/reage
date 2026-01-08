import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
  color?: 'primary' | 'accent';
  delay?: number;
}

export function AnimatedScoreRing({
  score,
  maxScore = 100,
  size = 180,
  strokeWidth = 12,
  label,
  sublabel,
  color = 'primary',
  delay = 0
}: AnimatedScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (animatedScore / maxScore) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = score / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(interval);
        } else {
          setAnimatedScore(current);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [score, delay]);

  const gradientId = `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;
  
  const getScoreLevel = (s: number) => {
    if (s >= 85) return { text: 'Excelente', emoji: '✨' };
    if (s >= 70) return { text: 'Bueno', emoji: '👍' };
    if (s >= 55) return { text: 'Regular', emoji: '📊' };
    return { text: 'A mejorar', emoji: '🎯' };
  };

  const level = getScoreLevel(score);

  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color === 'primary' ? 'hsl(38, 70%, 50%)' : 'hsl(28, 80%, 45%)'} />
              <stop offset="100%" stopColor={color === 'primary' ? 'hsl(28, 80%, 45%)' : 'hsl(38, 70%, 50%)'} />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            opacity={0.3}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, delay: delay / 1000, ease: "easeOut" }}
            style={{
              filter: 'drop-shadow(0 0 8px hsla(38, 70%, 50%, 0.4))'
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-4xl font-bold text-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (delay + 500) / 1000 }}
          >
            {animatedScore.toFixed(0)}
          </motion.span>
          <span className="text-sm text-muted-foreground">de {maxScore}</span>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="font-semibold text-lg">{label}</p>
        {sublabel && <p className="text-sm text-muted-foreground">{sublabel}</p>}
        <motion.div 
          className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (delay + 1200) / 1000 }}
        >
          <span>{level.emoji}</span>
          <span>{level.text}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}