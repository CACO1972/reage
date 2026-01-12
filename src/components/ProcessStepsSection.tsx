import { motion } from 'framer-motion';
import { ClipboardList, Camera, Brain, MapPin } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Responde 24 preguntas sobre ti',
  },
  {
    icon: Camera,
    step: '02',
    title: 'Sube 2 fotos: hoy y hace 5-10 años',
  },
  {
    icon: Brain,
    step: '03',
    title: 'Nuestra IA analiza 147 puntos',
  },
  {
    icon: MapPin,
    step: '04',
    title: 'Recibe tu mapa de armonía personal',
  },
];

export default function ProcessStepsSection() {
  return (
    <section className="relative z-10 px-6 py-24 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      
      <div className="mx-auto max-w-5xl relative">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl text-white leading-tight"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}
          >
            Así de{' '}
            <span className="italic bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              simple
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Connector line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-px bg-gradient-to-r from-white/10 to-transparent" />
              )}
              
              <div className="flex flex-col items-center text-center p-6">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                    <step.icon className="w-8 h-8 text-white/60 group-hover:text-primary transition-colors duration-300" />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary/30 text-xs font-bold text-primary">
                    {step.step}
                  </div>
                </div>
                
                {/* Title */}
                <p className="text-base text-white/80 leading-snug max-w-[180px]">
                  {step.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
