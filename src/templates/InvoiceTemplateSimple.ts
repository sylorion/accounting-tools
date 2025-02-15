// src/templates/InvoiceTemplateSimple.ts
import { BaseInvoiceTemplate } from './BaseInvoiceTemplate';
import { InvoiceData } from '../models/InvoiceData';
import { BaseInvoiceItem } from '../models/BaseInvoiceItem';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Un template minimaliste, codé "en dur".
 * On peut imaginer un template plus riche (logos, backgrounds, etc.).
 */
export class InvoiceTemplateSimple<T extends BaseInvoiceItem> extends BaseInvoiceTemplate<T> {
  async render(invoiceData: InvoiceData<T>): Promise<Uint8Array> {
    // 1. Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // approx A4

    const { width, height } = page.getSize();

    // 2. Polices
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 3. Titre
    page.drawText('FACTURE', {
      x: 50,
      y: height - 60,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0.6),
    });

    // 4. Infos principales
    let currentY = height - 90;
    page.drawText(`N° : ${invoiceData.invoiceNumber}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });
    currentY -= 15;
    page.drawText(`Date : ${invoiceData.invoiceDate.toLocaleDateString('fr-FR')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    // 5. Seller / Buyer
    currentY -= 25;
    page.drawText(`Vendeur : ${invoiceData.seller.name}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontBold,
    });
    currentY -= 12;
    page.drawText(`${invoiceData.seller.street} - ${invoiceData.seller.city}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    currentY -= 20;
    page.drawText(`Acheteur : ${invoiceData.buyer.name}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontBold,
    });
    currentY -= 12;
    page.drawText(`${invoiceData.buyer.street} - ${invoiceData.buyer.city}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    // 6. Items
    currentY -= 30;
    page.drawText('Désignation | Qte | PU | TVA | Total', {
      x: 50,
      y: currentY,
      size: 10,
      font: fontBold,
    });

    currentY -= 15;
    let subtotal = 0;
    for (const item of invoiceData.items) {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      const line = [
        item.description,
        item.quantity.toFixed(2),
        item.unitPrice.toFixed(2),
        (item.vatRate * 100).toFixed(0) + '%',
        lineTotal.toFixed(2),
      ].join(' | ');
      page.drawText(line, { x: 50, y: currentY, size: 9, font: fontRegular });
      currentY -= 12;
    }

    // 7. Calcul TVA & total
    const totalVat = invoiceData.items.reduce(
      (acc, i) => acc + i.quantity * i.unitPrice * i.vatRate,
      0
    );
    const total = subtotal + totalVat;
    currentY -= 10;
    page.drawText(`Sous-Total : ${subtotal.toFixed(2)} ${invoiceData.currency}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });
    currentY -= 12;
    page.drawText(`TVA : ${totalVat.toFixed(2)} ${invoiceData.currency}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });
    currentY -= 12;
    page.drawText(`Total : ${total.toFixed(2)} ${invoiceData.currency}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontBold,
    });

    // 8. Disclaimers & notes
    if (invoiceData.disclaimers && invoiceData.disclaimers.length > 0) {
      currentY -= 20;
      page.drawText('Disclaimers:', { x: 50, y: currentY, size: 10, font: fontBold });
      currentY -= 12;
      for (const disc of invoiceData.disclaimers) {
        page.drawText(`- ${disc}`, { x: 60, y: currentY, size: 9, font: fontRegular });
        currentY -= 12;
      }
    }
    if (invoiceData.notes && invoiceData.notes.length > 0) {
      currentY -= 20;
      page.drawText('Notes:', { x: 50, y: currentY, size: 10, font: fontBold });
      currentY -= 12;
      for (const note of invoiceData.notes) {
        page.drawText(`- ${note}`, { x: 60, y: currentY, size: 9, font: fontRegular });
        currentY -= 12;
      }
    }

    // 9. Finaliser
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
}
