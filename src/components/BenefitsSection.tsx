import { Check, Gift, Crown, Sparkles, Brain, Smile, ScanFace } from 'lucide-react';

const freeBenefits = [
  'Puntuación de sonrisa',
  'Simetría facial general',
  'Simulación de sonrisa interactiva',
];

const premiumAnalysis = [
  {
    category: 'Análisis Facial',
    icon: ScanFace,
    items: [
      '246 puntos biométricos faciales',
      'Proporciones áureas y tercios faciales',
      'Línea media y concordancias',
    ],
  },
  {
    category: 'Análisis de Sonrisa',
    icon: Smile,
    items: [
      'Evaluación boca, labios y dientes',
      'Línea de sonrisa vs línea facial',
      'Corredores bucales y exposición gingival',
    ],
  },
  {
    category: 'Motor ArmonIA™',
    icon: Brain,
    items: [
      'Análisis integrador dentofacial',
      '24+ factores personalizados (edad, hábitos...)',
      'Pre-análisis de armonía facial único',
    ],
  },
];

const premiumExtras = [
  'Modelo 3D interactivo de tu rostro',
  'Informe PDF profesional descargable',
  '20% dcto. evaluación presencial Clínica Miro',
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
              <span className="text-sm font-medium text-emerald-400">Informe Gratis</span>
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
              <span className="text-sm font-medium text-primary">Informe Premium</span>
              <span className="ml-auto text-lg font-semibold text-white">$5.990</span>
            </div>

            {/* Analysis Categories */}
            <div className="space-y-5 mb-6">
              {premiumAnalysis.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon className="w-4 h-4 text-primary/70" />
                    <span className="text-xs font-medium text-primary/90">{section.category}</span>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-white/70 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-5" />

            {/* Extras */}
            <div className="space-y-2">
              {premiumExtras.map((extra, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-white/80">{extra}</span>
                </div>
              ))}
            </div>

            {/* ArmonIA tagline */}
            <div className="mt-6 pt-4 border-t border-primary/20">
              <p className="text-center text-[11px] text-white/50 italic">
                De <span className="text-white/70">Simetría</span> a <span className="text-primary font-medium">ArmonIA</span> — 
                tu análisis único y personalizado
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
