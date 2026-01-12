import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqItems = [
  {
    question: '¿Qué es Simetría y cómo funciona?',
    answer: 'Simetría es una plataforma de análisis estético facial impulsada por inteligencia artificial. Utilizando fotografías de tu rostro, analizamos más de 246 puntos biométricos para evaluar la armonía facial, simetría y proporciones según estándares estéticos validados científicamente.',
  },
  {
    question: '¿Es gratis el análisis?',
    answer: 'Sí, ofrecemos un análisis digital básico completamente gratis que incluye tu puntuación de sonrisa, análisis de simetría facial y una simulación interactiva de sonrisa. Para acceder a métricas avanzadas, modelo 3D y el informe PDF profesional, puedes adquirir el Informe Premium por $5.990 CLP.',
  },
  {
    question: '¿Qué incluye el Informe Premium?',
    answer: 'El Informe Premium incluye: análisis de 246 puntos biométricos, evaluación con 24+ factores personalizados, modelo 3D interactivo de tu rostro, análisis detallado de piel, informe PDF profesional descargable, y un cupón de 20% de descuento para una evaluación presencial en Clínica Miró.',
  },
  {
    question: '¿Qué tan preciso es el análisis?',
    answer: 'Nuestro análisis utiliza tecnología de vanguardia con precisión profesional. Sin embargo, es importante entender que es una herramienta orientativa y no reemplaza una evaluación clínica presencial. Los resultados están basados en parámetros estéticos validados por literatura médica.',
  },
  {
    question: '¿Mis fotos y datos están seguros?',
    answer: 'Absolutamente. Utilizamos encriptación de nivel bancario para proteger tus datos. Tus fotografías se procesan de forma segura y no se comparten con terceros. Cumplimos con las normativas de protección de datos personales.',
  },
  {
    question: '¿Qué es el Motor ArmonIA™?',
    answer: 'El Motor ArmonIA™ es nuestra tecnología propietaria que integra 246 puntos biométricos con 24+ factores personalizados (edad, hábitos, estructura facial) para generar un análisis de "ArmonIA" único. Es propiedad intelectual protegida de Clínica Miró y Dr. Carlos Montoya.',
  },
  {
    question: '¿Puedo usar el análisis para tratamientos médicos?',
    answer: 'El análisis de Simetría es orientativo y educativo. Si estás considerando tratamientos estéticos o dentales, te recomendamos agendar una evaluación presencial con nuestros especialistas en Clínica Miró, donde podrás aplicar tu descuento del 20% incluido en el Informe Premium.',
  },
  {
    question: '¿Cómo tomo las fotos correctamente?',
    answer: 'Para mejores resultados: 1) Usa buena iluminación frontal natural, 2) Mira directamente a la cámara, 3) No uses lentes ni accesorios que cubran tu rostro, 4) Toma una foto en reposo y otra sonriendo. Nuestra cámara profesional te guiará en tiempo real.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="relative z-10 px-6 py-20">
      <div className="mx-auto max-w-2xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
          </div>
          <span className="inline-block text-[10px] font-medium text-primary/80 uppercase tracking-[0.2em] mb-2">
            Preguntas Frecuentes
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-white">
            ¿Tienes dudas?
          </h2>
          <p className="mt-3 text-sm text-white/50">
            Encuentra respuestas a las preguntas más comunes sobre Simetría
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 data-[state=open]:bg-white/[0.05] data-[state=open]:border-primary/20 transition-all"
            >
              <AccordionTrigger className="text-left text-sm font-medium text-white/90 hover:text-white py-4 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-white/60 leading-relaxed pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-white/50">
            ¿No encuentras lo que buscas?{' '}
            <a 
              href="mailto:contacto@simetria.cl" 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
