import { useState } from 'react';
import { Check, Gift, Crown, Sparkles, TrendingUp, Smile, ScanFace, Box, FileText, Ticket, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import logoSimetria from '@/assets/logo-simetria.png';
import { TestimonialsSection } from './TestimonialsSection';

const freeBenefits = [
  'Puntuación de sonrisa',
  'Simetría facial general',
  'Simulación de sonrisa interactiva',
  'Mapa de análisis facial',
];

const premiumFeatures = [
  {
    icon: TrendingUp,
    title: '246 Puntos Biométricos',
    description: 'Análisis con 246 puntos faciales y dentales',
  },
  {
    icon: Box,
    title: 'Modelo 3D Interactivo',
    description: 'Visualiza tu rostro en 3D desde cualquier ángulo',
  },
  {
    icon: Sparkles,
    title: 'Motor ArmonIA™ (Demo)',
    description: '24+ factores personalizados analizados con IA',
  },
  {
    icon: FileText,
    title: 'Informe PDF Profesional',
    description: 'Descarga brandeado por email o WhatsApp',
  },
  {
    icon: Ticket,
    title: '20% Dcto. Evaluación Clínica',
    description: 'Cupón exclusivo para Clínica Miro con Rx incluida',
  },
];

// Brand colors for PDF
const BRAND_COLORS = {
  primaryGold: [218, 165, 32] as [number, number, number],
  bronze: [205, 127, 50] as [number, number, number],
  deepSpace: [12, 10, 18] as [number, number, number],
  warmWhite: [245, 240, 230] as [number, number, number],
  accent: [168, 85, 247] as [number, number, number],
  darkPurple: [45, 20, 65] as [number, number, number],
};

// Demo data for preview
const DEMO_DATA = {
  smileScore: 78,
  symmetryScore: 82,
  facialSymmetryScore: 85,
  midlineDeviation: 1.2,
  gingivalDisplay: 2.8,
  buccalCorridorLeft: 9.5,
  buccalCorridorRight: 11.2,
  facialThirds: { upper: 31, middle: 35, lower: 34 },
};

export default function BenefitsSection() {
  const [generating, setGenerating] = useState(false);

  const generateDemoPDF = async () => {
    setGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Load logo
      let logoBase64 = '';
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              logoBase64 = canvas.toDataURL('image/png');
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = logoSimetria;
        });
      } catch (e) {
        console.log('Logo load error');
      }
      
      // ============ PAGE 1 ============
      
      // Header
      pdf.setFillColor(...BRAND_COLORS.darkPurple);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      pdf.setFillColor(...BRAND_COLORS.primaryGold);
      pdf.rect(0, 58, pageWidth, 2, 'F');
      
      // Logo
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, 'PNG', 12, 12, 50, 36);
        } catch (e) {
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(20);
          pdf.text('SIMETRÍA', 15, 32);
        }
      }
      
      // Premium badge
      pdf.setFillColor(...BRAND_COLORS.primaryGold);
      pdf.roundedRect(pageWidth - 55, 15, 42, 10, 3, 3, 'F');
      pdf.setTextColor(...BRAND_COLORS.deepSpace);
      pdf.setFontSize(8);
      pdf.text('★ DEMO', pageWidth - 34, 21, { align: 'center' });
      
      // Title
      pdf.setTextColor(...BRAND_COLORS.primaryGold);
      pdf.setFontSize(11);
      pdf.text('INFORME DE ANÁLISIS FACIAL PREMIUM', 70, 26);
      pdf.setFontSize(9);
      pdf.setTextColor(...BRAND_COLORS.bronze);
      pdf.text('Powered by Motor ArmonIA™ • 246 Puntos Biométricos', 70, 34);
      
      // Date
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 70, 44);
      pdf.text('ID: DEMO-2025-001', 70, 50);
      
      // Watermark
      pdf.setTextColor(220, 220, 220);
      pdf.setFontSize(45);
      pdf.text('VISTA PREVIA', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
      
      // What's included
      let yPos = 68;
      pdf.setFillColor(250, 248, 240);
      pdf.roundedRect(10, yPos, pageWidth - 20, 16, 3, 3, 'F');
      pdf.setDrawColor(...BRAND_COLORS.primaryGold);
      pdf.roundedRect(10, yPos, pageWidth - 20, 16, 3, 3, 'S');
      pdf.setFontSize(8);
      pdf.setTextColor(...BRAND_COLORS.bronze);
      pdf.text('✓ 246 Puntos Biométricos   ✓ 24+ Factores   ✓ Motor ArmonIA™   ✓ 20% Dcto. Clínica Miro', pageWidth / 2, yPos + 10, { align: 'center' });
      
      // Scores section
      yPos = 92;
      pdf.setFillColor(249, 250, 251);
      pdf.roundedRect(10, yPos, pageWidth - 20, 65, 3, 3, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(...BRAND_COLORS.darkPurple);
      pdf.text('📊 PUNTUACIONES PRINCIPALES', 15, yPos + 10);
      
      // Draw simplified score circles
      const drawScore = (x: number, score: number, label: string, color: [number, number, number]) => {
        pdf.setDrawColor(...color);
        pdf.setLineWidth(3);
        pdf.circle(x, yPos + 40, 18, 'S');
        pdf.setFontSize(16);
        pdf.setTextColor(50, 50, 50);
        pdf.text(`${score}`, x, yPos + 43, { align: 'center' });
        pdf.setFontSize(8);
        pdf.setTextColor(...color);
        pdf.text(label, x, yPos + 58, { align: 'center' });
      };
      
      drawScore(45, DEMO_DATA.smileScore, 'Smile Score', BRAND_COLORS.accent);
      drawScore(pageWidth / 2, DEMO_DATA.symmetryScore, 'Simetría', BRAND_COLORS.primaryGold);
      drawScore(pageWidth - 45, DEMO_DATA.facialSymmetryScore, 'ArmonIA', [34, 197, 94]);
      
      // Metrics section
      yPos = 165;
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, yPos, pageWidth - 20, 55, 3, 3, 'F');
      pdf.setDrawColor(230, 230, 230);
      pdf.roundedRect(10, yPos, pageWidth - 20, 55, 3, 3, 'S');
      
      pdf.setFontSize(11);
      pdf.setTextColor(...BRAND_COLORS.darkPurple);
      pdf.text('📏 MÉTRICAS BIOMÉTRICAS', 15, yPos + 10);
      
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const metrics = [
        `• Desviación Línea Media: ${DEMO_DATA.midlineDeviation}mm ✓`,
        `• Exposición Gingival: ${DEMO_DATA.gingivalDisplay}mm ✓`,
        `• Corredor Bucal Izq: ${DEMO_DATA.buccalCorridorLeft}% ✓`,
        `• Corredor Bucal Der: ${DEMO_DATA.buccalCorridorRight}% ⚠`,
      ];
      metrics.forEach((m, i) => pdf.text(m, 15, yPos + 22 + i * 8));
      
      // AI Interpretation
      yPos = 228;
      pdf.setFillColor(245, 240, 250);
      pdf.roundedRect(10, yPos, pageWidth - 20, 28, 3, 3, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(...BRAND_COLORS.darkPurple);
      pdf.text('🤖 INTERPRETACIÓN MOTOR ARMONIA™', 15, yPos + 10);
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      const interpretation = 'Buena armonía general con áreas de oportunidad. Se identifican sutiles asimetrías que podrían optimizarse con tratamientos conservadores.';
      pdf.text(pdf.splitTextToSize(interpretation, pageWidth - 40), 15, yPos + 20);
      
      // Coupon footer
      const footerY = pageHeight - 38;
      pdf.setFillColor(...BRAND_COLORS.darkPurple);
      pdf.rect(0, footerY - 5, pageWidth, 43, 'F');
      pdf.setFillColor(...BRAND_COLORS.primaryGold);
      pdf.roundedRect(15, footerY, pageWidth - 30, 25, 4, 4, 'F');
      pdf.setTextColor(...BRAND_COLORS.darkPurple);
      pdf.setFontSize(14);
      pdf.text('🎁 CUPÓN 20% DESCUENTO', pageWidth / 2, footerY + 10, { align: 'center' });
      pdf.setFontSize(9);
      pdf.text('Evaluación Presencial + Radiografía en Clínica Miro', pageWidth / 2, footerY + 18, { align: 'center' });
      
      // Download
      pdf.save('simetria-demo-report.pdf');
    } catch (error) {
      console.error('Error generating demo PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="relative z-10 px-6 py-20">
      <div className="mx-auto max-w-lg text-center">
        {/* Title */}
        <div className="mb-10">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-[0.2em] mb-3">
            Incluido
          </span>
          <h3 className="text-2xl md:text-3xl font-display font-semibold text-white">
            ¿Qué obtienes?
          </h3>
        </div>
        
        {/* Two-tier pricing */}
        <div className="grid gap-6 mb-10">
          {/* Free Tier */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-left">
            <div className="flex items-center gap-3 mb-5">
              <Gift className="w-6 h-6 text-emerald-400" />
              <span className="text-lg font-semibold text-emerald-400">Análisis Gratis</span>
              <span className="ml-auto text-xl font-bold text-white">$0</span>
            </div>
            <div className="space-y-3">
              {freeBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400/80 shrink-0" />
                  <span className="text-base text-white/90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Tier */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
              RECOMENDADO
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold text-primary">Análisis Premium</span>
              <span className="ml-auto text-xl font-bold text-white">$5.990</span>
            </div>

            {/* All free benefits */}
            <div className="mb-5 pb-4 border-b border-primary/20">
              <p className="text-sm text-white/70 uppercase tracking-wider">Todo lo gratis, más:</p>
            </div>

            {/* Premium Features */}
            <div className="space-y-5">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Button */}
            <div className="mt-6 pt-5 border-t border-primary/20">
              <Button
                variant="outline"
                className="w-full border-primary/40 hover:bg-primary/10 text-primary text-base py-5"
                onClick={generateDemoPDF}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Ver Reporte Demo (PDF)
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-white/60 mt-4">
                Pago único · Sin suscripciones · Resultados inmediatos
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <TestimonialsSection />
      </div>
    </section>
  );
}
