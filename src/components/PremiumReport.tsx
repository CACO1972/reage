import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
}

export function PremiumReport({ 
  analysisId, 
  smileScore, 
  symmetryScore,
  midlineDeviation = 0,
  gingivalDisplay = 2,
  buccalCorridorLeft = 8,
  buccalCorridorRight = 8,
  facialSymmetryScore = 85
}: PremiumReportProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { toast } = useToast();

  const drawScoreCircle = (pdf: jsPDF, x: number, y: number, score: number, label: string, color: [number, number, number]) => {
    const radius = 20;
    
    // Background circle
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(3);
    pdf.circle(x, y, radius, 'S');
    
    // Score arc (simplified as colored circle segment)
    pdf.setDrawColor(...color);
    pdf.setLineWidth(3);
    const endAngle = (score / 100) * 360;
    for (let angle = -90; angle < endAngle - 90; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      const nextRad = ((angle + 5) * Math.PI) / 180;
      pdf.line(
        x + Math.cos(rad) * radius,
        y + Math.sin(rad) * radius,
        x + Math.cos(nextRad) * radius,
        y + Math.sin(nextRad) * radius
      );
    }
    
    // Score text
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${score}`, x, y + 2, { align: 'center' });
    
    // Label
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(label, x, y + radius + 8, { align: 'center' });
  };

  const drawMetricBar = (pdf: jsPDF, x: number, y: number, value: number, min: number, max: number, ideal: number, label: string) => {
    const barWidth = 80;
    const barHeight = 8;
    
    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(label, x, y - 3);
    
    // Background bar
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(x, y, barWidth, barHeight, 2, 2, 'F');
    
    // Ideal zone (green area) - simplified without opacity
    const idealStart = ((ideal - 1 - min) / (max - min)) * barWidth;
    const idealEnd = ((ideal + 1 - min) / (max - min)) * barWidth;
    pdf.setFillColor(200, 240, 200);
    pdf.rect(x + Math.max(0, idealStart), y, Math.min(idealEnd - idealStart, barWidth - idealStart), barHeight, 'F');
    
    // Value marker
    const valuePos = Math.max(0, Math.min(barWidth, ((value - min) / (max - min)) * barWidth));
    pdf.setFillColor(168, 85, 247);
    pdf.circle(x + valuePos, y + barHeight / 2, 4, 'F');
    
    // Value text
    pdf.setFontSize(8);
    pdf.setTextColor(168, 85, 247);
    pdf.text(`${value.toFixed(1)}`, x + valuePos, y + barHeight + 8, { align: 'center' });
  };

  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header gradient simulation
    pdf.setFillColor(168, 85, 247);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Logo placeholder
    pdf.setFillColor(255, 255, 255);
    pdf.circle(20, 22, 8, 'F');
    pdf.setTextColor(168, 85, 247);
    pdf.setFontSize(12);
    pdf.text('S', 20, 25, { align: 'center' });
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('ANÁLISIS FACIAL', 35, 20);
    pdf.setFontSize(14);
    pdf.text('Reporte Premium Simetría AI', 35, 28);
    
    // Date and ID
    pdf.setFontSize(10);
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 35, 38);
    pdf.text(`ID: ${analysisId.slice(0, 8)}`, pageWidth - 50, 38);
    
    // Main scores section
    let yPos = 60;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.text('PUNTUACIONES PRINCIPALES', 20, yPos);
    
    yPos += 15;
    drawScoreCircle(pdf, 50, yPos + 20, smileScore, 'Smile Score', [168, 85, 247]);
    drawScoreCircle(pdf, 105, yPos + 20, symmetryScore, 'Simetría', [59, 130, 246]);
    drawScoreCircle(pdf, 160, yPos + 20, facialSymmetryScore, 'Facial', [34, 197, 94]);
    
    // Metrics section
    yPos += 60;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('MÉTRICAS DETALLADAS', 20, yPos);
    
    yPos += 15;
    drawMetricBar(pdf, 20, yPos, midlineDeviation, -3, 3, 0, 'Desviación Línea Media (mm)');
    yPos += 20;
    drawMetricBar(pdf, 20, yPos, gingivalDisplay, 0, 6, 2, 'Exposición Gingival (mm)');
    yPos += 20;
    drawMetricBar(pdf, 20, yPos, buccalCorridorLeft, 0, 20, 10, 'Corredor Bucal Izq (%)');
    yPos += 20;
    drawMetricBar(pdf, 20, yPos, buccalCorridorRight, 0, 20, 10, 'Corredor Bucal Der (%)');
    
    // Interpretation section
    yPos += 30;
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(15, yPos, pageWidth - 30, 50, 3, 3, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(168, 85, 247);
    pdf.text('💡 INTERPRETACIÓN AI', 20, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const interpretation = smileScore >= 80 
      ? 'Tu sonrisa presenta excelentes proporciones. Los parámetros analizados están dentro de rangos ideales.'
      : smileScore >= 60
      ? 'Tu sonrisa tiene buenas características con algunas áreas de mejora. Consulta las recomendaciones.'
      : 'Se identificaron oportunidades de mejora significativas. Un especialista puede ayudarte a optimizar tu sonrisa.';
    
    const splitText = pdf.splitTextToSize(interpretation, pageWidth - 50);
    pdf.text(splitText, 20, yPos + 20);
    
    // Recommendations
    yPos += 60;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('RECOMENDACIONES', 20, yPos);
    
    yPos += 10;
    const recommendations = [
      '• Considera una evaluación presencial para tratamiento personalizado',
      '• La exposición gingival puede optimizarse con procedimientos mínimamente invasivos',
      '• Un diseño de sonrisa digital puede mostrar resultados proyectados'
    ];
    
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    recommendations.forEach((rec, i) => {
      pdf.text(rec, 20, yPos + (i * 8));
    });
    
    // Footer
    const footerY = pdf.internal.pageSize.getHeight() - 25;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, footerY - 5, pageWidth, 30, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(168, 85, 247);
    pdf.text('Clínica Miro', 20, footerY + 5);
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.text('Este reporte es generado por Simetría AI y no reemplaza una evaluación profesional.', 20, footerY + 12);
    pdf.text('www.clinicamiro.cl | @clinicamiro', 20, footerY + 18);
    
    return pdf;
  };

  const handleDownload = async () => {
    setDownloading(true);
    
    try {
      const pdf = await generatePDF();
      pdf.save(`simetria-analisis-${analysisId.slice(0, 8)}.pdf`);
      
      setDownloaded(true);
      toast({
        title: '¡Reporte PDF descargado!',
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

  const handleShare = async (platform: 'whatsapp' | 'facebook' | 'copy') => {
    const shareUrl = `${window.location.origin}/result/${analysisId}`;
    const shareText = `¡Mi análisis facial con Simetría AI! Smile Score: ${smileScore}/100 🦷✨`;

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
          <p className="text-sm text-muted-foreground">Descarga y comparte</p>
        </div>
      </div>

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
