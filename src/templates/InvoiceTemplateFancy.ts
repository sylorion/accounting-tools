// src/templates/InvoiceTemplateFancy.ts

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { FacturXInvoice } from '../core/FacturXInvoice';
import { BaseInvoiceItem } from '../models/BaseInvoiceItem';

/**
 * A more modern, "fancy" invoice PDF renderer.
 * It includes:
 *  - A color header bar
 *  - Sectioned layout for Seller/Buyer info
 *  - Table-like layout for invoice items
 *  - Display of doc-level allowances/charges
 *  - Payment info block
 *  - Disclaimers & notes
 */
export class InvoiceTemplateFancy<T extends BaseInvoiceItem> {
  async render(invoice: FacturXInvoice): Promise<Uint8Array> {
    // 1. Create PDFDocument & add a page (A4 size)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // 2. Embed fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 3. Draw a colored header rectangle
    const headerHeight = 70;
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width,
      height: headerHeight,
      color: rgb(0.2, 0.47, 0.75), // Adjust color as desired
    });

    // 4. Title & main invoice info at the top
    const leftMargin = 50;
    let currentY = height - 45;

    page.drawText('FACTURE', {
      x: leftMargin,
      y: currentY,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Optional: Invoice number & date displayed in top-right corner
    const rightX = width - 200;
    page.drawText(`N° : ${invoice.header?.id || ''}`, {
      x: rightX,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: rgb(1, 1, 1),
    });
    currentY -= 15;
    if (invoice.header?.invoiceDate) {
      page.drawText(`Date : ${invoice.header.invoiceDate.toLocaleDateString('fr-FR')}`, {
        x: rightX,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: rgb(1, 1, 1),
      });
    }

    // 5. Seller & Buyer information block
    //    We'll draw a gray separator line, then print two "columns"
    currentY -= 40;

    // Draw section title
    page.drawText('Informations', {
      x: leftMargin,
      y: currentY,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 5;
    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: width - leftMargin, y: currentY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    currentY -= 20;

    // Seller
    page.drawText('Vendeur :', {
      x: leftMargin,
      y: currentY,
      size: 10,
      font: fontBold,
    });
    currentY -= 12;
    page.drawText(`${invoice.seller?.name || ''}`, {
      x: leftMargin,
      y: currentY,
      size: 10,
      font: fontRegular,
    });
    currentY -= 12;
    if (invoice.seller?.postalAddress) {
      page.drawText(
        `${invoice.seller.postalAddress.line1 || ''}, ${invoice.seller.postalAddress.city || ''} ${invoice.seller.postalAddress.countryCode || ''}`,
        {
          x: leftMargin,
          y: currentY,
          size: 10,
          font: fontRegular,
        }
      );
      currentY -= 12;
    }
    if (invoice.seller?.vatNumber) {
      page.drawText(`VAT: ${invoice.seller.vatNumber}`, {
        x: leftMargin,
        y: currentY,
        size: 9,
        font: fontRegular,
      });
      currentY -= 12;
    }

    // Buyer (draw next to Seller, so we keep the same Y but shift X)
    let buyerX = width / 2;
    let buyerY = height - 155; // near the same block start
    page.drawText('Acheteur :', {
      x: buyerX,
      y: buyerY,
      size: 10,
      font: fontBold,
    });
    buyerY -= 12;
    page.drawText(`${invoice.buyer?.name || ''}`, {
      x: buyerX,
      y: buyerY,
      size: 10,
      font: fontRegular,
    });
    buyerY -= 12;
    if (invoice.buyer?.postalAddress) {
      page.drawText(
        `${invoice.buyer.postalAddress.line1 || ''}, ${invoice.buyer.postalAddress.city || ''} ${invoice.buyer.postalAddress.countryCode || ''}`,
        {
          x: buyerX,
          y: buyerY,
          size: 10,
          font: fontRegular,
        }
      );
      buyerY -= 12;
    }
    if (invoice.buyer?.vatNumber) {
      page.drawText(`VAT: ${invoice.buyer.vatNumber}`, {
        x: buyerX,
        y: buyerY,
        size: 9,
        font: fontRegular,
      });
      buyerY -= 12;
    }

    // 6. Items table
    currentY -= 15;
    page.drawText('Désignation | Qté | PU | TVA | Total', {
      x: leftMargin,
      y: currentY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0.3),
    });
    currentY -= 12;
    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: width - leftMargin, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 12;

    let subtotal = 0;
    invoice.lines.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      const line = [
        item.description,
        item.quantity.toFixed(2),
        item.unitPrice.toFixed(2),
        (item.vatRate * 100).toFixed(0) + '%',
        lineTotal.toFixed(2),
      ].join(' | ');

      page.drawText(line, {
        x: leftMargin,
        y: currentY,
        size: 9,
        font: fontRegular,
      });
      currentY -= 12;
    });

    // 7. Doc-level allowances/charges (if any)
    if (invoice.docAllowanceCharges && invoice.docAllowanceCharges.length > 0) {
      currentY -= 10;
      page.drawText('Remises / Frais (doc-level):', {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0.3),
      });
      currentY -= 15;

      invoice.docAllowanceCharges.forEach((ac) => {
        const sign = ac.chargeIndicator ? '+' : '-';
        const label = ac.reason || (ac.chargeIndicator ? 'Charge' : 'Discount');
        const txt = `${label} (${sign}) : ${ac.actualAmount.toFixed(2)} ${invoice.currency}`;
        page.drawText(txt, {
          x: leftMargin + 10,
          y: currentY,
          size: 9,
          font: fontRegular,
        });
        currentY -= 12;
      });
    }

    // 8. Tax, Subtotal, Total
    const totalVat = invoice.lines.reduce(
      (acc, i) => acc + i.quantity * i.unitPrice * i.vatRate,
      0
    );
    let docAllowanceChargeTotal = 0;
    invoice.docAllowanceCharges?.forEach((ac) => {
      docAllowanceChargeTotal += ac.chargeIndicator ? ac.actualAmount : -ac.actualAmount;
    });
    const total = subtotal + totalVat + docAllowanceChargeTotal;

    currentY -= 10;
    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: width - leftMargin, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 15;

    page.drawText(`Sous-Total : ${subtotal.toFixed(2)} ${invoice.currency}`, {
      x: leftMargin,
      y: currentY,
      size: 10,
      font: fontRegular,
    });
    currentY -= 12;
    page.drawText(`TVA : ${totalVat.toFixed(2)} ${invoice.currency}`, {
      x: leftMargin,
      y: currentY,
      size: 10,
      font: fontRegular,
    });
    currentY -= 12;
    if (docAllowanceChargeTotal !== 0) {
      page.drawText(`Remises/Frais Net : ${docAllowanceChargeTotal.toFixed(2)} ${invoice.currency}`, {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: fontRegular,
      });
      currentY -= 12;
    }
    page.drawText(`Total : ${total.toFixed(2)} ${invoice.currency}`, {
      x: leftMargin,
      y: currentY,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.47, 0.75),
    });
    currentY -= 20;

    // 9. Payment info (if present)
    if (invoice.payment) {
      page.drawText('Informations de paiement', {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0.3),
      });
      currentY -= 15;
      if (invoice.payment.paymentMeansCode) {
        page.drawText(`Code: ${invoice.payment.paymentMeansCode}`, {
          x: leftMargin + 10,
          y: currentY,
          size: 9,
          font: fontRegular,
        });
        currentY -= 12;
      }
      if (invoice.payment.payeeIBAN) {
        page.drawText(`IBAN: ${invoice.payment.payeeIBAN}`, {
          x: leftMargin + 10,
          y: currentY,
          size: 9,
          font: fontRegular,
        });
        currentY -= 12;
      }
      if (invoice.payment.payeeBIC) {
        page.drawText(`BIC: ${invoice.payment.payeeBIC}`, {
          x: leftMargin + 10,
          y: currentY,
          size: 9,
          font: fontRegular,
        });
        currentY -= 12;
      }
      if (invoice.payment.dueDate) {
        page.drawText(`Date d'échéance: ${invoice.payment.dueDate.toLocaleDateString('fr-FR')}`, {
          x: leftMargin + 10,
          y: currentY,
          size: 9,
          font: fontRegular,
        });
        currentY -= 12;
      }
    }

    // 10. Disclaimers & notes
    if (invoice.disclaimers && invoice.disclaimers.length > 0) {
      currentY -= 20;
      page.drawText('Disclaimers:', {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: fontBold,
        color: rgb(0.8, 0, 0),
      });
      currentY -= 15;
      for (const disc of invoice.disclaimers) {
        page.drawText(`- ${disc}`, {
          x: leftMargin + 10,
          y: currentY,
          size: 9,
          font: fontRegular,
        });
        currentY -= 12;
      }
    }
    if (invoice.notes && invoice.notes.length > 0) {
      currentY -= 20;
      page.drawText('Notes:', {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: fontBold,
        color: rgb(0, 0.5, 0),
      });
      currentY -= 15;
      for (const note of invoice.notes) {
        page.drawText(`- ${note}`, {
          x: leftMargin + 10,
          y: currentY,
          size: 9,
          font: fontRegular,
        });
        currentY -= 12;
      }
    }

    // 11. Optional final "thank you" or customized closing
    // currentY -= 20;
    // page.drawText('Merci pour votre confiance!', {
    //   x: leftMargin,
    //   y: currentY,
    //   size: 8,
    //   font: fontRegular,
    //   color: rgb(0, 0, 0),
    // });

    // 12. Save and return
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
}
