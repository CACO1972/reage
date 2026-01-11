import { CheckCircle2, Sparkles } from 'lucide-react';

const benefits = [
  'Análisis facial y dental integrado con IA',
  'Evaluación de armonía, simetría y sonrisa',
  'Pre-simulación estética personalizada',
  'Informe premium descargable en PDF',
];

export default function BenefitsSection() {
  return (
    <section className="relative z-10 px-6 pb-16">
      <div className="mx-auto max-w-md">
        {/* What You Get */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            ¿Qué incluye tu análisis Simetría?
          </h3>
          
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <li 
                key={index}
                className="flex items-start gap-3 text-white/80"
              >
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Pricing */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-center">
              <span className="text-xl font-semibold text-white">
                Informe premium desde $5.900 CLP
              </span>
            </p>
            <p className="text-center text-xs text-white/50 mt-1">
              Evaluación clínica opcional, abonable a tratamiento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
