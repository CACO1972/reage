import { FlaskConical, Cpu, Award, UserCheck, ExternalLink } from 'lucide-react';

const trustItems = [
  {
    icon: FlaskConical,
    title: 'Ciencia',
    description: 'Criterios clínicos de estética facial.',
  },
  {
    icon: Cpu,
    title: 'Perfect Corp API',
    description: 'Visión computacional líder.',
    link: 'https://www.perfectcorp.com/',
  },
  {
    icon: Award,
    title: 'Premiada',
    description: 'Tecnología IA/RA galardonada.',
    link: 'https://www.perfectcorp.com/es/business/info/awards',
  },
  {
    icon: UserCheck,
    title: 'Profesional',
    description: 'Diseño con experiencia clínica.',
  },
];

export default function TrustSection() {
  return (
    <section className="relative z-10 px-6 py-16">
      <div className="mx-auto max-w-lg">
        {/* Title */}
        <h3 className="text-center text-sm font-medium text-white/50 uppercase tracking-wider mb-8">
          Ciencia + Tecnología
        </h3>

        {/* Trust Grid - minimal */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          {trustItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-3">
                <item.icon className="w-4 h-4 text-white/60" />
              </div>
              <h4 className="text-xs font-medium text-white mb-1">{item.title}</h4>
              <p className="text-[11px] text-white/50 leading-relaxed">{item.description}</p>
              {item.link && (
                <a 
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
                >
                  Ver más <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Disclaimer - minimal */}
        <p className="text-center text-[10px] text-white/30 leading-relaxed max-w-xs mx-auto">
          Este análisis no constituye diagnóstico médico. Requiere evaluación profesional.
        </p>
      </div>
    </section>
  );
}
