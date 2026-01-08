import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Ticket, Calendar, Copy, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CouponQRProps {
  couponCode: string;
  discountPercent: number;
  originalValue: number;
  expiresAt?: string;
}

export function CouponQR({ couponCode, discountPercent, originalValue, expiresAt }: CouponQRProps) {
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

  // Generate QR code URL using a free QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `SIMETRIA:${couponCode}:${discountPercent}%:CLINICA_MIRO`
  )}&bgcolor=transparent&color=d4a574`;

  return (
    <motion.div
      className="rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-accent/5 border border-accent/30 p-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-accent" />
        <h4 className="font-display font-semibold">Cupón Exclusivo Clínica Miro</h4>
      </div>

      <div className="flex gap-4 items-start">
        {/* QR Code */}
        <div className="shrink-0">
          <div className="bg-white rounded-xl p-2">
            <img 
              src={qrCodeUrl} 
              alt="QR Code del cupón"
              className="w-28 h-28"
            />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Escanea en consulta
          </p>
        </div>

        {/* Coupon Details */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {discountPercent}% de descuento en evaluación presencial
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-accent">
                ${discountedValue.toLocaleString('es-CL')}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ${originalValue.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {/* Coupon Code */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background/50 rounded-lg px-3 py-2 font-mono text-sm tracking-wider">
              {couponCode}
            </div>
            <Button 
              variant="outline" 
              size="sm"
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Válido hasta {formatDate(expiresAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Location hint */}
      <div className="mt-4 pt-4 border-t border-accent/20 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 text-accent" />
        <span>Clínica Miro • Santiago, Chile</span>
      </div>
    </motion.div>
  );
}
