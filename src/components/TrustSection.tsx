import { FlaskConical, Cpu, Award, UserCheck, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const trustCards = [
  {
    icon: FlaskConical,
    title: 'Basado en ciencia',
    description: 'Usamos parámetros habituales en estética facial y dental y criterios clínicos para orientar un preanálisis. Este informe es informativo y no reemplaza una evaluación profesional.',
  },
  {
    icon: Cpu,
    title: 'Tecnología Perfect Corp (API)',
    description: 'Parte del análisis se apoya en tecnología de Perfect Corp mediante su API (visión computacional / análisis facial según el flujo del producto).',
    link: {
      label: 'Perfect Corp',
      url: 'https://www.perfectcorp.com/',
    },
  },
  {
    icon: Award,
    title: 'Reconocida internacionalmente',
    description: 'Perfect Corp presenta soluciones de IA/RA galardonadas (ej. premios 2025 y reconocimientos internacionales).',
    link: {
      label: 'Ver premios',
      url: 'https://www.perfectcorp.com/es/business/info/awards',
    },
  },
  {
    icon: UserCheck,
    title: 'Diseñado por profesional',
    description: 'Desarrollado con experiencia clínica para que entiendas tus opciones antes de una evaluación presencial.',
  },
];

export default function TrustSection() {
  return (
    <section className="relative z-10 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-white flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Confianza: ciencia + tecnología
          </h3>
          <p className="text-sm text-white/70 max-w-xl mx-auto">
            Simetría integra análisis con IA, criterios clínicos y tecnología líder de visión computacional.
          </p>
        </div>

        {/* Trust Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {trustCards.map((card, index) => (
            <Card 
              key={index}
              className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <card.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-white text-sm">
                      {card.title}
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {card.description}
                    </p>
                    {card.link && (
                      <a 
                        href={card.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        {card.link.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* LATAM Support Block */}
        <div className="flex items-center justify-center gap-2 text-center mb-4 py-3 rounded-lg bg-white/5 border border-white/10">
          <Globe className="w-4 h-4 text-primary" />
          <p className="text-xs text-white/70">
            Implementación y soporte en LATAM para soluciones integradas con Perfect Corp.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-white/40 leading-relaxed max-w-lg mx-auto">
          Importante: Este análisis no constituye diagnóstico médico. Para decisiones clínicas y tratamientos se requiere evaluación profesional.
        </p>
      </div>
    </section>
  );
}
