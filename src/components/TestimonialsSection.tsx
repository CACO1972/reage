import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, Verified } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: number;
  name: string;
  age: number;
  location: string;
  avatar: string;
  rating: number;
  text: string;
  improvement: string;
  verified: boolean;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Camila R.',
    age: 28,
    location: 'Santiago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'Increíble lo preciso que es. Siempre sentí que algo no estaba bien en mi sonrisa pero no sabía qué. El informe me mostró exactamente qué mejorar y el cupón de la clínica fue un plus increíble.',
    improvement: '+18% armonía',
    verified: true,
    date: 'Hace 3 días',
  },
  {
    id: 2,
    name: 'Sebastián M.',
    age: 34,
    location: 'Viña del Mar',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'Pensé que era solo otra app de filtros, pero esto es diferente. Es un análisis real con datos médicos. Mi dentista quedó impresionado con el nivel de detalle del PDF.',
    improvement: '+12% simetría',
    verified: true,
    date: 'Hace 1 semana',
  },
  {
    id: 3,
    name: 'Valentina C.',
    age: 25,
    location: 'Concepción',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'Lo usé antes de mi consulta en Clínica Miro y el doctor ya tenía toda la información que necesitaba. Ahorré tiempo y el descuento del 20% pagó prácticamente el informe premium.',
    improvement: '+22% sonrisa',
    verified: true,
    date: 'Hace 2 semanas',
  },
  {
    id: 4,
    name: 'Andrés P.',
    age: 31,
    location: 'Antofagasta',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'El modelo 3D de mi cara fue lo que más me sorprendió. Nunca había visto mi perfil desde todos los ángulos. Ahora entiendo por qué me recomendaron ciertos tratamientos.',
    improvement: '+15% armonía',
    verified: true,
    date: 'Hace 5 días',
  },
  {
    id: 5,
    name: 'María José L.',
    age: 29,
    location: 'Las Condes',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'Súper fácil de usar y los resultados son muy profesionales. Lo compartí con mi ortodoncista y dijo que era información muy útil para planificar mi tratamiento.',
    improvement: '+20% facial',
    verified: true,
    date: 'Hace 4 días',
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <div className="py-12">
      {/* Section Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary uppercase tracking-[0.15em] mb-3">
          <Verified className="w-4 h-4" />
          Testimonios Verificados
        </span>
        <h3 className="text-xl md:text-2xl font-display font-semibold text-white">
          Lo que dicen nuestros usuarios
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          +2,847 análisis realizados con 4.9★ de valoración
        </p>
      </div>

      {/* Testimonial Card */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm"
          >
            {/* Quote Icon */}
            <Quote className="w-8 h-8 text-primary/30 mb-4" />

            {/* Testimonial Text */}
            <p className="text-base text-white/90 leading-relaxed mb-6 min-h-[80px]">
              "{current.text}"
            </p>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={current.avatar}
                  alt={current.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                />
                {current.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Verified className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{current.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {current.age} años, {current.location}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(current.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{current.date}</span>
                </div>
              </div>
              {/* Improvement Badge */}
              <div className="hidden sm:block px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-xs font-semibold text-emerald-400">{current.improvement}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={prevTestimonial}
            className="w-10 h-10 rounded-full border-white/20 hover:bg-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          {/* Dots */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextTestimonial}
            className="w-10 h-10 rounded-full border-white/20 hover:bg-white/10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Trust Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">4.9★</p>
          <p className="text-xs text-muted-foreground">Valoración</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">2,847</p>
          <p className="text-xs text-muted-foreground">Análisis</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">97%</p>
          <p className="text-xs text-muted-foreground">Recomiendan</p>
        </div>
      </div>
    </div>
  );
}
