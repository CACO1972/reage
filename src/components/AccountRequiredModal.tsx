import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Mínimo 6 caracteres');

interface AccountRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'save' | 'share' | 'download' | 'premium';
  onSuccess?: () => void;
}

const actionMessages = {
  save: {
    title: 'Guarda tu análisis',
    description: 'Crea una cuenta para guardar tus resultados y acceder a ellos cuando quieras.',
  },
  share: {
    title: 'Comparte tu análisis',
    description: 'Crea una cuenta para compartir tus resultados con amigos y familia.',
  },
  download: {
    title: 'Descarga tu reporte',
    description: 'Crea una cuenta para descargar tu reporte en PDF.',
  },
  premium: {
    title: 'Accede a Premium',
    description: 'Crea una cuenta para desbloquear el análisis completo con 246 puntos biométricos.',
  },
};

export default function AccountRequiredModal({
  open,
  onOpenChange,
  action,
  onSuccess,
}: AccountRequiredModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { linkAccount } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { error } = await linkAccount(email, password);
      
      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Este email ya está registrado. Inicia sesión.');
        }
        throw error;
      }

      toast({
        title: '¡Cuenta creada!',
        description: 'Tu análisis ha sido guardado.',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Algo salió mal',
      });
    } finally {
      setLoading(false);
    }
  };

  const { title, description } = actionMessages[action];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-white/10">
        <DialogHeader className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="modal-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="modal-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="modal-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 rounded-xl"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Crear cuenta y continuar'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Al continuar, aceptas nuestros términos de servicio
        </p>
      </DialogContent>
    </Dialog>
  );
}
