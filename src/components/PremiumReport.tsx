import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Check, Loader2, Eye, MessageCircle, Mail, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

// Simulated data for preview mode - matches what's promised in landing
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
  gender: 'Femenino',
  // Additional ArmonIA factors for demo
  armoniaFactors: {
    skinElasticity: 78,
    boneDensityEstimate: 'Normal',
    hydrationLevel: 72,
    photodamageIndex: 15,
    wrinkleDepth: 'Leve',
    porosityLevel: 'Bajo',
    pigmentationUniformity: 85,
    lipVolumeRatio: 1.2,
    nasalBalance: 82,
    cheekboneProminence: 75,
    jawlineDefinition: 80,
    chinProjection: 78
  }
};

// Brand colors - Deep Space theme with gold accents
const BRAND_COLORS = {
  primaryGold: [218, 165, 32] as [number, number, number],    // Gold
  bronze: [205, 127, 50] as [number, number, number],         // Bronze
  deepSpace: [12, 10, 18] as [number, number, number],        // Deep space bg
  warmWhite: [245, 240, 230] as [number, number, number],     // Warm white
  accent: [168, 85, 247] as [number, number, number],         // Purple accent
  darkPurple: [45, 20, 65] as [number, number, number],       // Header purple
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  // Helper to draw professional score gauge with brand colors
  const drawScoreGauge = (pdf: jsPDF, x: number, y: number, score: number, label: string, sublabel: string, color: [number, number, number]) => {
    const radius = 22;
    
    // Outer ring background
    pdf.setDrawColor(60, 60, 60);
    pdf.setLineWidth(4);
    pdf.circle(x, y, radius, 'S');
    
    // Score arc with gradient effect
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
    
    // Inner circle
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
    
    // Load logo
    const logoBase64 = await getLogoBase64();
    
    // ============ PAGE 1: MAIN REPORT ============
    
    // Header with premium gradient effect
    pdf.setFillColor(...BRAND_COLORS.darkPurple);
    pdf.rect(0, 0, pageWidth, 60, 'F');
    
    // Gold accent lines
    pdf.setFillColor(...BRAND_COLORS.primaryGold);
    pdf.rect(0, 58, pageWidth, 2, 'F');
    pdf.setFillColor(...BRAND_COLORS.bronze);
    pdf.rect(0, 56, pageWidth, 1, 'F');
    
    // Add official logo
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', 12, 12, 50, 36);
      } catch (e) {
        // Fallback text if logo fails
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text('SIMETRÍA', 15, 32);
      }
    } else {
      // Fallback branded text
      pdf.setFillColor(...BRAND_COLORS.primaryGold);
      pdf.circle(22, 28, 12, 'F');
      pdf.setTextColor(...BRAND_COLORS.deepSpace);
      pdf.setFontSize(16);
      pdf.text('S', 22, 32, { align: 'center' });
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text('SIMETRÍA', 40, 28);
    }
    
    // Premium badge
    pdf.setFillColor(...BRAND_COLORS.primaryGold);
    pdf.roundedRect(pageWidth - 55, 15, 42, 10, 3, 3, 'F');
    pdf.setTextColor(...BRAND_COLORS.deepSpace);
    pdf.setFontSize(8);
    pdf.text('★ PREMIUM', pageWidth - 34, 21, { align: 'center' });
    
    // Subtitle
    pdf.setTextColor(...BRAND_COLORS.primaryGold);
    pdf.setFontSize(11);
    pdf.text('INFORME DE ANÁLISIS FACIAL PREMIUM', 70, 26);
    
    pdf.setFontSize(9);
    pdf.setTextColor(...BRAND_COLORS.bronze);
    pdf.text('Powered by Motor ArmonIA™ • 246 Puntos Biométricos', 70, 34);
    
    // Report metadata
    pdf.setFontSize(8);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`, 70, 44);
    pdf.text(`ID: ${data.analysisId.slice(0, 12).toUpperCase()}`, 70, 50);
    
    // Preview watermark
    if (isPreview) {
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(45);
      pdf.text('VISTA PREVIA', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }
    
    // Section: What's Included (fulfilling promises)
    let yPos = 62;
    pdf.setFillColor(250, 248, 240);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 18, 3, 3, 'F');
    pdf.setDrawColor(...BRAND_COLORS.primaryGold);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 18, 3, 3, 'S');
    
    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND_COLORS.bronze);
    pdf.text('✓ 246 Puntos Biométricos   ✓ 24+ Factores Personalizados   ✓ Motor ArmonIA™   ✓ 20% Dcto. Clínica Miro', pageWidth / 2, yPos + 5, { align: 'center' });
    
    // Section: Main Scores
    yPos = 88;
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 70, 3, 3, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(...BRAND_COLORS.darkPurple);
    pdf.text('📊 PUNTUACIONES PRINCIPALES', 15, yPos + 5);
    
    // Draw 3 score gauges with brand colors
    drawScoreGauge(pdf, 45, yPos + 40, data.smileScore, 'Smile Score', 'Estética dental', BRAND_COLORS.accent);
    drawScoreGauge(pdf, pageWidth / 2, yPos + 40, data.symmetryScore, 'Simetría', 'Balance visual', BRAND_COLORS.primaryGold);
    drawScoreGauge(pdf, pageWidth - 45, yPos + 40, data.facialSymmetryScore, 'ArmonIA Facial', 'Proporciones', [34, 197, 94]);
    
    // Section: Detailed Metrics
    yPos = 165;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, yPos - 5, (pageWidth - 25) / 2 + 5, 75, 3, 3, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(10, yPos - 5, (pageWidth - 25) / 2 + 5, 75, 3, 3, 'S');
    
    pdf.setFontSize(11);
    pdf.setTextColor(...BRAND_COLORS.darkPurple);
    pdf.text('📏 MÉTRICAS BIOMÉTRICAS', 15, yPos + 5);
    
    yPos += 16;
    drawMetricWithZone(pdf, 15, yPos, data.midlineDeviation, -4, 4, -1.5, 1.5, 'Desviación Línea Media', 'mm');
    yPos += 16;
    drawMetricWithZone(pdf, 15, yPos, data.gingivalDisplay, 0, 6, 1, 3, 'Exposición Gingival', 'mm');
    yPos += 16;
    drawMetricWithZone(pdf, 15, yPos, data.buccalCorridorLeft, 0, 20, 8, 12, 'Corredor Bucal Izq', '%');
    yPos += 16;
    drawMetricWithZone(pdf, 15, yPos, data.buccalCorridorRight, 0, 20, 8, 12, 'Corredor Bucal Der', '%');
    
    // Section: Facial Thirds (right side)
    const thirdsX = pageWidth / 2 + 8;
    const thirdsY = 165;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(thirdsX - 3, thirdsY - 5, (pageWidth - 25) / 2 + 5, 75, 3, 3, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(thirdsX - 3, thirdsY - 5, (pageWidth - 25) / 2 + 5, 75, 3, 3, 'S');
    
    pdf.setFontSize(11);
    pdf.setTextColor(...BRAND_COLORS.darkPurple);
    pdf.text('👤 PROPORCIONES FACIALES', thirdsX + 2, thirdsY + 5);
    
    drawFacialThirds(pdf, thirdsX + 20, thirdsY + 12, data.facialThirds);
    
    // Section: AI Interpretation
    yPos = 250;
    pdf.setFillColor(245, 240, 250);
    pdf.roundedRect(10, yPos - 5, pageWidth - 20, 35, 3, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(...BRAND_COLORS.darkPurple);
    pdf.text('🤖 INTERPRETACIÓN MOTOR ARMONIA™', 15, yPos + 5);
    
    const overallScore = Math.round((data.smileScore + data.symmetryScore + data.facialSymmetryScore) / 3);
    let interpretation = '';
    if (overallScore >= 85) {
      interpretation = 'Excelente armonía facial y dental. Tus proporciones están dentro de los rangos ideales según estándares internacionales. La simetría y balance de tu sonrisa destacan positivamente.';
    } else if (overallScore >= 70) {
      interpretation = 'Buena armonía general con áreas de oportunidad. Las métricas muestran un balance facial positivo. Se identifican sutiles asimetrías que podrían optimizarse con tratamientos conservadores.';
    } else {
      interpretation = 'Se identifican oportunidades de mejora significativas. Los valores fuera de rango pueden beneficiarse de una evaluación especializada para un plan de tratamiento personalizado.';
    }
    
    pdf.setFontSize(8);
    pdf.setTextColor(60, 60, 60);
    const splitInterpretation = pdf.splitTextToSize(interpretation, pageWidth - 40);
    pdf.text(splitInterpretation, 15, yPos + 14);
    
    // Footer with Coupon CTA - More prominent
    const footerY = pageHeight - 40;
    pdf.setFillColor(...BRAND_COLORS.darkPurple);
    pdf.rect(0, footerY - 5, pageWidth, 45, 'F');
    
    // Coupon box
    pdf.setFillColor(...BRAND_COLORS.primaryGold);
    pdf.roundedRect(15, footerY, pageWidth - 30, 28, 4, 4, 'F');
    
    pdf.setTextColor(...BRAND_COLORS.darkPurple);
    pdf.setFontSize(14);
    pdf.text('🎁 CUPÓN 20% DESCUENTO', pageWidth / 2, footerY + 10, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.text('Evaluación Presencial + Radiografía Panorámica en Clínica Miro', pageWidth / 2, footerY + 18, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.text('📍 www.clinicamiro.cl | 📱 +56 9 3557 2986 | Código: SIMETRIA20', pageWidth / 2, footerY + 25, { align: 'center' });
    
    // ============ PAGE 2: DETAILED ANALYSIS ============
    pdf.addPage();
    
    // Header with logo
    pdf.setFillColor(...BRAND_COLORS.darkPurple);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setFillColor(...BRAND_COLORS.primaryGold);
    pdf.rect(0, 28, pageWidth, 2, 'F');
    
    // Add logo on page 2
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', 10, 5, 30, 22);
      } catch (e) {
        // Fallback
      }
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('ANÁLISIS DETALLADO • MOTOR ARMONIA™', pageWidth / 2 + 15, 18, { align: 'center' });
    
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
    
    // Final footer with branding
    pdf.setFillColor(...BRAND_COLORS.darkPurple);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    pdf.setFillColor(...BRAND_COLORS.primaryGold);
    pdf.rect(0, pageHeight - 20, pageWidth, 1, 'F');
    
    // Add small logo
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', 15, pageHeight - 17, 18, 13);
      } catch (e) {
        // Fallback
      }
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('© 2025 Simetría AI • Clínica Miro • Todos los derechos reservados', pageWidth / 2 + 10, pageHeight - 10, { align: 'center' });
    
    pdf.setFontSize(7);
    pdf.setTextColor(...BRAND_COLORS.primaryGold);
    pdf.text('www.simetria.ai', pageWidth - 25, pageHeight - 10);
    
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

  const handleShareViaWhatsApp = async () => {
    const shareUrl = `${window.location.origin}/result/${analysisId}`;
    const shareText = `🦷✨ ¡Mira mi análisis facial con Simetría AI!\n\n📊 Smile Score: ${smileScore}/100\n📐 Simetría: ${symmetryScore}/100\n\n¿Quieres el tuyo? Es gratis 👉`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const handleShareViaEmail = async () => {
    const shareUrl = `${window.location.origin}/result/${analysisId}`;
    const subject = encodeURIComponent('Mi análisis facial con Simetría AI 🦷✨');
    const body = encodeURIComponent(`¡Hola!\n\nAcabo de hacer mi análisis facial con IA y quería compartirte los resultados:\n\n📊 Smile Score: ${smileScore}/100\n📐 Simetría: ${symmetryScore}/100\n\n¿Quieres hacer el tuyo? Es gratis:\n${shareUrl}\n\n¡Saludos!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Tu Reporte Premium</h3>
          <p className="text-sm text-muted-foreground">2 páginas • 246 puntos • Motor ArmonIA™</p>
        </div>
      </div>

      {/* What's Included */}
      <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
        <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Incluido en tu reporte:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>✓ 246 Puntos Biométricos</span>
          <span>✓ Motor ArmonIA™ (Demo)</span>
          <span>✓ 24+ Factores Personalizados</span>
          <span>✓ Cupón 20% Clínica Miro</span>
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

      {/* Share Section - Enhanced for virality */}
      <div className="space-y-3 pt-2 border-t border-border/50">
        <p className="text-sm font-medium flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          Enviar y compartir
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-green-500/30 hover:bg-green-500/10"
            onClick={handleShareViaWhatsApp}
          >
            <MessageCircle className="w-4 h-4 text-green-500" />
            WhatsApp
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-blue-500/30 hover:bg-blue-500/10"
            onClick={handleShareViaEmail}
          >
            <Mail className="w-4 h-4 text-blue-500" />
            Email
          </Button>
        </div>

        <Button 
          variant="outline"
          className="w-full"
          onClick={() => handleShare('copy')}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Copiar enlace
        </Button>
      </div>

      {/* Viral Share Incentive */}
      <div className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-xl p-4 border border-primary/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-white" />
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
