import { useState } from 'react';
import { Calendar, MapPin, Phone, Mail, Clock, Percent, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ClinicaBookingForm from './ClinicaBookingForm';

export default function ClinicaCTA() {
  const [showBookingForm, setShowBookingForm] = useState(false);

  return (
    <>
      <section className="relative z-10 px-6 py-16">
        <motion.div 
          className="mx-auto max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block text-[10px] font-medium text-primary/80 uppercase tracking-[0.2em] mb-2">
              Siguiente Paso
            </span>
            <h3 className="text-xl font-display font-semibold text-white mb-3">
              Evaluación Presencial
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Lleva tu análisis al siguiente nivel con una evaluación 
              profesional en Clínica Miro.
            </p>
          </div>

          {/* Discount Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Percent className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-400">20% DCTO</span>
                <span className="text-sm text-white/50 ml-2">exclusivo</span>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg text-white/40 line-through">$49.000</span>
                <span className="text-2xl font-bold text-white">$39.200</span>
              </div>
              <p className="text-xs text-white/50 mt-1">Incluye Rx Panorámica Digital · Hasta 3 cuotas sin interés</p>
            </div>

            {/* Book Button */}
            <Button
              onClick={() => setShowBookingForm(true)}
              className="w-full h-12 text-base"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Reservar y Pagar
            </Button>
            
            <p className="text-xs text-center text-white/40 mt-3">
              Pago seguro con Mercado Pago
            </p>
          </div>

          {/* Contact Info */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/80">Av. Nueva Providencia 2214</p>
                  <p className="text-white/50 text-xs">Piso 18, Of. 1802, Santiago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <p className="text-white/60 text-xs">Lun - Vie: 9:00 - 18:00 hrs</p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a 
                  href="tel:+56935572986" 
                  className="text-white/60 text-xs hover:text-primary transition-colors"
                >
                  +56 9 3557 2986
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a 
                  href="mailto:administracion@clinicamiro.cl"
                  className="text-white/60 text-xs hover:text-primary transition-colors"
                >
                  administracion@clinicamiro.cl
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showBookingForm && (
          <ClinicaBookingForm onClose={() => setShowBookingForm(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
