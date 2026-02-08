import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Check, Loader2, Eye, MessageCircle, Mail, Gift, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import logoSimetria from '@/assets/logo-simetria.png';

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

// Brand colors - Refined professional palette
const BRAND = {
  gold: [201, 160, 85] as [number, number, number],
  bronze: [180, 125, 70] as [number, number, number],
  deepNavy: [18, 24, 38] as [number, number, number],
  slate: [40, 50, 70] as [number, number, number],
  cream: [250, 248, 243] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 245, 248] as [number, number, number],
  textDark: [30, 35, 45] as [number, number, number],
  textMuted: [100, 110, 125] as [number, number, number],
  success: [34, 150, 90] as [number, number, number],
  warning: [220, 155, 45] as [number, number, number],
  danger: [200, 65, 60] as [number, number, number],
  accent: [90, 60, 130] as [number, number, number],
};

// Function to convert image to base64
const getLogoBase64 = async (): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      }
    };
    img.onerror = () => resolve('');
    img.src = logoSimetria;
  });
};

// Score interpretation
const getScoreLevel = (score: number): { label: string; color: [number, number, number] } => {
  if (score >= 90) return { label: 'Excelente', color: BRAND.success };
  if (score >= 75) return { label: 'Muy Bueno', color: [60, 160, 100] };
  if (score >= 60) return { label: 'Bueno', color: BRAND.warning };
  return { label: 'A Mejorar', color: BRAND.danger };
};

