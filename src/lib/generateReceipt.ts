import jsPDF from 'jspdf';
import { formatGNF, formatDate, formatDateTime } from './formatCurrency';
import type { Invoice } from '@/hooks/useInvoices';
import type { Payment } from '@/hooks/usePayments';

interface ReceiptData {
  invoice: Invoice;
  payment?: Payment;
  payments?: Payment[];
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}

/**
 * Generate a professional receipt PDF
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const { invoice, payment, companyName = 'FacturePro Guinée' } = data;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150], // Receipt paper size
  });

  const pageWidth = 80;
  let y = 10;

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('REÇU DE PAIEMENT', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(5, y, pageWidth - 5, y);
  y += 5;

  // Invoice info
  doc.setFontSize(8);
  doc.text(`Facture: ${invoice.invoice_number}`, 5, y);
  y += 4;
  doc.text(`Client: ${invoice.clients?.name || 'N/A'}`, 5, y);
  y += 4;
  doc.text(`Date: ${formatDateTime(new Date().toISOString())}`, 5, y);
  y += 6;

  // Divider
  doc.line(5, y, pageWidth - 5, y);
  y += 5;

  // Payment details
  if (payment) {
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU PAIEMENT', 5, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Montant: ${formatGNF(payment.amount)}`, 5, y);
    y += 4;
    doc.text(`Type: ${getPaymentTypeLabel(payment.payment_type)}`, 5, y);
    y += 4;
    doc.text(`Mode: ${getPaymentMethodLabel(payment.payment_method)}`, 5, y);
    y += 4;
    
    if (payment.reference) {
      doc.text(`Réf: ${payment.reference}`, 5, y);
      y += 4;
    }
  }

  y += 4;

  // Invoice summary
  doc.setFont('helvetica', 'bold');
  doc.text('RÉSUMÉ FACTURE', 5, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total facture:`, 5, y);
  doc.text(formatGNF(invoice.total), pageWidth - 5, y, { align: 'right' });
  y += 4;
  
  doc.text(`Montant payé:`, 5, y);
  doc.text(formatGNF(invoice.paid_amount), pageWidth - 5, y, { align: 'right' });
  y += 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Solde restant:`, 5, y);
  doc.text(formatGNF(invoice.balance), pageWidth - 5, y, { align: 'right' });
  y += 8;

  // Status
  const statusText = getStatusText(invoice.status, invoice.balance);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Merci pour votre confiance!', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('FacturePro - Guinée', pageWidth / 2, y, { align: 'center' });

  return doc.output('blob');
}

/**
 * Generate a professional invoice PDF
 */
export async function generateInvoicePDF(data: ReceiptData): Promise<Blob> {
  const { invoice, payments = [], companyName = 'FacturePro Guinée', companyAddress, companyPhone } = data;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, margin, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (companyAddress) {
    y += 7;
    doc.text(companyAddress, margin, y);
  }
  if (companyPhone) {
    y += 5;
    doc.text(companyPhone, margin, y);
  }

  // Invoice title
  y += 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', pageWidth - margin, y - 10, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${invoice.invoice_number}`, pageWidth - margin, y - 3, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.issue_date)}`, pageWidth - margin, y + 4, { align: 'right' });
  if (invoice.due_date) {
    doc.text(`Échéance: ${formatDate(invoice.due_date)}`, pageWidth - margin, y + 11, { align: 'right' });
  }

  // Client info
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURER À:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.clients?.name || 'Client non spécifié', margin, y);
  y += 15;

  // Items table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', margin + 2, y + 5);
  doc.text('Qté', margin + 100, y + 5);
  doc.text('P.U.', margin + 120, y + 5);
  doc.text('Total', pageWidth - margin - 2, y + 5, { align: 'right' });
  y += 10;

  // Items
  doc.setFont('helvetica', 'normal');
  if (invoice.invoice_items && invoice.invoice_items.length > 0) {
    for (const item of invoice.invoice_items) {
      doc.text(item.description.substring(0, 50), margin + 2, y + 4);
      doc.text(String(item.quantity || 1), margin + 100, y + 4);
      doc.text(formatGNF(item.unit_price), margin + 120, y + 4);
      doc.text(formatGNF(item.total), pageWidth - margin - 2, y + 4, { align: 'right' });
      y += 8;
    }
  } else {
    doc.text('Aucun article', margin + 2, y + 4);
    y += 8;
  }

  // Totals
  y += 5;
  doc.setLineWidth(0.5);
  doc.line(margin + 100, y, pageWidth - margin, y);
  y += 8;

  doc.text('Sous-total:', margin + 100, y);
  doc.text(formatGNF(invoice.subtotal), pageWidth - margin - 2, y, { align: 'right' });
  y += 6;

  doc.text(`TVA (${invoice.tax_rate}%):`, margin + 100, y);
  doc.text(formatGNF(invoice.tax_amount), pageWidth - margin - 2, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', margin + 100, y);
  doc.text(formatGNF(invoice.total), pageWidth - margin - 2, y, { align: 'right' });
  y += 10;

  // Payment info
  if (invoice.paid_amount > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Montant payé:', margin + 100, y);
    doc.text(formatGNF(invoice.paid_amount), pageWidth - margin - 2, y, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('SOLDE DÛ:', margin + 100, y);
    doc.text(formatGNF(invoice.balance), pageWidth - margin - 2, y, { align: 'right' });
    y += 10;
  }

  // Status badge
  const statusText = getStatusText(invoice.status, invoice.balance);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth / 2, y + 10, { align: 'center' });

  // Notes
  if (invoice.notes) {
    y += 25;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.text(invoice.notes, margin, y);
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Merci pour votre confiance!', pageWidth / 2, 280, { align: 'center' });

  return doc.output('blob');
}

function getPaymentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    deposit: 'Acompte',
    partial: 'Paiement partiel',
    full: 'Paiement intégral',
    balance: 'Solde',
  };
  return labels[type] || type;
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
    bank_transfer: 'Virement bancaire',
    check: 'Chèque',
    other: 'Autre',
  };
  return labels[method] || method;
}

function getStatusText(status: string, balance: number | null): string {
  if (status === 'paid' || (balance !== null && balance <= 0)) {
    return '✓ PAYÉE INTÉGRALEMENT';
  }
  if (status === 'partial' || (balance !== null && balance > 0)) {
    return '⏳ PAIEMENT PARTIEL';
  }
  if (status === 'cancelled') {
    return '✗ ANNULÉE';
  }
  return '📋 EN ATTENTE';
}

/**
 * Share via WhatsApp
 */
export function shareViaWhatsApp(text: string, phone?: string): void {
  const encodedText = encodeURIComponent(text);
  const url = phone 
    ? `https://wa.me/${phone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank');
}

/**
 * Generate shareable invoice text
 */
export function generateInvoiceShareText(invoice: Invoice): string {
  const lines = [
    `📄 FACTURE ${invoice.invoice_number}`,
    ``,
    `Client: ${invoice.clients?.name || 'N/A'}`,
    `Date: ${formatDate(invoice.issue_date)}`,
    ``,
    `💰 Total: ${formatGNF(invoice.total)}`,
    `✅ Payé: ${formatGNF(invoice.paid_amount)}`,
    `📌 Solde: ${formatGNF(invoice.balance)}`,
    ``,
    `Statut: ${getStatusText(invoice.status, invoice.balance)}`,
    ``,
    `Envoyé via FacturePro Guinée`,
  ];
  return lines.join('\n');
}
