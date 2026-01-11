import { Check } from 'lucide-react';

const benefits = [
  'Análisis facial y dental con IA',
  'Evaluación de simetría y sonrisa',
  'Pre-simulación personalizada',
  'Informe PDF descargable',
];

export default function BenefitsSection() {
  return (
    <section className="relative z-10 px-6 py-20">
      <div className="mx-auto max-w-sm text-center">
        {/* Title */}
        <h3 className="text-lg font-medium text-white mb-8">
          ¿Qué incluye?
        </h3>
        
        {/* Benefits - minimal grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-left"
            >
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-white/70">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Pricing - simple */}
        <div className="inline-block rounded-full bg-white/5 border border-white/10 px-6 py-3">
          <span className="text-sm font-medium text-white">
            Desde $5.900 CLP
          </span>
        </div>
      </div>
    </section>
  );
}
