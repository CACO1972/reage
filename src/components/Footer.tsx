import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Shield, Copyright, ExternalLink } from 'lucide-react';
import logoSimetria from '@/assets/logo-simetria.png';

const footerLinks = {
  producto: [
    { label: 'Análisis Gratis', href: '/scan' },
    { label: 'Informe Premium', href: '#beneficios' },
    { label: 'Preguntas Frecuentes', href: '#faq' },
  ],
  legal: [
    { label: 'Términos y Condiciones', href: '#' },
    { label: 'Política de Privacidad', href: '#' },
    { label: 'Propiedad Intelectual', href: '#confianza' },
  ],
  proteccion: [
    { label: 'INAPI Chile', href: 'https://www.inapi.cl/', external: true },
    { label: 'SafeCreative', href: 'https://www.safecreative.org/', external: true },
  ],
};

const contactInfo = {
  email: 'contacto@simetria.cl',
  phone: '+56 9 3557 2986',
  address: 'Av. Nueva Providencia 2214, Santiago, Chile',
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-card/50 border-t border-white/[0.06]">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img 
                src={logoSimetria} 
                alt="Simetría" 
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Análisis estético facial profesional impulsado por inteligencia artificial.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary/80">
              <Shield className="w-4 h-4" />
              <span>Tecnología protegida</span>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Protección */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-sm font-semibold text-white mt-6 mb-4">Protección IP</h4>
            <ul className="space-y-3">
              {footerLinks.proteccion.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/50 hover:text-primary transition-colors inline-flex items-center gap-1.5"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <a 
                  href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <span className="text-sm text-white/50">
                  {contactInfo.address}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Copyright className="w-3.5 h-3.5" />
              <span>
                {currentYear} Simetría<sup>®</sup> · Motor ArmonIA™ · Todos los derechos reservados
              </span>
            </div>

            {/* Legal Owners */}
            <div className="text-xs text-white/40 text-center md:text-right">
              Propiedad de{' '}
              <span className="text-white/60">Clínica Miró</span> y{' '}
              <span className="text-white/60">Dr. Carlos Montoya</span>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="mt-4 pt-4 border-t border-white/[0.04]">
            <p className="text-center text-[10px] text-white/30 leading-relaxed max-w-2xl mx-auto">
              ⚕️ Este análisis es orientativo y no constituye diagnóstico médico. 
              Los resultados son estimaciones basadas en inteligencia artificial y parámetros estéticos validados.
              Consulta con un profesional de la salud para una evaluación clínica completa.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
