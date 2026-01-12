import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Calendar, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const appointmentId = searchParams.get('appointment_id');
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    } else {
      setLoading(false);
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (!error && data) {
        setAppointment(data);
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusContent = () => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-16 h-16 text-emerald-400" />,
          title: '¡Reserva Confirmada!',
          description: 'Tu cita ha sido agendada exitosamente. Te enviaremos un correo con los detalles.',
          color: 'emerald',
        };
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-amber-400" />,
          title: 'Pago Pendiente',
          description: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
          color: 'amber',
        };
      case 'rejected':
      default:
        return {
          icon: <XCircle className="w-16 h-16 text-red-400" />,
          title: 'Pago No Procesado',
          description: 'Hubo un problema con tu pago. Por favor, intenta nuevamente.',
          color: 'red',
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <Layout showNav={false}>
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              {statusContent.icon}
            </motion.div>
            
            <h1 className="text-2xl font-display font-bold text-white mb-3">
              {statusContent.title}
            </h1>
            <p className="text-white/60">
              {statusContent.description}
            </p>
          </div>

          {status === 'approved' && appointment && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 mb-6"
            >
              <h3 className="text-sm font-medium text-white/80 mb-4">Detalles de tu cita</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white">{appointment.doctor_name || 'Especialista'}</p>
                    {appointment.appointment_date && (
                      <p className="text-white/50 text-xs mt-1">
                        {formatDate(appointment.appointment_date)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-xs">
                      Te contactaremos al {appointment.patient_phone} para confirmar
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/40">
                  <strong className="text-white/60">Política de cancelación:</strong> Cancelaciones con menos de 24 horas de anticipación no son reembolsables.
                </p>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            {status !== 'approved' && (
              <Link to="/" className="block">
                <Button variant="default" className="w-full">
                  Intentar Nuevamente
                </Button>
              </Link>
            )}
            
            <Link to="/" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
          </div>

          {status === 'approved' && (
            <p className="text-center text-xs text-white/40 mt-6">
              Recibirás un correo de confirmación en {appointment?.patient_email}
            </p>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
