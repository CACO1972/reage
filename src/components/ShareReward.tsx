import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Gift, Users, MessageCircle, Mail, Copy, Check, Sparkles, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ShareRewardProps {
  analysisId: string;
  smileScore: number;
  userName?: string;
}

export function ShareReward({ analysisId, smileScore, userName = '' }: ShareRewardProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/?ref=${analysisId.slice(0, 8)}`;
  const shareText = `🦷 ¡Acabo de hacer mi análisis facial con IA! Mi score: ${smileScore}/100. Hazlo gratis tú también 👉`;

  const handleShare = (platform: 'whatsapp' | 'email' | 'copy' | 'facebook' | 'twitter' | 'linkedin') => {
    switch (platform) {
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
          '_blank'
        );
        toast({
          title: '¡Compartido!',
          description: 'Se abrió WhatsApp para compartir.',
        });
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=400'
        );
        toast({
          title: '¡Compartido!',
          description: 'Se abrió Facebook para compartir.',
        });
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        toast({
          title: '¡Compartido!',
          description: 'Se abrió X para compartir.',
        });
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        toast({
          title: '¡Compartido!',
          description: 'Se abrió LinkedIn para compartir.',
        });
        break;
      case 'email':
        const subject = encodeURIComponent('Prueba este análisis facial con IA 🦷');
        const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        toast({
          title: '¡Email listo!',
          description: 'Se abrió tu cliente de correo.',
        });
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: '¡Link copiado!',
          description: 'Compártelo donde quieras.',
        });
        break;
    }
  };

  return (
    <>
      {/* Share CTA Card */}
      <motion.div
        className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30 p-5 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              ¡Gana un análisis Premium gratis!
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Comparte con 5 amigos que completen su análisis y desbloquea el informe premium valorado en $5.990
            </p>
          </div>
        </div>

        {/* Progress indicator (placeholder) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> Referidos completados
            </span>
            <span className="font-medium text-primary">0/5</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '0%' }}
            />
          </div>
        </div>

        <Button 
          onClick={() => setShowModal(true)}
          className="w-full"
          variant="default"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartir y ganar
        </Button>
      </motion.div>

      {/* Share Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Comparte y gana Premium gratis
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Cuando 5 amigos completen su análisis usando tu link, 
              desbloquearás automáticamente el informe premium completo.
            </p>

            {/* Share link preview */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm font-mono text-muted-foreground break-all">
              {shareUrl}
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => handleShare('whatsapp')}
                variant="outline"
                className="flex-col h-auto py-3 gap-1.5"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              
              <Button
                onClick={() => handleShare('facebook')}
                variant="outline"
                className="flex-col h-auto py-3 gap-1.5"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              
              <Button
                onClick={() => handleShare('twitter')}
                variant="outline"
                className="flex-col h-auto py-3 gap-1.5"
              >
                <Twitter className="w-5 h-5 text-sky-500" />
                <span className="text-xs">X</span>
              </Button>
              
              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                className="flex-col h-auto py-3 gap-1.5"
              >
                <Linkedin className="w-5 h-5 text-blue-700" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              
              <Button
                onClick={() => handleShare('email')}
                variant="outline"
                className="flex-col h-auto py-3 gap-1.5"
              >
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-xs">Email</span>
              </Button>
              
              <Button
                onClick={() => handleShare('copy')}
                variant="outline"
                className="flex-col h-auto py-3 gap-1.5"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-accent" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span className="text-xs">{copied ? '¡Copiado!' : 'Copiar'}</span>
              </Button>
            </div>

            {/* Viral message preview */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Tu mensaje:</p>
              <p className="text-sm">
                {shareText}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
