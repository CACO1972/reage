import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Mínimo 6 caracteres');

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithMagicLink, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email
      emailSchema.parse(email);

      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        toast({
          title: '¡Enlace enviado!',
          description: 'Revisa tu correo para acceder.',
        });
        return;
      }

      // Validate password for login/signup
      passwordSchema.parse(password);

      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Credenciales incorrectas');
          }
          throw error;
        }
        navigate('/dashboard');
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Este email ya está registrado');
          }
          throw error;
        }
        toast({
          title: '¡Cuenta creada!',
          description: 'Ya puedes comenzar tu análisis.',
        });
        navigate('/scan');
      }
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Simetría</h1>
          <p className="text-muted-foreground mt-2">
            Análisis dentofacial con IA
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === 'login' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setMode('login')}
            >
              Iniciar Sesión
            </Button>
            <Button
              variant={mode === 'signup' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setMode('signup')}
            >
              Registrarse
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            {mode !== 'magic' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear Cuenta' : 'Enviar Enlace'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'magic' ? 'login' : 'magic')}
              className="text-sm text-primary hover:underline"
            >
              {mode === 'magic' ? 'Usar contraseña' : 'Acceder con enlace mágico'}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in">
          Al continuar, aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  );
}
