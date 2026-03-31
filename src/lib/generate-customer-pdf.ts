
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { format } from 'date-fns';
import { APP_NAME } from './constants';
import { formatDurationFromHours } from './utils';

// Definitive tuple type for RGB colors to satisfy jspdf-autotable strictly
type ColorTuple = [number, number, number];

export async function generateCustomerPdf(
  customer: Customer,
  usageRecords: WaterUsageRecord[],
  payments: Payment[]
): Promise<void> {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  const drawHeader = () => {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 52, 71); 
    doc.text(APP_NAME, margin, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 140, 141); 
    doc.text('Customer Statement', margin, 28);
    
    doc.setDrawColor(220, 220, 220); 
    doc.line(margin, 35, pageWidth - margin, 35);
  };
  
  const drawFooter = (pageNumber: number) => {
    const footerY = pageHeight - 15;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(127, 140, 141);
    doc.text('Thank you for choosing AquaTrack for your water management needs.', margin, footerY);
    doc.text(`Page ${pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
  };
  
  drawHeader();
  let yPos = 45;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('BILLED TO', margin, yPos);
  doc.text('BILLING SUMMARY', pageWidth / 2 + 10, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  doc.text(customer.name, margin, yPos);
  doc.text(customer.contactInfo || 'N/A', margin, yPos + 6);
  doc.text(`Joined: ${format(new Date(customer.createdAt), 'PPP')}`, margin, yPos + 12);
  
  let balanceStatus = "PKR 0.00";
  let balanceColor: ColorTuple = [80, 80, 80];
  if (customer.balance > 0) {
    balanceStatus = `PKR ${customer.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    balanceColor = [231, 76, 60]; 
  } else if (customer.balance < 0) {
    balanceStatus = `PKR ${Math.abs(customer.balance).toLocaleString('en-US', {minimumFractionDigits: 2})} (Credit)`;
    balanceColor = [39, 174, 96]; 
  }
  
  doc.text('Statement Date:', pageWidth / 2 + 10, yPos);
  doc.text(format(new Date(), 'PPP'), pageWidth - margin, yPos, { align: 'right' });
  
  doc.text('Current Balance:', pageWidth / 2 + 10, yPos + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.text(balanceStatus, pageWidth - margin, yPos + 12, { align: 'right' });
  
  yPos += 25;
  
  // Explicitly typed color tuples to prevent TypeScript errors in Vercel
  const hFill: ColorTuple = [44, 62, 80];
  const hText: ColorTuple = [255, 255, 255];
  const bFill: ColorTuple = [248, 249, 249];
  const aFill: ColorTuple = [255, 255, 255];
  const pHeadFill: ColorTuple = [41, 128, 185];

  if (usageRecords.length > 0) {
    autoTable(doc, {
      startY: yPos,
      theme: 'grid',
      headStyles: {
        fillColor: hFill,
        textColor: hText,
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
      bodyStyles: { fillColor: bFill },
      alternateRowStyles: { fillColor: aFill },
      head: [['Date', 'Time Range', 'Duration', 'Cost (PKR)']],
      body: usageRecords.map(r => [
        format(new Date(r.date), 'PP'),
        `${format(new Date(r.startTime), 'p')} - ${format(new Date(r.endTime), 'p')}`,
        formatDurationFromHours(r.durationHours),
        r.cost.toLocaleString('en-US', {minimumFractionDigits: 2}),
      ]),
      didDrawPage: (data) => {
        drawHeader();
        drawFooter(data.pageNumber);
      },
      margin: { top: 40, bottom: 25 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(127, 140, 141);
    doc.text('No water usage records for this period.', margin, yPos);
    yPos += 10;
  }
  
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 45; 
  }

  if (payments.length > 0) {
    autoTable(doc, {
      startY: yPos,
      theme: 'grid',
      headStyles: {
        fillColor: pHeadFill,
        textColor: hText,
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
      bodyStyles: { fillColor: bFill },
      alternateRowStyles: { fillColor: aFill },
      head: [['Payment Date', 'Amount Paid (PKR)', 'Recorded By']],
      body: payments.map(p => [
        format(new Date(p.paymentDate), 'PP p'),
        p.amountPaid.toLocaleString('en-US', {minimumFractionDigits: 2}),
        p.recordedBy === 'admin001' ? 'Admin' : 'Staff',
      ]),
      didDrawPage: (data) => {
        drawHeader();
        drawFooter(data.pageNumber);
      },
      margin: { top: 40, bottom: 25 },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(127, 140, 141);
    doc.text('No payment records for this period.', margin, yPos);
  }

  doc.save(`AquaTrack_Statement_${customer.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
