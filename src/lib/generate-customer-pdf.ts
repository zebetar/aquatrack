
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { format } from 'date-fns';
import { APP_NAME } from './constants';

export async function generateCustomerPdf(
  customer: Customer,
  usageRecords: WaterUsageRecord[],
  payments: Payment[]
): Promise<void> {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  let yPos = 20; // Initial Y position for content

  // Helper function to add text and manage Y position
  const addText = (text: string, x: number, y: number, options?: any) => {
    doc.text(text, x, y, options);
  };

  // Helper function to check for page overflow and add new page
  const checkPageOverflow = (currentY: number, neededHeight: number = 20) => {
    if (currentY + neededHeight > pageHeight - 20) { // 20 for bottom margin
      doc.addPage();
      return 20; // Reset Y position for new page
    }
    return currentY;
  };

  // Document Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  addText(`${APP_NAME} - Customer Statement`, 14, yPos);
  yPos += 10;

  // Date Generated
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  addText(`Date Generated: ${format(new Date(), 'PPP p')}`, 14, yPos);
  yPos += 10;

  // Customer Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  addText('Customer Information', 14, yPos);
  yPos += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  addText(`Name: ${customer.name}`, 14, yPos);
  yPos += 6;
  addText(`Customer ID: ${customer.id}`, 14, yPos);
  yPos += 6;
  addText(`Contact: ${customer.contactInfo || 'N/A'}`, 14, yPos);
  yPos += 6;
  addText(`Joined: ${format(new Date(customer.createdAt), 'PPP')}`, 14, yPos);
  yPos += 10;

  // Billing Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  addText('Billing Summary', 14, yPos);
  yPos += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let balanceStatus = "Settled";
  if (customer.balance > 0) balanceStatus = `Due: PKR ${customer.balance.toLocaleString('en-US')}`;
  if (customer.balance < 0) balanceStatus = `Credit: PKR ${Math.abs(customer.balance).toLocaleString('en-US')}`;
  addText(`Current Balance: ${balanceStatus}`, 14, yPos);
  yPos += 10;
  
  yPos = checkPageOverflow(yPos, 40); // Check space for table header

  // Water Usage History
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  addText('Water Usage History', 14, yPos);
  yPos += 7;

  if (usageRecords.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Start Time', 'End Time', 'Duration (Hrs)', 'Cost (PKR)']],
      body: usageRecords.map(r => [
        format(new Date(r.date), 'PP'),
        format(new Date(r.startTime), 'p'),
        format(new Date(r.endTime), 'p'),
        r.durationHours.toFixed(2),
        r.cost.toLocaleString('en-US'),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] }, // Teal color
      margin: { top: yPos },
      didDrawPage: (data) => { yPos = data.cursor?.y ?? yPos; } // Update yPos after table draw
    });
    yPos = (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 10 : yPos + 10;
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    addText('No water usage records found.', 14, yPos);
    yPos += 10;
  }

  yPos = checkPageOverflow(yPos, 40); // Check space for table header

  // Payment History
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  addText('Payment History', 14, yPos);
  yPos += 7;

  if (payments.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Payment Date', 'Amount Paid (PKR)', 'Recorded By']],
      body: payments.map(p => [
        format(new Date(p.paymentDate), 'PP p'),
        p.amountPaid.toLocaleString('en-US'),
        p.recordedBy === 'admin001' ? 'Admin' : p.recordedBy,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }, // Blue color
      margin: { top: yPos },
      didDrawPage: (data) => { yPos = data.cursor?.y ?? yPos; }
    });
    yPos = (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 10 : yPos + 10;
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    addText('No payment records found.', 14, yPos);
    yPos += 10;
  }

  // Footer Note (Optional)
  yPos = checkPageOverflow(yPos);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  addText('Thank you for choosing AquaTrack Mobile.', 14, pageHeight - 10);

  // Save PDF
  doc.save(`AquaTrack_Statement_${customer.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
