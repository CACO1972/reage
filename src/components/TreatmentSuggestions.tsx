import { motion } from 'framer-motion';
import { Lock, Stethoscope, Check, Sparkles, ChevronRight } from 'lucide-react';

interface TreatmentSuggestion {
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  type: 'dental' | 'facial';
}

interface TreatmentSuggestionsProps {
  smileScore: number;
  symmetryScore: number;
  midlineDeviation: number;
  gingivalDisplay: number;
  isLocked?: boolean;
}

function generateTreatments(
  smileScore: number,
  symmetryScore: number,
  midlineDeviation: number,
  gingivalDisplay: number
): TreatmentSuggestion[] {
  const treatments: TreatmentSuggestion[] = [];

  if (midlineDeviation > 2) {
    treatments.push({
      title: 'Corrección de Línea Media',
      description: 'Alineación dental con ortodoncia para centrar la línea media dental respecto al rostro.',
      priority: 'alta',
      type: 'dental'
    });
  }

  if (gingivalDisplay > 3) {
    treatments.push({
      title: 'Tratamiento de Sonrisa Gingival',
      description: 'Opciones incluyen alargamiento coronario o aplicación de toxina botulínica para reducir exposición gingival.',
      priority: 'media',
      type: 'dental'
    });
  }

  if (smileScore < 75) {
    treatments.push({
      title: 'Diseño de Sonrisa Digital',
      description: 'Planificación digital para optimizar proporciones dentales, forma y color de los dientes.',
      priority: 'alta',
      type: 'dental'
    });
  }

  if (symmetryScore < 85) {
    treatments.push({
      title: 'Armonización Orofacial',
      description: 'Tratamientos mínimamente invasivos para mejorar el balance y simetría facial.',
      priority: 'media',
      type: 'facial'
    });
  }

  treatments.push({
    title: 'Blanqueamiento Dental',
    description: 'Aclarar el tono dental para una sonrisa más luminosa y juvenil.',
    priority: 'baja',
    type: 'dental'
  });

  treatments.push({
    title: 'Contorno Facial con Ácido Hialurónico',
    description: 'Volumetría facial para definir pómulos, mandíbula y mentón.',
    priority: 'baja',
    type: 'facial'
  });

  return treatments;
}

const priorityColors = {
  alta: 'bg-red-500/20 text-red-400 border-red-500/30',
  media: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  baja: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export function TreatmentSuggestions({
  smileScore,
  symmetryScore,
  midlineDeviation,
  gingivalDisplay,
  isLocked = false
}: TreatmentSuggestionsProps) {
  const treatments = generateTreatments(smileScore, symmetryScore, midlineDeviation, gingivalDisplay);
  const visibleCount = isLocked ? 2 : treatments.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Sugerencias de Tratamiento</h3>
      </div>

      <div className="space-y-3">
        {treatments.slice(0, visibleCount).map((treatment, index) => (
          <motion.div
            key={treatment.title}
            className="glass rounded-xl p-4 border border-border/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{treatment.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[treatment.priority]}`}>
                    {treatment.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{treatment.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </motion.div>
        ))}

        {isLocked && treatments.length > 2 && (
          <motion.div
            className="relative rounded-xl p-4 border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute inset-0 backdrop-blur-sm bg-background/50" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary">+{treatments.length - 2} tratamientos más</p>
                  <p className="text-sm text-muted-foreground">
                    Desbloquea recomendaciones personalizadas
                  </p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
