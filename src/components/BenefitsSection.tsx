import { Check, Gift, Crown } from 'lucide-react';

const freeBenefits = [
  'Puntuación de sonrisa',
  'Simetría facial general',
  'Simulación de sonrisa',
];

const premiumBenefits = [
  'Análisis facial completo con IA',
  'Métricas clínicas detalladas',
  'Modelo 3D de tu rostro',
  'Informe PDF profesional',
  'Cupón 25% Clínica Miro',
];

export default function BenefitsSection() {
  return (
    <section className="relative z-10 px-6 py-20">
      <div className="mx-auto max-w-md text-center">
        {/* Title */}
        <h3 className="text-lg font-medium text-white mb-10">
          ¿Qué incluye?
        </h3>
        
        {/* Two-tier pricing */}
        <div className="grid gap-6 mb-10">
          {/* Free Tier */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-left">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Informe Gratis</span>
            </div>
            <div className="space-y-2 mb-4">
              {freeBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-white/40 shrink-0" />
                  <span className="text-xs text-white/60">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="text-lg font-semibold text-white">$0 CLP</div>
          </div>

          {/* Premium Tier */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-medium px-3 py-1 rounded-bl-xl">
              RECOMENDADO
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Informe Premium</span>
            </div>
            <div className="space-y-2 mb-4">
              {premiumBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-white/70">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="text-lg font-semibold text-white">$5.990 CLP</div>
          </div>
        </div>
      </div>
    </section>
  );
}