// Treatment generator based on metrics
const generateTreatments = (
  smileScore: number,
  symmetryScore: number,
  midlineDeviation: number,
  gingivalDisplay: number,
  buccalCorridorLeft: number,
  buccalCorridorRight: number
) => {
  const treatments: { priority: 'alta' | 'media' | 'baja'; title: string; description: string; benefit: string }[] = [];

  if (Math.abs(midlineDeviation) > 2) {
    treatments.push({
      priority: 'alta',
      title: 'Corrección de Línea Media Dental',
      description: 'Ortodoncia para alinear la línea media dental con el eje facial central.',
      benefit: 'Mejora la simetría visual hasta un 25%'
    });
  }

  if (gingivalDisplay > 3.5) {
    treatments.push({
      priority: 'alta',
      title: 'Tratamiento de Sonrisa Gingival',
      description: 'Alargamiento coronario láser o aplicación de toxina botulínica.',
      benefit: 'Reduce exposición gingival y realza los dientes'
    });
  }

  if (smileScore < 70) {
    treatments.push({
      priority: 'alta',
      title: 'Diseño de Sonrisa Digital (DSD)',
      description: 'Planificación digital para optimizar forma, color y proporciones dentales.',
      benefit: 'Incremento potencial de +15 puntos en Smile Score'
    });
  }

  if (buccalCorridorLeft > 13 || buccalCorridorRight > 13) {
    treatments.push({
      priority: 'media',
      title: 'Expansión de Arco Dental',
      description: 'Ortodoncia o alineadores para ampliar la sonrisa y reducir corredores oscuros.',
      benefit: 'Sonrisa más amplia y luminosa'
    });
  }

  if (symmetryScore < 80) {
    treatments.push({
      priority: 'media',
      title: 'Armonización Orofacial',
      description: 'Ácido hialurónico para equilibrar asimetrías faciales sutiles.',
      benefit: 'Balance facial mejorado sin cirugía'
    });
  }

  treatments.push({
    priority: 'baja',
    title: 'Blanqueamiento Dental Profesional',
    description: 'Aclarado de 6-8 tonos con tecnología LED y peróxido de hidrógeno.',
    benefit: 'Sonrisa más luminosa y juvenil'
  });

  treatments.push({
    priority: 'baja',
    title: 'Carillas de Porcelana / Composite',
    description: 'Corrección de forma, color y pequeñas malposiciones.',
    benefit: 'Resultado estético inmediato y duradero'
  });

  return treatments;
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
  const { toast } = useToast();

  // Helper: Draw elegant circular score gauge
  const drawScoreGauge = (
    pdf: jsPDF,
    x: number,
    y: number,
    score: number,
    title: string,
    subtitle: string
  ) => {
    const radius = 24;
    const { label, color } = getScoreLevel(score);

    // Outer background ring
    pdf.setDrawColor(220, 220, 225);
    pdf.setLineWidth(5);
    pdf.circle(x, y, radius, 'S');

    // Score arc
    pdf.setDrawColor(...color);
    pdf.setLineWidth(5);
    const arcEnd = (score / 100) * 360;
    for (let a = -90; a < arcEnd - 90; a += 2) {
      const r1 = (a * Math.PI) / 180;
      const r2 = ((a + 2) * Math.PI) / 180;
      pdf.line(
        x + Math.cos(r1) * radius,
        y + Math.sin(r1) * radius,
        x + Math.cos(r2) * radius,
        y + Math.sin(r2) * radius
      );
    }

    // Inner white circle
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x, y, radius - 7, 'F');

    // Score value
    pdf.setFontSize(20);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text(`${score}`, x, y + 2, { align: 'center' });
    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.textMuted);
    pdf.text('/100', x + 11, y + 2, { align: 'center' });

    // Title
    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text(title, x, y + radius + 9, { align: 'center' });

    // Level badge
    pdf.setFillColor(...color);
    const badgeWidth = pdf.getTextWidth(label) + 6;
    pdf.roundedRect(x - badgeWidth / 2, y + radius + 12, badgeWidth, 6, 2, 2, 'F');
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    pdf.text(label, x, y + radius + 16.5, { align: 'center' });

    // Subtitle
    pdf.setFontSize(7);
    pdf.setTextColor(...BRAND.textMuted);
    pdf.text(subtitle, x, y + radius + 24, { align: 'center' });
  };

  // Helper: Draw metric bar with ideal range
  const drawMetricBar = (
    pdf: jsPDF,
    x: number,
    y: number,
    value: number,
    min: number,
    max: number,
    idealMin: number,
    idealMax: number,
    label: string,
    unit: string
  ) => {
    const barWidth = 80;
    const barHeight = 6;
    const isIdeal = value >= idealMin && value <= idealMax;

    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text(label, x, y - 3);

    // Value with status
    pdf.setFontSize(9);
    pdf.setTextColor(...(isIdeal ? BRAND.success : BRAND.warning));
    pdf.text(`${value.toFixed(1)}${unit}`, x + barWidth + 8, y - 3);

    pdf.setFontSize(7);
    pdf.text(isIdeal ? '✓ Óptimo' : '◯ Fuera de rango', x + barWidth + 8, y + 5);

    // Background bar
    pdf.setFillColor(235, 235, 240);
    pdf.roundedRect(x, y, barWidth, barHeight, 2, 2, 'F');

    // Ideal zone
    const zoneStart = ((idealMin - min) / (max - min)) * barWidth;
    const zoneEnd = ((idealMax - min) / (max - min)) * barWidth;
    pdf.setFillColor(200, 240, 210);
    pdf.rect(x + Math.max(0, zoneStart), y, Math.min(barWidth, zoneEnd - zoneStart), barHeight, 'F');

    // Value marker
    const pos = Math.max(0, Math.min(barWidth, ((value - min) / (max - min)) * barWidth));
    pdf.setFillColor(...(isIdeal ? BRAND.success : BRAND.warning));
    pdf.circle(x + pos, y + barHeight / 2, 4, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x + pos, y + barHeight / 2, 2, 'F');
  };

  // Helper: Draw facial thirds diagram
  const drawFacialThirds = (
    pdf: jsPDF,
    x: number,
    y: number,
    thirds: { upper: number; middle: number; lower: number }
  ) => {
    const width = 55;
    const totalHeight = 75;

    const upperH = (thirds.upper / 100) * totalHeight;
    const middleH = (thirds.middle / 100) * totalHeight;
    const lowerH = (thirds.lower / 100) * totalHeight;

    const isIdeal = (v: number) => v >= 30 && v <= 36;
    const idealColor: [number, number, number] = [200, 240, 210];
    const offColor: [number, number, number] = [255, 230, 200];

    // Upper
    const upperColor = isIdeal(thirds.upper) ? idealColor : offColor;
    pdf.setFillColor(upperColor[0], upperColor[1], upperColor[2]);
    pdf.roundedRect(x, y, width, upperH, 3, 3, 'F');
    pdf.setDrawColor(200, 200, 205);
    pdf.roundedRect(x, y, width, upperH, 3, 3, 'S');
    pdf.setFontSize(7);
    pdf.setTextColor(...BRAND.textMuted);
    pdf.text(`Superior ${thirds.upper}%`, x + width / 2, y + upperH / 2 + 2, { align: 'center' });

    // Middle
    const middleColor = isIdeal(thirds.middle) ? idealColor : offColor;
    pdf.setFillColor(middleColor[0], middleColor[1], middleColor[2]);
    pdf.roundedRect(x, y + upperH, width, middleH, 3, 3, 'F');
    pdf.setDrawColor(200, 200, 205);
    pdf.roundedRect(x, y + upperH, width, middleH, 3, 3, 'S');
    pdf.text(`Medio ${thirds.middle}%`, x + width / 2, y + upperH + middleH / 2 + 2, { align: 'center' });

    // Lower
    const lowerColor = isIdeal(thirds.lower) ? idealColor : offColor;
    pdf.setFillColor(lowerColor[0], lowerColor[1], lowerColor[2]);
    pdf.roundedRect(x, y + upperH + middleH, width, lowerH, 3, 3, 'F');
    pdf.setDrawColor(200, 200, 205);
    pdf.roundedRect(x, y + upperH + middleH, width, lowerH, 3, 3, 'S');
    pdf.text(`Inferior ${thirds.lower}%`, x + width / 2, y + upperH + middleH + lowerH / 2 + 2, { align: 'center' });

    // Label
    pdf.setFontSize(6);
    pdf.setTextColor(...BRAND.textMuted);
    pdf.text('Ideal: ~33% cada tercio', x + width / 2, y + totalHeight + 6, { align: 'center' });
  };

  // Helper: Draw page header
  const drawHeader = (pdf: jsPDF, logoBase64: string, pageNum: number, totalPages: number, subtitle: string) => {
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header background
    pdf.setFillColor(...BRAND.deepNavy);
    pdf.rect(0, 0, pageWidth, 36, 'F');

    // Gold accent line
    pdf.setFillColor(...BRAND.gold);
    pdf.rect(0, 36, pageWidth, 1.5, 'F');

    // Logo
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', 10, 6, 38, 25);
      } catch {
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('SIMETRÍA', 15, 22);
      }
    }

    // Title
    pdf.setTextColor(...BRAND.gold);
    pdf.setFontSize(13);
    pdf.text('INFORME CLÍNICO PREMIUM', 55, 15);

    // Subtitle
    pdf.setFontSize(9);
    pdf.setTextColor(180, 185, 195);
    pdf.text(subtitle, 55, 23);

    // Page indicator
    pdf.setFontSize(8);
    pdf.setTextColor(140, 145, 155);
    pdf.text(`Página ${pageNum}/${totalPages}`, pageWidth - 25, 20);

    // Premium badge
    pdf.setFillColor(...BRAND.gold);
    pdf.roundedRect(pageWidth - 45, 6, 35, 9, 3, 3, 'F');
    pdf.setTextColor(...BRAND.deepNavy);
    pdf.setFontSize(7);
    pdf.text('★ PREMIUM', pageWidth - 27.5, 12, { align: 'center' });
  };

  // Helper: Draw page footer
  const drawFooter = (pdf: jsPDF) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(...BRAND.deepNavy);
    pdf.rect(0, pageHeight - 14, pageWidth, 14, 'F');

    pdf.setFillColor(...BRAND.gold);
    pdf.rect(0, pageHeight - 14, pageWidth, 0.8, 'F');

    pdf.setTextColor(150, 155, 165);
    pdf.setFontSize(7);
    pdf.text('© 2025 Simetría AI • Clínica Miro • Todos los derechos reservados', 12, pageHeight - 6);

    pdf.setTextColor(...BRAND.gold);
    pdf.text('simetria.ai', pageWidth - 25, pageHeight - 6);
  };

  const generatePDF = async (isPreview: boolean = false) => {
    const data = {
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
    const logoBase64 = await getLogoBase64();

    const treatments = generateTreatments(
      data.smileScore,
      data.symmetryScore,
      data.midlineDeviation,
      data.gingivalDisplay,
      data.buccalCorridorLeft,
      data.buccalCorridorRight
    );

    // ========== PAGE 1: EXECUTIVE SUMMARY ==========
    drawHeader(pdf, logoBase64, 1, 3, 'Motor ArmonIA™ • 246 Puntos Biométricos');

    // Preview watermark
    if (isPreview) {
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(50);
      pdf.text('DEMO', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }

    // Report info
    let y = 45;
    pdf.setFillColor(...BRAND.cream);
    pdf.roundedRect(10, y, pageWidth - 20, 16, 3, 3, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.textMuted);
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`, 15, y + 7);
    pdf.text(`ID Análisis: ${data.analysisId.slice(0, 12).toUpperCase()}`, 15, y + 12);

    pdf.setTextColor(...BRAND.gold);
    pdf.text('✓ 246 puntos biométricos', 90, y + 7);
    pdf.text('✓ 24+ factores personalizados', 90, y + 12);
    pdf.text('✓ Motor ArmonIA™', 150, y + 7);
    pdf.text('✓ Cupón 20% incluido', 150, y + 12);

    // Section: Main Scores
    y = 68;
    pdf.setFillColor(...BRAND.lightGray);
    pdf.roundedRect(10, y, pageWidth - 20, 75, 4, 4, 'F');

    pdf.setFontSize(11);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('PUNTUACIONES PRINCIPALES', 15, y + 10);

    pdf.setDrawColor(...BRAND.gold);
    pdf.setLineWidth(0.5);
    pdf.line(15, y + 13, 75, y + 13);

    drawScoreGauge(pdf, 42, y + 48, data.smileScore, 'Smile Score', 'Estética dental');
    drawScoreGauge(pdf, pageWidth / 2, y + 48, data.symmetryScore, 'Simetría', 'Balance visual');
    drawScoreGauge(pdf, pageWidth - 42, y + 48, data.facialSymmetryScore, 'ArmonIA Facial', 'Proporciones');

    // Section: Biometric Metrics
    y = 150;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, y, (pageWidth - 25) / 2, 70, 4, 4, 'F');
    pdf.setDrawColor(230, 230, 235);
    pdf.roundedRect(10, y, (pageWidth - 25) / 2, 70, 4, 4, 'S');

    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('MÉTRICAS BIOMÉTRICAS', 15, y + 10);
    pdf.setDrawColor(...BRAND.gold);
    pdf.line(15, y + 13, 55, y + 13);

    drawMetricBar(pdf, 15, y + 24, data.midlineDeviation, -4, 4, -1.5, 1.5, 'Desviación Línea Media', 'mm');
    drawMetricBar(pdf, 15, y + 40, data.gingivalDisplay, 0, 6, 1, 3, 'Exposición Gingival', 'mm');
    drawMetricBar(pdf, 15, y + 56, (data.buccalCorridorLeft + data.buccalCorridorRight) / 2, 0, 20, 8, 12, 'Corredor Bucal Promedio', '%');

    // Section: Facial Thirds
    const thirdsX = pageWidth / 2 + 5;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(thirdsX - 3, y, (pageWidth - 25) / 2, 70, 4, 4, 'F');
    pdf.setDrawColor(230, 230, 235);
    pdf.roundedRect(thirdsX - 3, y, (pageWidth - 25) / 2, 70, 4, 4, 'S');

    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('PROPORCIONES FACIALES', thirdsX + 2, y + 10);
    pdf.setDrawColor(...BRAND.gold);
    pdf.line(thirdsX + 2, y + 13, thirdsX + 50, y + 13);

    drawFacialThirds(pdf, thirdsX + 18, y + 18, data.facialThirds);

    // Section: AI Interpretation
    y = 228;
    const overallScore = Math.round((data.smileScore + data.symmetryScore + data.facialSymmetryScore) / 3);
    let interpretation = '';
    let interpretationColor: [number, number, number] = BRAND.success;

    if (overallScore >= 85) {
      interpretation = 'Excelente armonía dentofacial. Sus proporciones se encuentran dentro de los rangos ideales según estándares clínicos internacionales. La simetría y balance de su sonrisa destacan positivamente. Se recomienda mantenimiento preventivo.';
      interpretationColor = BRAND.success;
    } else if (overallScore >= 70) {
      interpretation = 'Buena armonía general con áreas de oportunidad identificadas. Las métricas muestran un balance facial positivo. Se detectan asimetrías sutiles que podrían optimizarse con tratamientos conservadores según las recomendaciones de la página 3.';
      interpretationColor = [80, 150, 100];
    } else {
      interpretation = 'Se identifican oportunidades de mejora significativas. Los valores fuera de rango pueden beneficiarse de una evaluación clínica especializada. Consulte las recomendaciones personalizadas en la página 3 para un plan de tratamiento detallado.';
      interpretationColor = BRAND.warning;
    }

    pdf.setFillColor(245, 248, 255);
    pdf.roundedRect(10, y, pageWidth - 20, 38, 4, 4, 'F');
    pdf.setDrawColor(...interpretationColor);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(10, y, pageWidth - 20, 38, 4, 4, 'S');

    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('INTERPRETACIÓN MOTOR ARMONIA™', 15, y + 9);

    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.textMuted);
    const splitInterp = pdf.splitTextToSize(interpretation, pageWidth - 35);
    pdf.text(splitInterp, 15, y + 18);

    drawFooter(pdf);

    // ========== PAGE 2: DETAILED ANALYSIS ==========
    pdf.addPage();
    drawHeader(pdf, logoBase64, 2, 3, 'Análisis Técnico Detallado');

    if (isPreview) {
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(50);
      pdf.text('DEMO', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }

    // 246 Points breakdown
    y = 45;
    pdf.setFillColor(...BRAND.lightGray);
    pdf.roundedRect(10, y, pageWidth - 20, 55, 4, 4, 'F');

    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('246 PUNTOS BIOMÉTRICOS ANALIZADOS', 15, y + 10);
    pdf.setDrawColor(...BRAND.gold);
    pdf.line(15, y + 13, 85, y + 13);

    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.textMuted);
    const bioPoints = [
      { count: 68, label: 'Landmarks faciales (contorno, ojos, nariz, boca)' },
      { count: 42, label: 'Puntos dentales (posición, alineación, proporciones)' },
      { count: 28, label: 'Puntos de simetría bilateral' },
      { count: 36, label: 'Puntos gingivales (línea de sonrisa)' },
      { count: 24, label: 'Puntos de proporciones áureas' },
      { count: 48, label: 'Puntos de análisis de tercios faciales' }
    ];

    bioPoints.forEach((p, i) => {
      pdf.setTextColor(...BRAND.gold);
      pdf.text(`${p.count}`, 20, y + 20 + i * 6);
      pdf.setTextColor(...BRAND.textMuted);
      pdf.text(p.label, 32, y + 20 + i * 6);
    });

    // Methodology
    y = 108;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, y, pageWidth - 20, 50, 4, 4, 'F');
    pdf.setDrawColor(230, 230, 235);
    pdf.roundedRect(10, y, pageWidth - 20, 50, 4, 4, 'S');

    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('METODOLOGÍA CIENTÍFICA', 15, y + 10);
    pdf.setDrawColor(...BRAND.gold);
    pdf.line(15, y + 13, 60, y + 13);

    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.textMuted);
    const methodology = [
      '• Análisis basado en estándares de Ricketts y proporciones áureas faciales',
      '• Comparación con base de datos de +15,000 casos clínicos validados',
      '• Protocolos de armonía facial DSD (Digital Smile Design)',
      '• Procesamiento mediante IA especializada en estética dental',
      '• Calibración según parámetros de la American Academy of Esthetic Dentistry'
    ];
    methodology.forEach((m, i) => pdf.text(m, 15, y + 22 + i * 6));

    // Clinical Metrics Detail
    y = 165;
    pdf.setFillColor(...BRAND.lightGray);
    pdf.roundedRect(10, y, pageWidth - 20, 60, 4, 4, 'F');

    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('DETALLE DE MÉTRICAS CLÍNICAS', 15, y + 10);
    pdf.setDrawColor(...BRAND.gold);
    pdf.line(15, y + 13, 70, y + 13);

    pdf.setFontSize(8);
    const metrics = [
      { label: 'Desviación Línea Media', value: `${data.midlineDeviation.toFixed(1)} mm`, ideal: '0 - 1.5 mm', status: Math.abs(data.midlineDeviation) <= 1.5 },
      { label: 'Exposición Gingival', value: `${data.gingivalDisplay.toFixed(1)} mm`, ideal: '1 - 3 mm', status: data.gingivalDisplay >= 1 && data.gingivalDisplay <= 3 },
      { label: 'Corredor Bucal Izquierdo', value: `${data.buccalCorridorLeft.toFixed(1)}%`, ideal: '8 - 12%', status: data.buccalCorridorLeft >= 8 && data.buccalCorridorLeft <= 12 },
      { label: 'Corredor Bucal Derecho', value: `${data.buccalCorridorRight.toFixed(1)}%`, ideal: '8 - 12%', status: data.buccalCorridorRight >= 8 && data.buccalCorridorRight <= 12 },
      { label: 'Simetría Facial Global', value: `${data.facialSymmetryScore}%`, ideal: '>85%', status: data.facialSymmetryScore >= 85 }
    ];

    pdf.setTextColor(...BRAND.textMuted);
    pdf.text('Métrica', 15, y + 22);
    pdf.text('Valor', 80, y + 22);
    pdf.text('Rango Ideal', 110, y + 22);
    pdf.text('Estado', 155, y + 22);

    pdf.setDrawColor(210, 210, 215);
    pdf.line(15, y + 25, pageWidth - 15, y + 25);

    metrics.forEach((m, i) => {
      const rowY = y + 32 + i * 7;
      pdf.setTextColor(...BRAND.textDark);
      pdf.text(m.label, 15, rowY);
      pdf.text(m.value, 80, rowY);
      pdf.setTextColor(...BRAND.textMuted);
      pdf.text(m.ideal, 110, rowY);
      pdf.setTextColor(...(m.status ? BRAND.success : BRAND.warning));
      pdf.text(m.status ? '✓ Óptimo' : '◯ Revisar', 155, rowY);
    });

    // Disclaimer
    y = 232;
    pdf.setFillColor(255, 250, 240);
    pdf.roundedRect(10, y, pageWidth - 20, 28, 4, 4, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.warning);
    pdf.text('⚠ AVISO IMPORTANTE', 15, y + 8);

    pdf.setFontSize(7);
    pdf.setTextColor(...BRAND.textMuted);
    const disclaimer = 'Este reporte es generado mediante inteligencia artificial y tiene fines orientativos. No constituye un diagnóstico médico ni reemplaza la evaluación de un profesional de la salud. Los resultados deben ser validados por un odontólogo especialista antes de iniciar cualquier tratamiento.';
    const splitDisclaimer = pdf.splitTextToSize(disclaimer, pageWidth - 35);
    pdf.text(splitDisclaimer, 15, y + 15);

    drawFooter(pdf);

    // ========== PAGE 3: TREATMENT RECOMMENDATIONS ==========
    pdf.addPage();
    drawHeader(pdf, logoBase64, 3, 3, 'Plan de Tratamiento Sugerido');

    if (isPreview) {
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(50);
      pdf.text('DEMO', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }

    // Treatment intro
    y = 45;
    pdf.setFillColor(240, 248, 245);
    pdf.roundedRect(10, y, pageWidth - 20, 20, 4, 4, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(...BRAND.textDark);
    pdf.text('Basado en su análisis, el Motor ArmonIA™ sugiere las siguientes opciones de tratamiento:', 15, y + 8);
    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.textMuted);
    pdf.text('Estas recomendaciones deben ser evaluadas por un profesional. Los resultados varían según cada caso.', 15, y + 15);

    // Treatment cards
    y = 72;
    const priorityColors = {
      alta: BRAND.danger,
      media: BRAND.warning,
      baja: [100, 140, 180] as [number, number, number]
    };

    treatments.slice(0, 6).forEach((t, i) => {
      const cardY = y + i * 28;

      // Card background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, cardY, pageWidth - 20, 25, 4, 4, 'F');
      pdf.setDrawColor(230, 230, 235);
      pdf.roundedRect(10, cardY, pageWidth - 20, 25, 4, 4, 'S');

      // Priority indicator
      pdf.setFillColor(...priorityColors[t.priority]);
      pdf.roundedRect(10, cardY, 4, 25, 2, 0, 'F');

      // Priority badge
      const badgeLabel = t.priority === 'alta' ? 'PRIORIDAD ALTA' : t.priority === 'media' ? 'PRIORIDAD MEDIA' : 'OPCIONAL';
      pdf.setFillColor(...priorityColors[t.priority]);
      const badgeW = pdf.getTextWidth(badgeLabel) * 0.8 + 6;
      pdf.roundedRect(18, cardY + 3, badgeW, 5, 2, 2, 'F');
      pdf.setFontSize(6);
      pdf.setTextColor(255, 255, 255);
      pdf.text(badgeLabel, 18 + badgeW / 2, cardY + 6.5, { align: 'center' });

      // Title
      pdf.setFontSize(9);
      pdf.setTextColor(...BRAND.textDark);
      pdf.text(t.title, 18, cardY + 14);

      // Description
      pdf.setFontSize(7);
      pdf.setTextColor(...BRAND.textMuted);
      pdf.text(t.description, 18, cardY + 20);

      // Benefit
      pdf.setFontSize(7);
      pdf.setTextColor(...BRAND.success);
      pdf.text(`↑ ${t.benefit}`, pageWidth - 70, cardY + 14);
    });

    // Coupon section
    y = 245;
    pdf.setFillColor(...BRAND.gold);
    pdf.roundedRect(10, y, pageWidth - 20, 30, 4, 4, 'F');

    pdf.setTextColor(...BRAND.deepNavy);
    pdf.setFontSize(12);
    pdf.text('CUPÓN 20% DESCUENTO', pageWidth / 2, y + 10, { align: 'center' });

    pdf.setFontSize(9);
    pdf.text('Evaluación Clínica + Radiografía Panorámica en Clínica Miro', pageWidth / 2, y + 17, { align: 'center' });

    pdf.setFontSize(8);
    pdf.text('Código: SIMETRIA20  •  www.clinicamiro.cl  •  +56 9 3557 2986', pageWidth / 2, y + 24, { align: 'center' });

    drawFooter(pdf);

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

  const handleShare = async (platform: 'whatsapp' | 'email' | 'copy') => {
    const shareUrl = `${window.location.origin}/result/${analysisId}`;
    const shareText = `🦷✨ ¡Mira mi análisis facial con Simetría AI!\n\n📊 Smile Score: ${smileScore}/100\n📐 Simetría: ${symmetryScore}/100\n\n¿Quieres el tuyo? Es gratis 👉`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'email':
        const subject = encodeURIComponent('Mi análisis facial con Simetría AI 🦷✨');
        const body = encodeURIComponent(`¡Hola!\n\nAcabo de hacer mi análisis facial con IA:\n\n📊 Smile Score: ${smileScore}/100\n📐 Simetría: ${symmetryScore}/100\n\n¿Quieres hacer el tuyo? Es gratis:\n${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
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
      className="glass rounded-2xl p-6 space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Crown className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Tu Reporte Clínico Premium</h3>
          <p className="text-sm text-muted-foreground">3 páginas • 246 puntos • Plan de tratamiento</p>
        </div>
      </div>

      {/* What's Included */}
      <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
        <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Contenido del reporte:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> 246 Puntos Biométricos</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Interpretación IA</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Plan de Tratamiento</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Cupón 20% Clínica</span>
        </div>
      </div>

      {/* Preview Button */}
      <Button
        onClick={handlePreview}
        variant="outline"
        className="w-full border-primary/30 hover:bg-primary/10"
      >
        <Eye className="w-4 h-4 mr-2" />
        Vista Previa Demo
      </Button>

      {/* Download Button */}
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

      {/* Share Section */}
      <div className="space-y-3 pt-3 border-t border-border/50">
        <p className="text-sm font-medium flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          Compartir resultados
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-accent/30 hover:bg-accent/10"
            onClick={() => handleShare('whatsapp')}
          >
            <MessageCircle className="w-4 h-4 text-accent" />
            WhatsApp
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2 border-primary/30 hover:bg-primary/10"
            onClick={() => handleShare('email')}
          >
            <Mail className="w-4 h-4 text-primary" />
            Email
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleShare('copy')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Copiar enlace
        </Button>
      </div>

      {/* Viral Incentive */}
      <div className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-xl p-4 border border-primary/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">¡Gana un análisis Premium gratis!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Comparte con 5 amigos que completen su análisis
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
