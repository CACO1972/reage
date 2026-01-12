import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const othersItems = [
  'Te comparan con celebridades',
  'Puntajes que te hacen sentir mal',
  'Estándares de belleza occidentales',
  'Rostro y sonrisa separados',
];

const simetriaItems = [
  'Te comparamos contigo mismo',
  'Descubrimos tu potencial único',
  'Análisis personalizado a TU contexto',
  'Rostro + sonrisa integrados (primeros en el mundo)',
];

export default function DifferentiatorSection() {
  return (
    <section className="relative z-10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl">
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
            ¿Por qué somos{' '}
            <span className="italic bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              diferentes
            </span>?
          </h2>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Others */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8"
          >
            <h3 className="text-lg font-medium text-white/40 mb-6 uppercase tracking-wider">
              Otras apps
            </h3>
            <div className="space-y-4">
              {othersItems.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <span className="text-white/50">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Simetría */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            
            <h3 className="text-lg font-medium text-primary mb-6 uppercase tracking-wider relative z-10">
              Simetría
            </h3>
            <div className="space-y-4 relative z-10">
              {simetriaItems.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
