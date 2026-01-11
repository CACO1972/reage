import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Image, 
  Check, 
  X, 
  Sun, 
  Ruler, 
  Focus, 
  Glasses,
  Smile,
  Frown
} from 'lucide-react';

interface PhotoRequirementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

const currentPhotoRequirements = [
  { icon: <Sun className="w-5 h-5" />, text: 'Iluminación frontal uniforme, sin sombras en el rostro', required: true },
  { icon: <Focus className="w-5 h-5" />, text: 'Cámara a la altura de los ojos, rostro centrado', required: true },
  { icon: <Ruler className="w-5 h-5" />, text: 'Distancia: 40-60cm de la cámara (rostro llena 60-70% del encuadre)', required: true },
  { icon: <Glasses className="w-5 h-5" />, text: 'Sin gafas, accesorios, maquillaje excesivo ni cabello cubriendo el rostro', required: true },
  { icon: <Frown className="w-5 h-5" />, text: 'Foto 1: Expresión neutra, labios relajados y cerrados', required: true },
  { icon: <Smile className="w-5 h-5" />, text: 'Foto 2: Sonrisa natural mostrando dientes', required: true },
];

const historicalPhotoRequirements = [
  { icon: <Focus className="w-5 h-5" />, text: 'Vista frontal directa a la cámara', required: true },
  { icon: <Sun className="w-5 h-5" />, text: 'Iluminación clara que permita ver detalles faciales', required: true },
  { icon: <Ruler className="w-5 h-5" />, text: 'Rostro visible sin obstrucciones (cabello, manos, objetos)', required: true },
  { icon: <Camera className="w-5 h-5" />, text: 'Resolución mínima: 480x480 píxeles', required: true },
  { icon: <Image className="w-5 h-5" />, text: 'Formato JPEG, PNG o HEIC', required: true },
];

const idealConditions = [
  'Luz natural difusa (día nublado o cerca de ventana)',
  'Fondo neutro y uniforme',
  'Expresión relajada sin tensión muscular',
  'Postura erguida, mentón paralelo al suelo',
  'Ambas orejas visibles y simétricas en el encuadre',
];

const avoidConditions = [
  'Flash directo o luz dura que genere sombras',
  'Fotos con filtros, ediciones o retoque',
  'Ángulos laterales o inclinados',
  'Fotos grupales o recortadas',
  'Baja resolución o imágenes borrosas',
];

export function PhotoRequirementsModal({ open, onOpenChange, onContinue }: PhotoRequirementsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Camera className="w-6 h-6 text-primary" />
            Requisitos de Fotografía
          </DialogTitle>
          <DialogDescription>
            Para un análisis preciso y comparable en el tiempo
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="current" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="text-xs sm:text-sm">
              <Camera className="w-4 h-4 mr-1.5" />
              Foto Actual
            </TabsTrigger>
            <TabsTrigger value="historical" className="text-xs sm:text-sm">
              <Image className="w-4 h-4 mr-1.5" />
              Foto Histórica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4 space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">Requisitos obligatorios:</h4>
              {currentPhotoRequirements.map((req, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {req.icon}
                  </div>
                  <span className="text-muted-foreground pt-1">{req.text}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Ideal</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {idealConditions.slice(0, 3).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">Evitar</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {avoidConditions.slice(0, 3).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historical" className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 mb-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Para comparación temporal:</strong> La foto histórica debe cumplir criterios similares a la actual. 
                Cuanto más cercana a los requisitos, más precisa será la comparación de cambios faciales.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">Requisitos mínimos:</h4>
              {historicalPhotoRequirements.map((req, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    {req.icon}
                  </div>
                  <span className="text-muted-foreground pt-1">{req.text}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-muted/50 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Si tu foto histórica no cumple todos los requisitos, 
                el sistema intentará analizar las métricas disponibles y te indicará 
                qué aspectos pueden tener menor precisión en la comparación.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={onContinue} className="flex-1">
            Entendido, continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
