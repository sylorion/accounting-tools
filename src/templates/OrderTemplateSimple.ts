// src/templates/OrderTemplateSimple.ts
import { BaseOrderTemplate } from './BaseOrderTemplate';
import { OrderData } from '../models/OrderData';
import { BaseOrderItem } from '../models/BaseOrderItem';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export class OrderTemplateSimple<T extends BaseOrderItem> extends BaseOrderTemplate<T> {
  async render(orderData: OrderData<T>): Promise<Uint8Array> {
    // 1. Créer PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // 2. Polices
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 3. Titre "COMMANDE"
    page.drawText('COMMANDE', {
      x: 50,
      y: height - 60,
      size: 18,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.7),
    });

    let currentY = height - 90;
    page.drawText(`N° : ${orderData.orderNumber}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });
    currentY -= 15;
    page.drawText(`Date : ${orderData.orderDate.toLocaleDateString('fr-FR')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    // 4. Seller / Buyer
    currentY -= 25;
    page.drawText(`Vendeur : ${orderData.seller.name}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontBold,
    });
    currentY -= 12;
    page.drawText(`${orderData.seller.street} - ${orderData.seller.city}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    currentY -= 20;
    page.drawText(`Acheteur : ${orderData.buyer.name}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontBold,
    });
    currentY -= 12;
    page.drawText(`${orderData.buyer.street} - ${orderData.buyer.city}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    // 5. Items
    currentY -= 30;
    page.drawText('Désignation | Qte | PU', {
      x: 50,
      y: currentY,
      size: 10,
      font: fontBold,
    });
    currentY -= 15;
    for (const item of orderData.items) {
      const line = [
        item.description,
        item.quantity.toFixed(2),
        item.unitPrice.toFixed(2)
      ].join(' | ');
      page.drawText(line, { x: 50, y: currentY, size: 9, font: fontRegular });
      currentY -= 12;
    }

    // 6. Disclaimers & notes
    if (orderData.disclaimers?.length) {
      currentY -= 20;
      page.drawText('Disclaimers:', { x: 50, y: currentY, font: fontBold, size: 10 });
      currentY -= 12;
      for (const d of orderData.disclaimers) {
        page.drawText(`- ${d}`, { x: 60, y: currentY, size: 9, font: fontRegular });
        currentY -= 12;
      }
    }
    if (orderData.notes?.length) {
      currentY -= 20;
      page.drawText('Notes:', { x: 50, y: currentY, font: fontBold, size: 10 });
      currentY -= 12;
      for (const n of orderData.notes) {
        page.drawText(`- ${n}`, { x: 60, y: currentY, size: 9, font: fontRegular });
        currentY -= 12;
      }
    }

    // 7. Finaliser
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
}
