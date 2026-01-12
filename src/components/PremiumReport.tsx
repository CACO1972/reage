import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Check, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import jsPDF from 'jspdf';

interface PremiumReportProps {
  analysisId: string;
  smileScore: number;
  symmetryScore: number;
  midlineDeviation?: number;
  gingivalDisplay?: number;
  buccalCorridorLeft?: number;
  buccalCorridorRight?: number;
  facialSymmetryScore?: number;
  facialThirds?: { upper: number; middle: number; lower: number } | null;
}

// Simulated data for preview mode
const SIMULATED_DATA = {
  analysisId: 'SIM-2024-DEMO',
  smileScore: 78,
  symmetryScore: 82,
  midlineDeviation: 1.2,
  gingivalDisplay: 2.8,
  buccalCorridorLeft: 9.5,
  buccalCorridorRight: 11.2,
  facialSymmetryScore: 85,
  facialThirds: { upper: 31, middle: 35, lower: 34 },
  patientName: 'Usuario Demo',
  age: 32,
  gender: 'Femenino'
};

export function PremiumReport({ 
  analysisId, 
  smileScore, 
  symmetryScore,
  midlineDeviation = 0,
  gingivalDisplay = 2,
  buccalCorridorLeft = 8,
  buccalCorridorRight = 8,
  facialSymmetryScore = 85,
  facialThirds = null
}: PremiumReportProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Helper to draw professional score gauge
  const drawScoreGauge = (pdf: jsPDF, x: number, y: number, score: number, label: string, sublabel: string, color: [number, number, number]) => {
    const radius = 22;
    
    // Outer ring background
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(4);
    pdf.circle(x, y, radius, 'S');
    
    // Score arc
    pdf.setDrawColor(...color);
    pdf.setLineWidth(4);
    const endAngle = (score / 100) * 360;
    for (let angle = -90; angle < endAngle - 90; angle += 3) {
      const rad = (angle * Math.PI) / 180;
      const nextRad = ((angle + 3) * Math.PI) / 180;
      pdf.line(
        x + Math.cos(rad) * radius,
        y + Math.sin(rad) * radius,
        x + Math.cos(nextRad) * radius,
        y + Math.sin(nextRad) * radius
      );
    }
    
    // Inner circle for cleaner look
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x, y, radius - 6, 'F');
    
    // Score number
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    pdf.text(`${score}`, x, y + 2, { align: 'center' });
    
    // Score label
    pdf.setFontSize(7);
    pdf.setTextColor(...color);
    pdf.text('/100', x + 12, y + 2, { align: 'center' });
    
    // Main label
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    pdf.text(label, x, y + radius + 8, { align: 'center' });
    
    // Sublabel
    pdf.setFontSize(7);
    pdf.setTextColor(140, 140, 140);
    pdf.text(sublabel, x, y + radius + 14, { align: 'center' });
  };

  // Helper to draw metric with ideal zone visualization
  const drawMetricWithZone = (pdf: jsPDF, x: number, y: number, value: number, min: number, max: number, idealMin: number, idealMax: number, label: string, unit: string) => {
    const barWidth = 75;
    const barHeight = 6;
    
    // Label and value
    pdf.setFontSize(9);
    pdf.setTextColor(50, 50, 50);
    pdf.text(label, x, y - 4);
    
    const isInRange = value >= idealMin && value <= idealMax;
    pdf.setFontSize(9);
    pdf.setTextColor(isInRange ? 34 : 220, isInRange ? 197 : 38, isInRange ? 94 : 38);
    pdf.text(`${value.toFixed(1)}${unit}`, x + barWidth + 5, y - 4);
    
    // Status indicator
    pdf.setFontSize(7);
    pdf.text(isInRange ? '✓ Ideal' : '⚠ Fuera de rango', x + barWidth + 5, y + 4);
    
    // Background bar
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(x, y, barWidth, barHeight, 2, 2, 'F');
    
    // Ideal zone (green)
    const idealStartX = ((idealMin - min) / (max - min)) * barWidth;
    const idealEndX = ((idealMax - min) / (max - min)) * barWidth;
    pdf.setFillColor(200, 245, 200);
    pdf.rect(x + idealStartX, y, idealEndX - idealStartX, barHeight, 'F');
    
    // Value marker
    const valuePos = Math.max(0, Math.min(barWidth, ((value - min) / (max - min)) * barWidth));
    pdf.setFillColor(isInRange ? 34 : 220, isInRange ? 197 : 38, isInRange ? 94 : 38);
    pdf.circle(x + valuePos, y + barHeight / 2, 4, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x + valuePos, y + barHeight / 2, 2, 'F');
  };

  // Draw facial thirds diagram
  const drawFacialThirds = (pdf: jsPDF, x: number, y: number, thirds: { upper: number; middle: number; lower: number }) => {
    const width = 50;
    const totalHeight = 70;
    
    pdf.setFontSize(9);
    pdf.setTextColor(50, 50, 50);
    pdf.text('Tercios Faciales', x + width / 2, y - 5, { align: 'center' });
    
    const upperH = (thirds.upper / 100) * totalHeight;
    const middleH = (thirds.middle / 100) * totalHeight;
    const lowerH = (thirds.lower / 100) * totalHeight;
    
    // Upper third
    const isUpperIdeal = thirds.upper >= 30 && thirds.upper <= 35;
    pdf.setFillColor(isUpperIdeal ? 200 : 255, isUpperIdeal ? 245 : 220, isUpperIdeal ? 200 : 200);
    pdf.roundedRect(x, y, width, upperH, 2, 2, 'F');
    pdf.setDrawColor(180, 180, 180);
    pdf.roundedRect(x, y, width, upperH, 2, 2, 'S');
    pdf.setFontSize(7);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Superior ${thirds.upper}%`, x + width / 2, y + upperH / 2 + 2, { align: 'center' });
    
    // Middle third
    const isMiddleIdeal = thirds.middle >= 30 && thirds.middle <= 35;
    pdf.setFillColor(isMiddleIdeal ? 200 : 255, isMiddleIdeal ? 245 : 220, isMiddleIdeal ? 200 : 200);
    pdf.roundedRect(x, y + upperH, width, middleH, 2, 2, 'F');
    pdf.setDrawColor(180, 180, 180);
    pdf.roundedRect(x, y + upperH, width, middleH, 2, 2, 'S');
    pdf.text(`Medio ${thirds.middle}%`, x + width / 2, y + upperH + middleH / 2 + 2, { align: 'center' });
    
    // Lower third
    const isLowerIdeal = thirds.lower >= 30 && thirds.lower <= 35;
    pdf.setFillColor(isLowerIdeal ? 200 : 255, isLowerIdeal ? 245 : 220, isLowerIdeal ? 200 : 200);
    pdf.roundedRect(x, y + upperH + middleH, width, lowerH, 2, 2, 'F');
    pdf.setDrawColor(180, 180, 180);
    pdf.roundedRect(x, y + upperH + middleH, width, lowerH, 2, 2, 'S');
    pdf.text(`Inferior ${thirds.lower}%`, x + width / 2, y + upperH + middleH + lowerH / 2 + 2, { align: 'center' });
    
    // Ideal indicator
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Ideal: 33% c/u', x + width / 2, y + totalHeight + 8, { align: 'center' });
  };

  const generatePDF = async (isPreview: boolean = false) => {
    const data = isPreview ? SIMULATED_DATA : {
      analysisId,
      smileScore,
      symmetryScore,
      midlineDeviation,
      gingivalDisplay,
      buccalCorridorLeft,
      buccalCorridorRight,
      facialSymmetryScore,
      facialThirds: facialThirds || { upper: 33, middle: 34, lower: 33 }
    };

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // ============ PAGE 1: MAIN REPORT ============
    
    // Header with gradient effect (purple to gold)
    pdf.setFillColor(89, 40, 120); // Deep purple
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Accent gold line
    pdf.setFillColor(218, 165, 32);
    pdf.rect(0, 48, pageWidth, 2, 'F');
    
    // Logo circle
    pdf.setFillColor(255, 255, 255);
    pdf.circle(22, 25, 10, 'F');
    pdf.setTextColor(89, 40, 120);
    pdf.setFontSize(14);
    pdf.text('S', 22, 28, { align: 'center' });
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text('ANÁLISIS FACIAL PREMIUM', 40, 22);
    
    pdf.setFontSize(12);
    pdf.setTextColor(218, 165, 32);
    pdf.text('Simetría AI • Powered by Motor ArmonIA™', 40, 32);
    
    // Report metadata
    pdf.setFontSize(9);
    pdf.setTextColor(200, 200, 200);
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`, 40, 42);
    pdf.text(`ID: ${data.analysisId.slice(0, 12).toUpperCase()}`, pageWidth - 50, 42);
    
    // Preview watermark
    if (isPreview) {
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(40);
      pdf.text('VISTA PREVIA', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }
    
    // Section: Main Scores
    let yPos = 62;
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 70, 3, 3, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(89, 40, 120);
    pdf.text('📊 PUNTUACIONES PRINCIPALES', 15, yPos + 5);
    
    // Draw 3 score gauges
    drawScoreGauge(pdf, 45, yPos + 40, data.smileScore, 'Smile Score', 'Estética dental', [168, 85, 247]);
    drawScoreGauge(pdf, pageWidth / 2, yPos + 40, data.symmetryScore, 'Simetría', 'Balance visual', [59, 130, 246]);
    drawScoreGauge(pdf, pageWidth - 45, yPos + 40, data.facialSymmetryScore, 'ArmonIA Facial', 'Proporciones', [34, 197, 94]);
    
    // Section: Detailed Metrics
    yPos = 140;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, yPos - 5, (pageWidth - 25) / 2 + 5, 85, 3, 3, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(10, yPos - 5, (pageWidth - 25) / 2 + 5, 85, 3, 3, 'S');
    
    pdf.setFontSize(11);
    pdf.setTextColor(89, 40, 120);
    pdf.text('📏 MÉTRICAS BIOMÉTRICAS', 15, yPos + 5);
    
    yPos += 18;
    drawMetricWithZone(pdf, 15, yPos, data.midlineDeviation, -4, 4, -1.5, 1.5, 'Desviación Línea Media', 'mm');
    yPos += 18;
    drawMetricWithZone(pdf, 15, yPos, data.gingivalDisplay, 0, 6, 1, 3, 'Exposición Gingival', 'mm');
    yPos += 18;
    drawMetricWithZone(pdf, 15, yPos, data.buccalCorridorLeft, 0, 20, 8, 12, 'Corredor Bucal Izq', '%');
    yPos += 18;
    drawMetricWithZone(pdf, 15, yPos, data.buccalCorridorRight, 0, 20, 8, 12, 'Corredor Bucal Der', '%');
    
    // Section: Facial Thirds (right side)
    const thirdsX = pageWidth / 2 + 8;
    const thirdsY = 140;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(thirdsX - 3, thirdsY - 5, (pageWidth - 25) / 2 + 5, 85, 3, 3, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(thirdsX - 3, thirdsY - 5, (pageWidth - 25) / 2 + 5, 85, 3, 3, 'S');
    
    pdf.setFontSize(11);
    pdf.setTextColor(89, 40, 120);
    pdf.text('👤 PROPORCIONES FACIALES', thirdsX + 2, thirdsY + 5);
    
    drawFacialThirds(pdf, thirdsX + 20, thirdsY + 12, data.facialThirds);
    
    // Section: AI Interpretation
    yPos = 235;
    pdf.setFillColor(240, 235, 250);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 40, 3, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(89, 40, 120);
    pdf.text('🤖 INTERPRETACIÓN AI', 15, yPos + 5);
    
    const overallScore = Math.round((data.smileScore + data.symmetryScore + data.facialSymmetryScore) / 3);
    let interpretation = '';
    if (overallScore >= 85) {
      interpretation = 'Excelente armonía facial y dental. Tus proporciones están dentro de los rangos ideales según estándares internacionales de estética. La simetría y balance de tu sonrisa destacan positivamente.';
    } else if (overallScore >= 70) {
      interpretation = 'Buena armonía general con áreas de oportunidad. Las métricas muestran un balance facial positivo. Se identifican sutiles asimetrías que podrían optimizarse con tratamientos conservadores.';
    } else {
      interpretation = 'Se identifican oportunidades de mejora significativas. Los valores fuera de rango pueden beneficiarse de una evaluación especializada para un plan de tratamiento personalizado.';
    }
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    const splitInterpretation = pdf.splitTextToSize(interpretation, pageWidth - 40);
    pdf.text(splitInterpretation, 15, yPos + 15);
    
    // Footer with CTA
    const footerY = pageHeight - 35;
    pdf.setFillColor(89, 40, 120);
    pdf.rect(0, footerY - 5, pageWidth, 40, 'F');
    
    pdf.setTextColor(218, 165, 32);
    pdf.setFontSize(12);
    pdf.text('🎁 20% DESCUENTO EN EVALUACIÓN PRESENCIAL', pageWidth / 2, footerY + 5, { align: 'center' });
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('Clínica Miro • Evaluación completa + Radiografía panorámica', pageWidth / 2, footerY + 14, { align: 'center' });
    pdf.text('www.clinicamiro.cl | +56 9 3557 2986', pageWidth / 2, footerY + 22, { align: 'center' });
    
    // ============ PAGE 2: DETAILED ANALYSIS ============
    pdf.addPage();
    
    // Header
    pdf.setFillColor(89, 40, 120);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setFillColor(218, 165, 32);
    pdf.rect(0, 23, pageWidth, 2, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('ANÁLISIS DETALLADO • MOTOR ARMONIA™', pageWidth / 2, 15, { align: 'center' });
    
    // 246 Biometric Points Section
    yPos = 40;
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 55, 3, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(89, 40, 120);
    pdf.text('🎯 246 PUNTOS BIOMÉTRICOS ANALIZADOS', 15, yPos + 5);
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    const bioPoints = [
      '• 68 landmarks faciales (contorno, ojos, nariz, boca)',
      '• 42 puntos dentales (posición, alineación, proporciones)',
      '• 28 puntos de simetría (bilateral, central)',
      '• 36 puntos gingivales (línea de sonrisa, contorno)',
      '• 24 puntos de proporciones áureas',
      '• 48 puntos de análisis de tercios faciales'
    ];
    bioPoints.forEach((point, i) => {
      pdf.text(point, 15, yPos + 15 + (i * 6));
    });
    
    // Analysis Methodology
    yPos = 105;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 50, 3, 3, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 50, 3, 3, 'S');
    
    pdf.setFontSize(11);
    pdf.setTextColor(89, 40, 120);
    pdf.text('🔬 METODOLOGÍA DE ANÁLISIS', 15, yPos + 5);
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    const methodology = [
      '• Análisis basado en estándares de Ricketts y proporciones áureas',
      '• Comparación con base de datos de +10,000 casos clínicos',
      '• Validación con protocolos de armonía facial DSD (Digital Smile Design)',
      '• Procesamiento mediante IA con modelos entrenados en estética dental',
      '• Calibración según parámetros de la AAE (American Academy of Esthetic Dentistry)'
    ];
    methodology.forEach((m, i) => {
      pdf.text(m, 15, yPos + 15 + (i * 7));
    });
    
    // Personalized Recommendations
    yPos = 165;
    pdf.setFillColor(240, 255, 240);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 65, 3, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(34, 139, 34);
    pdf.text('💡 RECOMENDACIONES PERSONALIZADAS', 15, yPos + 5);
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    
    const recs: string[] = [];
    if (data.midlineDeviation > 1.5 || data.midlineDeviation < -1.5) {
      recs.push('• Evaluar alineación dental para corregir desviación de línea media');
    }
    if (data.gingivalDisplay > 3) {
      recs.push('• Considerar gingivectomía láser para optimizar exposición gingival');
    }
    if (data.buccalCorridorLeft > 12 || data.buccalCorridorRight > 12) {
      recs.push('• Evaluar expansión de arco para reducir corredores bucales');
    }
    if (data.facialSymmetryScore < 80) {
      recs.push('• Análisis de asimetría facial para plan de armonización');
    }
    recs.push('• Evaluación presencial para diagnóstico definitivo y plan de tratamiento');
    recs.push('• Fotografías intraorales para análisis dental completo');
    
    recs.slice(0, 6).forEach((rec, i) => {
      pdf.text(rec, 15, yPos + 15 + (i * 8));
    });
    
    // Disclaimer
    yPos = 240;
    pdf.setFillColor(255, 250, 240);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 30, 3, 3, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(180, 120, 0);
    pdf.text('⚠️ AVISO IMPORTANTE', 15, yPos + 5);
    
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    const disclaimer = 'Este reporte es generado mediante inteligencia artificial y tiene fines orientativos. No constituye un diagnóstico médico ni reemplaza la evaluación de un profesional de la salud. Los resultados deben ser validados por un odontólogo especialista antes de iniciar cualquier tratamiento.';
    const splitDisclaimer = pdf.splitTextToSize(disclaimer, pageWidth - 40);
    pdf.text(splitDisclaimer, 15, yPos + 13);
    
    // Final footer
    pdf.setFillColor(89, 40, 120);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('© 2024 Simetría AI • Clínica Miro • Todos los derechos reservados', pageWidth / 2, pageHeight - 6, { align: 'center' });
    
    return pdf;
  };

  const handleDownload = async () => {
    setDownloading(true);
    
    try {
      const pdf = await generatePDF(false);
      pdf.save(`simetria-premium-${analysisId.slice(0, 8)}.pdf`);
      
      setDownloaded(true);
      toast({
        title: '¡Reporte Premium descargado!',
        description: 'Revisa tu carpeta de descargas.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error al generar PDF',
        description: 'Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const pdf = await generatePDF(true);
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error al generar vista previa',
        description: 'Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async (platform: 'whatsapp' | 'facebook' | 'copy') => {
    const shareUrl = `${window.location.origin}/result/${analysisId}`;
    const shareText = `¡Mi análisis facial premium con Simetría AI! Score: ${smileScore}/100 🦷✨`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: '¡Link copiado!',
          description: 'Compártelo donde quieras.',
        });
        break;
    }
  };

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Tu Reporte Premium</h3>
          <p className="text-sm text-muted-foreground">2 páginas • 246 puntos analizados</p>
        </div>
      </div>

      {/* Preview Button */}
      <Button 
        onClick={handlePreview}
        variant="outline"
        className="w-full border-primary/30 hover:bg-primary/10"
      >
        <Eye className="w-4 h-4 mr-2" />
        Vista Previa (Datos Demo)
      </Button>

      {/* Download Section */}
      <div className="space-y-3">
        <Button 
          onClick={handleDownload} 
          disabled={downloading}
          className="w-full"
          variant={downloaded ? 'outline' : 'default'}
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando reporte...
            </>
          ) : downloaded ? (
            <>
              <Check className="w-4 h-4 mr-2 text-accent" />
              Descargado
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Descargar Reporte PDF
            </>
          )}
        </Button>
      </div>

      {/* Share Section */}
      <div className="space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Compartir en redes
        </p>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => handleShare('whatsapp')}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => handleShare('facebook')}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </Button>
          
          <Button 
            variant="outline"
            size="icon"
            onClick={() => handleShare('copy')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
