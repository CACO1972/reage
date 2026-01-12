import { FlaskConical, Shield, Award, FileText, ExternalLink, Copyright, AlertTriangle } from 'lucide-react';

const trustItems = [
  {
    icon: FlaskConical,
    title: 'Base Científica',
    description: 'Parámetros de estética facial validados por literatura médica.',
  },
  {
    icon: Shield,
    title: 'Propiedad Protegida',
    description: 'Tecnología registrada ante INAPI Chile.',
    link: 'https://www.inapi.cl/',
    linkText: 'INAPI',
  },
  {
    icon: Award,
    title: 'Derechos de Autor',
    description: 'Registro internacional de propiedad intelectual.',
    link: 'https://www.safecreative.org/',
    linkText: 'SafeCreative',
  },
  {
    icon: FileText,
    title: 'Documentación',
    description: 'Metodología transparente y fundamentada.',
    link: '#whitepaper',
    linkText: 'White Paper',
  },
];

export default function TrustSection() {
  return (
    <section className="relative z-10 px-6 py-20">
      <div className="mx-auto max-w-lg">
        {/* Title with glow */}
        <div className="text-center mb-12">
          <span className="inline-block text-[10px] font-medium text-primary/80 uppercase tracking-[0.2em] mb-2">
            Confianza
          </span>
          <h3 className="text-xl font-display font-semibold text-white">
            Ciencia + Tecnología + Protección
          </h3>
        </div>

        {/* Trust Grid - enhanced */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {trustItems.map((item, index) => (
            <div 
              key={index} 
              className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 text-center hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-4 group-hover:scale-105 transition-transform">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-sm font-medium text-white mb-2">{item.title}</h4>
              <p className="text-xs text-white/50 leading-relaxed mb-3">{item.description}</p>
              {item.link && (
                <a 
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary/70 hover:text-primary transition-colors"
                >
                  {item.linkText} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* IP Protection Notice */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Copyright className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-white/90">
              Simetría<sup>®</sup> · Motor ArmonIA™
            </span>
          </div>
          <p className="text-center text-[11px] text-white/60 leading-relaxed mb-2">
            Propiedad intelectual protegida de <span className="text-white/80 font-medium">Clínica Miró</span> y 
            <span className="text-white/80 font-medium"> Dr. Carlos Montoya</span>.
          </p>
          <p className="text-center text-[10px] text-white/40">
            Registro SafeCreative · Todos los derechos reservados © {new Date().getFullYear()}
          </p>
        </div>

        {/* Usage Prohibition Disclaimer */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-amber-300/90 font-medium mb-1">
                Prohibido el uso no autorizado
              </p>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Queda estrictamente prohibida la reproducción, distribución, modificación o uso parcial o total 
                del contenido, código, algoritmos, metodologías e imágenes de esta aplicación sin autorización 
                expresa por escrito de los titulares de los derechos.
              </p>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3">
          <p className="text-center text-[11px] text-white/40 leading-relaxed">
            ⚕️ Este análisis es orientativo y no constituye diagnóstico médico. 
            Consulta con un profesional de la salud para evaluación clínica.
          </p>
        </div>
      </div>
    </section>
  );
}
