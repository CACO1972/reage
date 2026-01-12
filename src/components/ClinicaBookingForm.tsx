import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Phone, Mail, Loader2, CreditCard, ArrowLeft, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Doctor {
  id: string;
  name: string;
}

const doctors: Doctor[] = [
  { id: '1', name: 'Dra. Camila San Martín' },
  { id: '2', name: 'Dr. Javier Rojas' },
];

interface ClinicaBookingFormProps {
  onClose: () => void;
}

export default function ClinicaBookingForm({ onClose }: ClinicaBookingFormProps) {
  const [step, setStep] = useState<'form' | 'processing'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    appointmentDate: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState({
    cancellationPolicy: false,
    dataProcessing: false,
    creditToTreatment: false,
  });
  const { toast } = useToast();

  const allTermsAccepted = acceptedTerms.cancellationPolicy && 
                           acceptedTerms.dataProcessing && 
                           acceptedTerms.creditToTreatment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor) {
      toast({
        variant: 'destructive',
        title: 'Selecciona un profesional',
        description: 'Por favor selecciona un doctor para tu cita.',
      });
      return;
    }

    if (!formData.patientName || !formData.patientEmail || !formData.patientPhone) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos.',
      });
      return;
    }

    if (!allTermsAccepted) {
      toast({
        variant: 'destructive',
        title: 'Acepta los términos',
        description: 'Debes aceptar todas las condiciones para continuar.',
      });
      return;
    }

    setIsLoading(true);
    setStep('processing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // For now, redirect to login if not authenticated
        toast({
          variant: 'destructive',
          title: 'Inicia sesión',
          description: 'Debes iniciar sesión para reservar.',
        });
        setStep('form');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-clinic-payment', {
        body: {
          patientName: formData.patientName,
          patientEmail: formData.patientEmail,
          patientPhone: formData.patientPhone,
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          appointmentDate: formData.appointmentDate || null,
          returnUrl: `${window.location.origin}/booking-confirmation`,
        },
      });

      if (error) throw error;

      if (data?.initPoint) {
        // Redirect to Mercado Pago
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al procesar',
        description: error.message || 'Inténtalo de nuevo.',
      });
      setStep('form');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-background/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-display font-semibold text-white">
            Reservar Evaluación
          </h2>
          <div className="w-5" />
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >
              {/* Price Banner */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-white/40 line-through text-sm">$49.000</span>
                  <span className="text-xl font-bold text-emerald-400">$39.200</span>
                </div>
                <p className="text-xs text-white/50">Incluye Rx Panorámica · Hasta 3 cuotas sin interés</p>
              </div>

              {/* Doctor Selection */}
              <div className="space-y-2">
                <label className="text-sm text-white/60">Selecciona profesional</label>
                <div className="grid grid-cols-1 gap-2">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        selectedDoctor?.id === doctor.id
                          ? 'bg-primary/10 border-primary/40 text-white'
                          : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20'
                      }`}
                    >
                      {selectedDoctor?.id === doctor.id ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      <span className="text-sm">{doctor.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="text"
                      placeholder="Tu nombre"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.patientEmail}
                      onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1 block">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1 block">Fecha preferida (opcional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="datetime-local"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Investment Notice */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white/90 mb-1">
                      ¡Es una inversión, no un gasto!
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">
                      El 100% de tu pago se <span className="text-primary font-medium">abona al valor del tratamiento</span> si 
                      decides realizarlo en Clínica Miro.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Checkboxes */}
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-medium text-white/70 mb-2">
                  Condiciones del servicio:
                </p>
                
                {/* Credit to treatment */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={acceptedTerms.creditToTreatment}
                    onCheckedChange={(checked) => 
                      setAcceptedTerms(prev => ({ ...prev, creditToTreatment: checked === true }))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                    Entiendo que el pago de la evaluación ($39.200) se <span className="text-primary">abona íntegramente</span> al 
                    costo del tratamiento si decido realizarlo.
                  </span>
                </label>

                {/* Cancellation policy */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={acceptedTerms.cancellationPolicy}
                    onCheckedChange={(checked) => 
                      setAcceptedTerms(prev => ({ ...prev, cancellationPolicy: checked === true }))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                    Acepto la <span className="text-amber-400 font-medium">política de cancelación</span>: si no asisto 
                    sin avisar con <span className="font-medium">24 horas de anticipación</span>, el pago no será devuelto.
                  </span>
                </label>

                {/* Data processing */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={acceptedTerms.dataProcessing}
                    onCheckedChange={(checked) => 
                      setAcceptedTerms(prev => ({ ...prev, dataProcessing: checked === true }))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                    Autorizo el tratamiento de mis datos personales para la gestión de la cita y 
                    comunicaciones relacionadas con mi evaluación.
                  </span>
                </label>
              </div>

              {/* Warning */}
              {!allTermsAccepted && (
                <div className="flex items-center gap-2 text-xs text-amber-400/80">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Debes aceptar todas las condiciones para continuar</span>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading || !allTermsAccepted}
                className="w-full h-12"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar con Mercado Pago
              </Button>

              <p className="text-xs text-center text-white/40">
                Pago seguro · Hasta 3 cuotas sin interés
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-12 text-center"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white/80">Preparando pago...</p>
              <p className="text-sm text-white/40 mt-2">Serás redirigido a Mercado Pago</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
