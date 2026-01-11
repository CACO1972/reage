import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, XCircle } from 'lucide-react';

interface PhotoRequirementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

function GoodBadCard({
  variant,
  title,
  subtitle,
}: {
  variant: 'good' | 'bad';
  title: string;
  subtitle: string;
}) {
  const Icon = variant === 'good' ? CheckCircle2 : XCircle;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="shrink-0">
          <Icon className={variant === 'good' ? 'text-primary' : 'text-destructive'} />
        </div>
      </div>

      {/* Simple infographic */}
      <div className="mt-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/40 bg-background/30">
        <svg viewBox="0 0 160 100" className="h-full w-full">
          {/* background */}
          <rect x="0" y="0" width="160" height="100" fill="rgba(0,0,0,0.10)" />

          {/* face oval */}
          <ellipse
            cx="80"
            cy="50"
            rx="30"
            ry="38"
            fill="none"
            stroke={variant === 'good' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
            strokeWidth="3"
          />

          {/* alignment guides */}
          <line
            x1="40"
            y1="50"
            x2="120"
            y2="50"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <line
            x1="80"
            y1="10"
            x2="80"
            y2="90"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />

          {/* camera */}
          <rect x="8" y="68" width="32" height="22" rx="6" fill="rgba(255,255,255,0.10)" />
          <circle cx="24" cy="79" r="6" fill="rgba(255,255,255,0.18)" />

          {/* light */}
          {variant === 'good' ? (
            <>
              <circle cx="136" cy="22" r="10" fill="rgba(255,255,255,0.12)" />
              <path d="M136 10 L136 2" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
              <path d="M148 22 L156 22" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
              <path d="M144.5 13.5 L150 8" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
            </>
          ) : (
            <>
              <path
                d="M128 18 L156 46"
                stroke="hsl(var(--destructive))"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M156 18 L128 46"
                stroke="hsl(var(--destructive))"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
            </>
          )}

          {/* tilt example */}
          {variant === 'bad' && (
            <g transform="rotate(-12 80 50)">
              <ellipse
                cx="80"
                cy="50"
                rx="30"
                ry="38"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export function PhotoRequirementsModal({ open, onOpenChange, onContinue }: PhotoRequirementsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Camera className="w-5 h-5 text-primary" />
            Antes de capturar
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <GoodBadCard
            variant="good"
            title="Bien"
            subtitle="Rostro centrado, luz frontal, sin sombras"
          />
          <GoodBadCard
            variant="bad"
            title="Evitar"
            subtitle="Ángulo inclinado, sombras fuertes o poca luz"
          />
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cerrar
          </Button>
          <Button onClick={onContinue} className="flex-1">
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
