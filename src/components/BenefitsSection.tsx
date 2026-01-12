import { Check, Gift, Crown, Sparkles, TrendingUp, Smile, ScanFace, Box, FileText, Ticket } from 'lucide-react';

const freeBenefits = [
  'Puntuación de sonrisa',
  'Simetría facial general',
  'Simulación de sonrisa interactiva',
  'Mapa de análisis facial',
];

const premiumFeatures = [
  {
    icon: TrendingUp,
    title: '246 Puntos Biométricos',
    description: 'Análisis con 246 puntos faciales y dentales',
  },
  {
    icon: Box,
    title: 'Modelo 3D Interactivo',
    description: 'Visualiza tu rostro en 3D desde cualquier ángulo',
  },
  {
    icon: Sparkles,
    title: 'Motor ArmonIA™ (Demo)',
    description: '24+ factores personalizados analizados con IA',
  },
  {
    icon: FileText,
    title: 'Informe PDF Profesional',
    description: 'Descarga brandeado por email o WhatsApp',
  },
  {
    icon: Ticket,
    title: '20% Dcto. Evaluación Clínica',
    description: 'Cupón exclusivo para Clínica Miro con Rx incluida',
  },
];

export default function BenefitsSection() {
  return (
    <section className="relative z-10 px-6 py-20">
      <div className="mx-auto max-w-lg text-center">
        {/* Title */}
        <div className="mb-10">
          <span className="inline-block text-[10px] font-medium text-primary/80 uppercase tracking-[0.2em] mb-2">
            Incluido
          </span>
          <h3 className="text-xl font-display font-semibold text-white">
            ¿Qué obtienes?
          </h3>
        </div>
        
        {/* Two-tier pricing */}
        <div className="grid gap-6 mb-10">
          {/* Free Tier */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-left">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Análisis Gratis</span>
              <span className="ml-auto text-lg font-semibold text-white">$0</span>
            </div>
            <div className="space-y-2">
              {freeBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-white/40 shrink-0" />
                  <span className="text-xs text-white/60">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Tier */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-medium px-3 py-1 rounded-bl-xl">
              RECOMENDADO
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Análisis Premium</span>
              <span className="ml-auto text-lg font-semibold text-white">$5.990</span>
            </div>

            {/* All free benefits */}
            <div className="mb-4 pb-4 border-b border-primary/20">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Todo lo gratis, más:</p>
            </div>

            {/* Premium Features */}
            <div className="space-y-4">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">{feature.title}</p>
                    <p className="text-[11px] text-white/50">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Value tagline */}
            <div className="mt-6 pt-4 border-t border-primary/20">
              <p className="text-center text-[11px] text-white/50">
                Pago único · Sin suscripciones · Resultados inmediatos
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
