"use client"

import Link from 'next/link'
import { Mail, Phone, MapPin, Shield, Copyright, ExternalLink } from 'lucide-react'

const footerLinks = {
  producto: [
    { label: 'Analisis Gratis', href: '/scan' },
    { label: 'Informe Premium', href: '#beneficios' },
    { label: 'Preguntas Frecuentes', href: '#faq' },
  ],
  legal: [
    { label: 'Terminos y Condiciones', href: '#' },
    { label: 'Politica de Privacidad', href: '#' },
    { label: 'Propiedad Intelectual', href: '#confianza' },
  ],
  proteccion: [
    { label: 'INAPI Chile', href: 'https://www.inapi.cl/', external: true },
    { label: 'SafeCreative', href: 'https://www.safecreative.org/', external: true },
  ],
}

const contactInfo = {
  email: 'contacto@simetria.cl',
  phone: '+56 9 3557 2986',
  address: 'Av. Nueva Providencia 2214, Santiago, Chile',
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 bg-card/50 border-t border-border/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">S</span>
                </div>
                <span className="font-semibold text-xl text-foreground">Simetria</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Analisis estetico facial profesional impulsado por inteligencia artificial.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary/80">
              <Shield className="w-4 h-4" />
              <span>Tecnologia protegida</span>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Producto</h4>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Proteccion */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-sm font-semibold text-foreground mt-6 mb-4">Proteccion IP</h4>
            <ul className="space-y-3">
              {footerLinks.proteccion.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
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
            <h4 className="text-sm font-semibold text-foreground mb-4">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <a 
                  href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {contactInfo.address}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Copyright className="w-3.5 h-3.5" />
              <span>
                {currentYear} Simetria - Motor ArmonIA - Todos los derechos reservados
              </span>
            </div>

            <div className="text-xs text-muted-foreground text-center md:text-right">
              Propiedad de{' '}
              <span className="text-foreground/60">Clinica Miro</span> y{' '}
              <span className="text-foreground/60">Dr. Carlos Montoya</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/5">
            <p className="text-center text-[10px] text-muted-foreground/60 leading-relaxed max-w-2xl mx-auto">
              Este analisis es orientativo y no constituye diagnostico medico. 
              Los resultados son estimaciones basadas en inteligencia artificial y parametros esteticos validados.
              Consulta con un profesional de la salud para una evaluacion clinica completa.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
