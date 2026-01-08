import { Ticket, Calendar, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CouponCardProps {
  couponCode: string;
  discountPercent: number;
  originalValue: number;
  expiresAt?: string;
}

export function CouponCard({ couponCode, discountPercent, originalValue, expiresAt }: CouponCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const discountedValue = originalValue * (1 - discountPercent / 100);
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast({
      title: '¡Código copiado!',
      description: 'Preséntalo en Clínica Miro.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-5 h-5 text-accent" />
        <h4 className="font-display font-semibold">Cupón Clínica Miro</h4>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-1">
          {discountPercent}% de descuento en evaluación presencial
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-accent">
            ${discountedValue.toLocaleString('es-CL')}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            ${originalValue.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-background/50 rounded-lg px-4 py-2 font-mono text-lg tracking-wider">
          {couponCode}
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-accent" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>

      {expiresAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Válido hasta {formatDate(expiresAt)}</span>
        </div>
      )}
    </div>
  );
}