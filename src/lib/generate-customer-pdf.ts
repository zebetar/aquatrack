

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { format } from 'date-fns';
import { APP_NAME } from './constants';
import { formatDurationFromHours } from './utils';

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
    doc.setTextColor(40, 52, 71); // Deep charcoal
    doc.text(APP_NAME, margin, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 140, 141); // Muted grey
    doc.text('Customer Statement', margin, 28);
    
    doc.setDrawColor(220, 220, 220); // Light grey line
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

  // --- CUSTOMER & BILLING SUMMARY (Two-column layout) ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('BILLED TO', margin, yPos);
  doc.text('BILLING SUMMARY', pageWidth / 2 + 10, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  
  doc.text(customer.name, margin, yPos);
  doc.text(customer.contactInfo || 'N/A', margin, yPos + 6);
  doc.text(`Joined: ${format(new Date(customer.createdAt), 'PPP')}`, margin, yPos + 12);
  
  let balanceStatus = "PKR 0.00";
  let balanceColor: [number, number, number] = [80, 80, 80];
  if (customer.balance > 0) {
    balanceStatus = `PKR ${customer.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    balanceColor = [231, 76, 60]; // Red for due
  } else if (customer.balance < 0) {
    balanceStatus = `PKR ${Math.abs(customer.balance).toLocaleString('en-US', {minimumFractionDigits: 2})} (Credit)`;
    balanceColor = [39, 174, 96]; // Green for credit
  }
  
  doc.text('Statement Date:', pageWidth / 2 + 10, yPos);
  doc.text(format(new Date(), 'PPP'), pageWidth - margin, yPos, { align: 'right' });
  
  doc.text('Current Balance:', pageWidth / 2 + 10, yPos + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...balanceColor);
  doc.text(balanceStatus, pageWidth - margin, yPos + 12, { align: 'right' });
  
  yPos += 25;
  
  drawFooter(doc.getNumberOfPages());

  const tableConfig = {
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
    },
    styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
    bodyStyles: { fillColor: [248, 249, 249] as [number, number, number] },
    alternateRowStyles: { fillColor: [255, 255, 255] as [number, number, number] },
    didDrawPage: (data: any) => {
      drawHeader();
      drawFooter(data.pageNumber);
      yPos = 45; // Reset yPos for the new page
    },
    margin: { top: 10, bottom: 25 },
  };

  if (usageRecords.length > 0) {
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      head: [['Date', 'Time Range', 'Duration', 'Cost (PKR)']],
      body: usageRecords.map(r => [
        format(new Date(r.date), 'PP'),
        `${format(new Date(r.startTime), 'p')} - ${format(new Date(r.endTime), 'p')}`,
        formatDurationFromHours(r.durationHours),
        r.cost.toLocaleString('en-US', {minimumFractionDigits: 2}),
      ]),
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No water usage records for this period.', margin, yPos);
    yPos += 10;
  }
  
  // Check for overflow before drawing the next table
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 45; 
  }

  if (payments.length > 0) {
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      headStyles: { ...tableConfig.headStyles, fillColor: [41, 128, 185] as [number, number, number] },
      head: [['Payment Date', 'Amount Paid (PKR)', 'Recorded By']],
      body: payments.map(p => [
        format(new Date(p.paymentDate), 'PP p'),
        p.amountPaid.toLocaleString('en-US', {minimumFractionDigits: 2}),
        p.recordedBy === 'admin001' ? 'Admin' : p.recordedBy,
      ]),
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No payment records for this period.', margin, yPos);
  }

  doc.save(`AquaTrack_Statement_${customer.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
