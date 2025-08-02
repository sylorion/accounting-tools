// src/templates/InvoiceTemplateFancy.ts
import fontkit from '@pdf-lib/fontkit';
import path from 'path';
import fs from 'fs';
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import { FacturXInvoice } from '../core/FacturXInvoice';
import { BaseInvoiceItem } from '../models/BaseInvoiceItem';
import { BUYER_LOGO_BASE64, SELLER_LOGO_BASE64 } from './img';

// Interface pour les détails de TVA
interface VATDetail {
  rate: number;
  base: number;
  amount: number;
}

/**
 * A modern, "fancy" invoice PDF renderer with multi-page support for FacturXInvoice.
 */
export class InvoiceTemplateFancy<T extends BaseInvoiceItem> {
  // Color palette matching pdfExport.js exactly
  private readonly COLORS = {
    pink: rgb(219/255, 39/255, 119/255),
    pinkLight: rgb(252/255, 231/255, 243/255),
    blue: rgb(59/255, 130/255, 246/255),
    blueLight: rgb(239/255, 246/255, 255/255),
    gray: rgb(107/255, 114/255, 128/255),
    grayLight: rgb(249/255, 250/255, 251/255),
    dark: rgb(31/255, 41/255, 55/255)
  };

  // A4 dimensions in points (210mm x 297mm)
  private readonly A4_WIDTH = 595.28;
  private readonly A4_HEIGHT = 841.89;
  private readonly MARGIN = 42.52; // 15mm in points
  private readonly CONTENT_WIDTH = this.A4_WIDTH - (this.MARGIN * 2);

  // Logo dimensions and positioning
  private readonly LOGO_WIDTH = 56.69; // 20mm in points
  private readonly LOGO_HEIGHT = 56.69; // 20mm in points
  private readonly TEXT_OFFSET_X = 11.34; // 4mm in points
  private fontRegular: any;
  private fontBold: any;
  private pdfDoc!: PDFDocument;
  private pages: { page: PDFPage; currentY: number }[] = [];
  private currentPageIndex = 0;

  /**
   * Dessiner une image base64 sur le PDF
   */
  private async drawBase64Image(
    page: PDFPage,
    base64: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number
  ): Promise<void> {
    try {
      // Créer l'image à partir du base64
      const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      
      // Essayer d'abord PNG, puis JPG si ça échoue
      let image;
      try {
        image = await this.pdfDoc.embedPng(imageBytes);
      } catch {
        image = await this.pdfDoc.embedJpg(imageBytes);
      }

      // Calculer les dimensions avec ratio
      const { width, height } = image;
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const displayWidth = width * ratio;
      const displayHeight = height * ratio;

      // Dessiner l'image
      page.drawImage(image, {
        x,
        y: y - displayHeight, // pdf-lib utilise le coin inférieur gauche
        width: displayWidth,
        height: displayHeight
      });
    } catch (error) {
      console.warn('Erreur lors du chargement de l\'image:', error);
      // Dessiner un rectangle de placeholder si l'image échoue
      page.drawRectangle({
        x,
        y: y - maxHeight,
        width: maxWidth,
        height: maxHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1
      });
    }
  }

  async render(invoice: FacturXInvoice): Promise<Uint8Array> {
    // 1. Create PDFDocument
    this.pdfDoc = await PDFDocument.create();
    this.pdfDoc.registerFontkit(fontkit);
    
    // 2. Embed fonts
    this.fontRegular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 3. Initialize first page
    this.createNewPage(true);
    
    // 4. Draw first page content
    await this.drawFirstPageContent(invoice);

    // 5. Draw items table (may span multiple pages)
    await this.drawItemsTable(invoice);

    // 6. Draw summary on last page with payment info
    await this.drawSummaryOnLastPage(invoice);

    // 7. Add footers to all pages
    this.addFootersToAllPages(invoice);

    // 8. Add page numbers
    this.addPageNumbers();

    // 9. Save and return
    const pdfBytes = await this.pdfDoc.save();
    return pdfBytes;
  }

  // Création d'une nouvelle page et initialisation de la position Y
  private createNewPage(isFirstPage = false): {
    page: PDFPage;
    currentY: number;
  } {
    const page = this.pdfDoc.addPage([this.A4_WIDTH, this.A4_HEIGHT]);
    // Position Y initiale au niveau de la marge haute pour toutes les pages
    const initialY = this.A4_HEIGHT - this.MARGIN;
    this.pages.push({ page, currentY: initialY });
    this.currentPageIndex = this.pages.length - 1;
    return { page, currentY: initialY };
  }

 
 
  // Ajouter le numérotation de pages (Page X of Y)
  private drawPageNumbering(font: any): void {
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i].page;
      const totalPages = this.pages.length;
      const text = `Page ${i + 1} of ${totalPages}`;
      page.drawText(text, {
        x: this.MARGIN,
        y: this.MARGIN + 10,
        font,
        size: 12,
      });
    }
  } 
  /**
   * Ajouter le header complet sur une nouvelle page (en-tête + header répétitif)
   */
  private async drawPageHeader(invoice: FacturXInvoice): Promise<number> {
    const { currentY: yPosition } = this.pages[this.currentPageIndex];
    
    // 1. En-tête de page avec QR code et identifiants (toutes les pages)
    let currentY = await this.drawPageHeaderTop(invoice, yPosition);
    
    // 2. Header différent selon la page
    if (this.currentPageIndex === 0) {
      // Version complète pour la première page
      currentY = await this.drawCompleteHeader(invoice, currentY);
    } else {
      // Version simplifiée pour les pages suivantes
      currentY = await this.drawSimpleHeader(invoice, currentY);
    }
    
    // Update currentY in pages array
    this.pages[this.currentPageIndex].currentY = currentY;
    
    return currentY;
  }

  /**
   * Dessine l'en-tête de page avec QR code et identifiants (toutes les pages)
   */
  private async drawPageHeaderTop(
    invoice: FacturXInvoice, 
    yPosition: number
  ): Promise<number> {
    const {page} = this.pages[this.currentPageIndex];
    
    // QR Code et code modèle alignés sur le bord droit
    const qrSize = 40;
    const modelCodeWidth = 60; // Largeur approximative pour INV.2025.01 en vertical
    const qrX = this.A4_WIDTH - this.MARGIN - qrSize; // Aligné sur le bord droit
    const qrY = yPosition - qrSize; // Aligné avec la borne haute de l'émetteur
    
    // Fond blanc pour le QR code
    page.drawRectangle({
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
      color: rgb(1, 1, 1),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // Pattern QR code
    const qrPattern = this.generateSimpleQRPattern();
    const cellSize = 2;
    qrPattern.forEach((row: number[], i: number) => {
      row.forEach((cell: number, j: number) => {
        if (cell === 1) {
          page.drawRectangle({
            x: qrX + 3 + (j * cellSize),
            y: qrY + qrSize - 3 - ((i + 1) * cellSize),
            width: cellSize,
            height: cellSize,
            color: rgb(0, 0, 0)
          });
        }
      });
    });

    // Code du modèle "INV.2025.01" à DROITE du QR code
    const modelCode = "INV.2025.01";
    const modelX = qrX + qrSize + 5; // À droite du QR code
    const modelY = qrY + qrSize; // Aligné avec le haut du QR code
    
    page.drawText(modelCode, {
      x: modelX,
      y: modelY,
      size: 8,
      font: this.fontRegular,
      color: this.COLORS.gray,
      rotate: { type: 'degrees', angle: -90 } as any
    });

    return yPosition - 70; // Espace pour le header principal
  }

  /**
   * Header complet pour la première page
   */
  private async drawCompleteHeader(
    invoice: FacturXInvoice, 
    yPosition: number
  ): Promise<number> {
    const {page} = this.pages[this.currentPageIndex];
    
    // PARTIE GAUCHE - Logo et infos émetteur complètes
    await this.drawBase64Image(
      page, 
      SELLER_LOGO_BASE64, 
      this.MARGIN, 
      yPosition, 
      this.LOGO_WIDTH, 
      this.LOGO_HEIGHT
    );

    let leftTextY = yPosition - 10;
    const sellerStartX = this.MARGIN + this.LOGO_WIDTH + this.TEXT_OFFSET_X;
    
    // Nom de l'entreprise
    page.drawText(invoice.seller?.name || 'Ma Société SARL', {
      x: sellerStartX,
      y: leftTextY,
      size: 14,
      font: this.fontBold,
      color: this.COLORS.dark
    });

    // Toutes les informations complètes de l'émetteur
    const sellerInfo = [
      `${invoice.seller?.postalAddress?.line1 || '123 Rue de la Test'}`,
      `${invoice.seller?.postalAddress?.postalCode || '75001'} ${invoice.seller?.postalAddress?.city || 'Paris'}`,
      invoice.seller?.postalAddress?.countryCode || 'FR',
      `TVA: ${(invoice.seller as any)?.vatNumber || 'FR12345678901'}`,
      `Contact: ${(invoice.seller as any)?.contactName || 'Service Facturation'}`,
      `Email: ${(invoice.seller as any)?.contactEmail || 'facturation@societe.com'}`,
      `Tél: ${(invoice.seller as any)?.contactPhone || '+33 1 23 45 67 89'}`
    ];

    sellerInfo.forEach((line, i) => {
      if (line.trim() && !line.includes('undefined')) {
        leftTextY -= 12;
        page.drawText(line, {
          x: sellerStartX,
          y: leftTextY,
          size: 9,
          font: this.fontRegular,
          color: this.COLORS.gray
        });
      }
    });

    // PARTIE DROITE - Titre "FACTURE" aligné sur la bordure droite
    const factureText = 'FACTURE';
    const factureSize = 36;
    const factureWidth = this.fontBold.widthOfTextAtSize(factureText, factureSize);
    // Aligné sur la bordure droite (angle droit du texte sur la bordure)
    const factureX = this.A4_WIDTH - this.MARGIN - factureWidth;
    // Aligné verticalement avec le logo de l'émetteur (même Y que le logo)
    const factureY = yPosition - 10; // MÊME HAUTEUR que le logo de l'émetteur
    
    page.drawText(factureText, {
      x: factureX,
      y: factureY,
      size: factureSize,
      font: this.fontBold,
      color: this.COLORS.pink
    });

    // Détails du destinataire APRÈS le titre "FACTURE" (plus bas)
    const buyerDetails = [
      `Client: ${invoice.buyer?.name || 'Test SAS'}`,
      `Contact: ${(invoice.buyer as any)?.contactName || 'Service Achat'}`,
      `Email: ${(invoice.buyer as any)?.contactEmail || 'achat@client.com'}`,
      `Tél: ${(invoice.buyer as any)?.contactPhone || '+33 4 56 78 90 12'}`,
      `N° Facture: ${invoice.header?.invoiceNumber || 'FACT-2025-001'}`,
      `Émis le: ${invoice.header?.invoiceDate?.toLocaleDateString('fr-FR') || '28/07/2025'}`,
      `Total à payer: ${this.calculateTotal(invoice).toFixed(2)}€`,
      `Échéance: ${invoice.payment?.dueDate?.toLocaleDateString('fr-FR') || '27/08/2025'}`
    ];

    // Commencer PLUS PRÈS du titre FACTURE (factureY - 25 au lieu de -50)
    let detailY = factureY - 25;
    buyerDetails.forEach(detail => {
      if (!detail.includes('undefined')) {
        const detailWidth = this.fontRegular.widthOfTextAtSize(detail, 9);
        page.drawText(detail, {
          x: this.A4_WIDTH - this.MARGIN - detailWidth,
          y: detailY,
          size: 9,
          font: this.fontRegular,
          color: this.COLORS.gray
        });
        detailY -= 12;
      }
    });

    // Calculer la hauteur totale utilisée pour retourner la bonne position
    const sellerInfoHeight = sellerInfo.filter(line => line.trim() && !line.includes('undefined')).length * 12 + 20;
    const buyerDetailsHeight = buyerDetails.filter(detail => !detail.includes('undefined')).length * 12 + 25; // Réduit de 50 à 25
    const totalHeight = Math.max(sellerInfoHeight, buyerDetailsHeight);

    return yPosition - totalHeight;
  }

  /**
   * Header simplifié pour les pages suivantes
   */
  private async drawSimpleHeader(
    invoice: FacturXInvoice, 
    yPosition: number
  ): Promise<number> {
    const {page} = this.pages[this.currentPageIndex];
    
    // PARTIE GAUCHE - Logo et nom seulement
    await this.drawBase64Image(
      page, 
      SELLER_LOGO_BASE64, 
      this.MARGIN, 
      yPosition, 
      this.LOGO_WIDTH, 
      this.LOGO_HEIGHT
    );

    const sellerStartX = this.MARGIN + this.LOGO_WIDTH + this.TEXT_OFFSET_X;
    page.drawText(invoice.seller?.name || 'Ma Société SARL', {
      x: sellerStartX,
      y: yPosition - 10,
      size: 14,
      font: this.fontBold,
      color: this.COLORS.dark
    });

    // PARTIE DROITE - Titre "FACTURE" aligné sur la bordure droite  
    const factureText = 'FACTURE';
    const factureSize = 32;
    const factureWidth = this.fontBold.widthOfTextAtSize(factureText, factureSize);
    // Aligné sur la bordure droite (angle droit du texte sur la bordure)
    const factureX = this.A4_WIDTH - this.MARGIN - factureWidth;
    // Aligné verticalement avec le logo de l'émetteur
    const factureY = yPosition - 10; // Même hauteur que le logo de l'émetteur
    
    page.drawText(factureText, {
      x: factureX,
      y: factureY,
      size: factureSize,
      font: this.fontBold,
      color: this.COLORS.pink
    });

    // Infos essentielles DIRECTEMENT en dessous du titre "FACTURE"
    const essentialInfo = [
      `N° ${invoice.header?.invoiceNumber || 'FACT-2025-001'}`,
      `${invoice.header?.invoiceDate?.toLocaleDateString('fr-FR') || '28/07/2025'}`,
      `Total: ${this.calculateTotal(invoice).toFixed(2)}€`,
      `Échéance: ${invoice.payment?.dueDate?.toLocaleDateString('fr-FR') || '27/08/2025'}`
    ];

    // Commencer DIRECTEMENT après le titre FACTURE (15 points d'espacement)
    let infoY = factureY - 15;
    essentialInfo.forEach(info => {
      const infoWidth = this.fontRegular.widthOfTextAtSize(info, 9);
      page.drawText(info, {
        x: this.A4_WIDTH - this.MARGIN - infoWidth,
        y: infoY,
        size: 9,
        font: this.fontRegular,
        color: this.COLORS.gray
      });
      infoY -= 12;
    });

    // Calculer la hauteur basée sur les infos essentielles avec espacement réduit
    const infoHeight = essentialInfo.length * 12 + 15; // 15 pour l'espace après FACTURE
    return yPosition - Math.max(60, infoHeight); // Au minimum 60 pour le logo/nom
  }

  /**
   * Draw billing and shipping sections with background and logos
   */
  private async drawBillingShippingSections(
    invoice: FacturXInvoice
  ): Promise<number> {
    const columnWidth = (this.CONTENT_WIDTH - 28.35) / 2; // 10mm spacing
    let {page, currentY: yPosition} = this.pages.at(-1)!; //
    const fontBold = this.fontBold;
    const fontRegular = this.fontRegular;
    // Background for section titles
    page.drawRectangle({
      x: this.MARGIN,
      y: yPosition - 22.68,
      width: this.CONTENT_WIDTH,
      height: 22.68, // 8mm
      color: this.COLORS.grayLight
    });

    // Section titles
    page.drawText('FACTURÉ À', {
      x: this.MARGIN + 5.67 + this.LOGO_WIDTH + this.TEXT_OFFSET_X,
      y: yPosition - 15,
      size: 11,
      font: fontBold,
      color: this.COLORS.dark
    });

    // "LIVRÉ À" aligné à droite
    const livreAText = 'LIVRÉ À';
    const livreAWidth = fontBold.widthOfTextAtSize(livreAText, 11);
    page.drawText(livreAText, {
      x: this.A4_WIDTH - this.MARGIN - livreAWidth,
      y: yPosition - 15,
      size: 11,
      font: fontBold,
      color: this.COLORS.dark
    });

    yPosition -= 35; // Move down after titles

    // Buyer logo placeholder
    await this.drawBase64Image(
      page, 
      BUYER_LOGO_BASE64, 
      this.MARGIN, 
      yPosition, 
      this.LOGO_WIDTH - 14.17, // -5mm comme dans pdfExport.js
      this.LOGO_HEIGHT - 14.17  // -5mm comme dans pdfExport.js
    );

    // Buyer information (FACTURÉ À)
    const buyerLines = [
      invoice.buyer?.name || 'Client XYZ SARL',
      invoice.buyer?.postalAddress?.line1 || '45 Avenue Ach',
      `${invoice.buyer?.postalAddress?.postalCode || '69002'} ${invoice.buyer?.postalAddress?.city || 'Lyon'} ${invoice.buyer?.postalAddress?.countryCode || 'FR'}`,
    ];

    if (invoice.buyer?.registrationNumber) {
      buyerLines.push(`SIRET : ${invoice.buyer.registrationNumber}`);
    }
    if (invoice.buyer?.vatNumber) {
      buyerLines.push(`TVA : ${invoice.buyer.vatNumber || 'FR98765432100'}`);
    }

    let buyerY = yPosition - 5;
    buyerLines.forEach((line, i) => {
      if (line.trim()) {
        page.drawText(line, {
          x: this.MARGIN + 5.67 + (this.LOGO_WIDTH - 14.17) + this.TEXT_OFFSET_X,
          y: buyerY,
          size: 9,
          font: fontRegular,
          color: this.COLORS.gray
        });
        buyerY -= 12;
      }
    });

    // Shipping information (LIVRÉ À) - alignée à droite
    const shipLines = [...buyerLines];
    let shipY = yPosition - 5;
    shipLines.forEach((line, i) => {
      if (line.trim()) {
        const lineWidth = fontRegular.widthOfTextAtSize(line, 9);
        page.drawText(line, {
          x: this.A4_WIDTH - this.MARGIN - lineWidth,
          y: shipY,
          size: 9,
          font: fontRegular,
          color: this.COLORS.gray
        });
        shipY -= 12;
      }
    });

    return yPosition - Math.max(buyerLines.length, shipLines.length) * 12 - 20; // Move down
  }

  /**
   * Draw summary section with QR code and VAT details
   */
  private async drawSummaryWithQRCode(
    invoice: FacturXInvoice
  ): Promise<number> {
    const { page } = this.pages[this.currentPageIndex];
    let { currentY: yPosition } = this.pages[this.currentPageIndex];
    
    const fontBold = this.fontBold;
    const fontRegular = this.fontRegular;
    
    // Calculer les détails de TVA
    const vatDetails = this.calculateVATDetails(invoice);
    
    // Calculer l'espace nécessaire pour les conditions de paiement et footer
    const paymentConditionsHeight = 120; // Espace pour les conditions de paiement
    const footerHeight = 80; // Espace pour le footer
    const minSpaceFromBottom = paymentConditionsHeight + footerHeight;
    
    // Calculer la hauteur optimale du cadre de synthèse
    const vatDetailsHeight = vatDetails.length > 0 ? vatDetails.length * 15 + 30 : 0; // Réduit de 20 à 15
    const baseSectionHeight = 100; // Réduit de 130 à 100
    const sectionHeight = baseSectionHeight + vatDetailsHeight;
    
    // Vérifier si on a assez d'espace sur la page courante
    const requiredSpace = sectionHeight + minSpaceFromBottom;
    if (yPosition - requiredSpace < this.MARGIN + 60) {
      // Pas assez d'espace, créer une nouvelle page
      this.createNewPage();
      await this.drawPageHeader(invoice);
      yPosition = this.pages[this.currentPageIndex].currentY;
      yPosition -= 30; // Espace après header sur nouvelle page
      this.updateCurrentPageY(yPosition);
    }
    
    const qrSize = 113.39; // 40mm
    const gap = 28.35; // 10mm
    const summaryWidth = this.A4_WIDTH - this.MARGIN * 2 - qrSize - gap;
    const summaryX = this.MARGIN + qrSize + gap;

    // QR code placeholder
    page.drawRectangle({
      x: this.MARGIN,
      y: yPosition - qrSize,
      width: qrSize,
      height: qrSize,
      color: rgb(0.9, 0.9, 0.9), // Light gray placeholder
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1
    });

    // QR Code label
    let qrLabelText = 'QR Code facture';
    let qrLabelWidth = fontRegular.widthOfTextAtSize(qrLabelText, 7);
    page.drawText(qrLabelText, {
      x: this.MARGIN + (qrSize - qrLabelWidth) / 2,
      y: yPosition - qrSize - 15,
      size: 7,
      font: fontRegular,
      color: this.COLORS.gray
    });

    // Summary box avec hauteur ajustée
    page.drawRectangle({
      x: summaryX,
      y: yPosition - sectionHeight,
      width: summaryWidth,
      height: sectionHeight,
      color: this.COLORS.grayLight,
      borderColor: this.COLORS.pink,
      borderWidth: 0.5
    });

    // Summary content
    const innerPadding = 11.34; // 4mm
    let summaryY = yPosition - 20;

    const subtotal = this.calculateSubtotal(invoice);
    const vatAmount = this.calculateVAT(invoice);
    const total = this.calculateTotal(invoice);

    // Sous-total HT
    page.drawText('Sous-total HT :', {
      x: summaryX + innerPadding,
      y: summaryY,
      size: 9,
      font: fontBold,
      color: rgb(17/255, 24/255, 39/255)
    });

    let subtotalText = this.formatCurrency(subtotal);
    let subtotalWidth = fontRegular.widthOfTextAtSize(subtotalText, 9);
    page.drawText(subtotalText, {
      x: summaryX + summaryWidth - innerPadding - subtotalWidth,
      y: summaryY,
      size: 9,
      font: fontRegular,
      color: this.COLORS.dark
    });

    summaryY -= 20; // Réduit de 25 à 20

    // Détail de la TVA section
    if (vatDetails.length > 0) {
      // Titre "Détail de la TVA :" à gauche
      page.drawText('Détail de la TVA :', {
        x: summaryX + innerPadding,
        y: summaryY,
        size: 9,
        font: fontBold,
        color: rgb(17/255, 24/255, 39/255)
      });

      // Box pour le détail de la TVA à droite du titre
      const vatBoxWidth = summaryWidth - innerPadding - 120; // 120 points pour le titre à gauche
      const vatBoxHeight = vatDetails.length * 15 + 20; // Réduit la hauteur
      const vatBoxX = summaryX + innerPadding + 120; // À droite du titre
      
      page.drawRectangle({
        x: vatBoxX,
        y: summaryY - vatBoxHeight + 8, // Ajusté pour alignement avec le titre
        width: vatBoxWidth,
        height: vatBoxHeight,
        color: this.COLORS.pinkLight,
        borderWidth: 0 // Suppression de la bordure
      });

      // En-têtes du tableau TVA
      const vatHeaderY = summaryY - 3; // Aligné avec le titre
      const colWidth = vatBoxWidth / 3;
      
      page.drawText('Taux TVA', {
        x: vatBoxX + 5,
        y: vatHeaderY,
        size: 8,
        font: fontBold,
        color: this.COLORS.dark
      });

      page.drawText('Base HT', {
        x: vatBoxX + colWidth + 5,
        y: vatHeaderY,
        size: 8,
        font: fontBold,
        color: this.COLORS.dark
      });

      page.drawText('Montant TVA', {
        x: vatBoxX + (colWidth * 2) + 5,
        y: vatHeaderY,
        size: 8,
        font: fontBold,
        color: this.COLORS.dark
      });

      // Lignes de détail TVA
      let vatRowY = vatHeaderY - 12; // Réduit de 15 à 12
      vatDetails.forEach((detail: VATDetail) => {
        // Taux TVA
        page.drawText(`${(detail.rate * 100).toFixed(0)}%`, {
          x: vatBoxX + 5,
          y: vatRowY,
          size: 8,
          font: fontRegular,
          color: this.COLORS.dark
        });

        // Base HT (alignée à droite dans sa colonne)
        const baseText = this.formatCurrency(detail.base);
        const baseWidth = fontRegular.widthOfTextAtSize(baseText, 8);
        page.drawText(baseText, {
          x: vatBoxX + colWidth - baseWidth - 5,
          y: vatRowY,
          size: 8,
          font: fontRegular,
          color: this.COLORS.dark
        });

        // Montant TVA (aligné à droite dans sa colonne)
        const amountText = this.formatCurrency(detail.amount);
        const amountWidth = fontRegular.widthOfTextAtSize(amountText, 8);
        page.drawText(amountText, {
          x: vatBoxX + (colWidth * 2) - amountWidth - 5,
          y: vatRowY,
          size: 8,
          font: fontRegular,
          color: this.COLORS.dark
        });

        vatRowY -= 12; // Réduit de 15 à 12
      });

      summaryY -= Math.max(vatBoxHeight - 8, 12); // Ajuster la position Y
    }

    // TVA totale
    summaryY -= 5; // Petit espace supplémentaire
    page.drawText('TVA :', {
      x: summaryX + innerPadding,
      y: summaryY,
      size: 9,
      font: fontBold,
      color: rgb(17/255, 24/255, 39/255)
    });

    let vatText = this.formatCurrency(vatAmount);
    let vatTextWidth = fontRegular.widthOfTextAtSize(vatText, 9);
    page.drawText(vatText, {
      x: summaryX + summaryWidth - innerPadding - vatTextWidth,
      y: summaryY,
      size: 9,
      font: fontRegular,
      color: this.COLORS.dark
    });

    // Separator line
    summaryY -= 12; // Réduit de 15 à 12
    page.drawLine({
      start: { x: summaryX + innerPadding, y: summaryY },
      end: { x: summaryX + summaryWidth - innerPadding, y: summaryY },
      thickness: 1,
      color: this.COLORS.pink
    });

    // Total
    summaryY -= 15; // Réduit de 20 à 15
    page.drawText('Total TTC :', {
      x: summaryX + innerPadding,
      y: summaryY,
      size: 9,
      font: fontBold,
      color: rgb(190/255, 24/255, 93/255) // pink-700
    });

    let totalText = this.formatCurrency(total);
    let totalTextWidth = fontBold.widthOfTextAtSize(totalText, 11);
    page.drawText(totalText, {
      x: summaryX + summaryWidth - innerPadding - totalTextWidth,
      y: summaryY,
      size: 11,
      font: fontBold,
      color: rgb(190/255, 24/255, 93/255)
    });

    return yPosition - sectionHeight - 28.35; // Additional spacing
  }

  /**
   * Met à jour la position Y de la page courante
   */
  private updateCurrentPageY(newY: number): void {
    if (this.pages.length > 0) {
      this.pages[this.currentPageIndex].currentY = newY;
    }
  }

  /**
   * Vérifie si il faut créer une nouvelle page
   */
  private needsNewPage(requiredHeight: number): boolean {
    const { currentY } = this.pages[this.currentPageIndex];
    return currentY - requiredHeight < this.MARGIN + 60; // 60 points d'espace pour le footer
  }

  /**
   * Dessine le contenu de la première page avec en-tête uniforme
   */
  private async drawFirstPageContent(invoice: FacturXInvoice): Promise<void> {
    // 1. En-tête de page (numéro de document + QR code) - MAINTENANT sur toutes les pages
    let yPosition = this.pages[this.currentPageIndex].currentY;
    yPosition = await this.drawPageHeaderTop(invoice, yPosition);
    this.updateCurrentPageY(yPosition);

    // 2. Header complet pour la première page
    yPosition = await this.drawCompleteHeader(invoice, yPosition);
    this.updateCurrentPageY(yPosition);

    // 3. Ajouter de l'espace avant les sections de facturation et livraison
    yPosition -= 30; // Espace supplémentaire pour éviter le conflit avec les détails du destinataire
    this.updateCurrentPageY(yPosition);

    // 4. Sections de facturation et livraison
    yPosition = await this.drawBillingShippingSections(invoice);
    this.updateCurrentPageY(yPosition);

    // 5. Espace après l'en-tête (header) avant la table
    yPosition -= 30; // Espace après l'en-tête
    this.updateCurrentPageY(yPosition);
  }

  /**
   * Dessine uniquement le tableau des items
   */
  private async drawItemsTable(invoice: FacturXInvoice): Promise<void> {
    const { page } = this.pages[this.currentPageIndex];
    let { currentY: yPosition } = this.pages[this.currentPageIndex];

    // Dessiner l'en-tête du tableau
    yPosition = await this.drawTableHeader(yPosition);
    this.updateCurrentPageY(yPosition);

    // Dessiner chaque ligne
    for (let index = 0; index < invoice.lines.length; index++) {
      const item = invoice.lines[index];
      const rowHeight = 28.35;

      // Vérifier s'il faut une nouvelle page
      if (this.needsNewPage(rowHeight)) {
        this.createNewPage();
        // Dessiner header sur nouvelle page
        yPosition = await this.drawPageHeader(invoice);
        // Redessiner l'en-tête du tableau
        yPosition = await this.drawTableHeader(yPosition);
        this.updateCurrentPageY(yPosition);
      }

      yPosition = await this.drawTableRow(item, index, yPosition);
      this.updateCurrentPageY(yPosition);
    }
  }

  /**
   * Dessine la synthèse sur la dernière page avec toutes les informations de paiement
   * S'assure que tout s'affiche sur la même page
   */
  private async drawSummaryOnLastPage(invoice: FacturXInvoice): Promise<void> {
    let { currentY: yPosition } = this.pages[this.currentPageIndex];
    
    // Calculer l'espace total nécessaire pour synthèse + conditions + paiement
    const summaryHeight = 200; // Synthèse avec QR code et détails TVA
    const paymentConditionsHeight = 120; // Conditions de paiement
    const totalRequiredHeight = summaryHeight + paymentConditionsHeight + 60; // +60 pour espacement
    
    // Vérifier s'il faut une nouvelle page pour tout afficher ensemble
    if (this.needsNewPage(totalRequiredHeight)) {
      this.createNewPage();
      yPosition = await this.drawPageHeader(invoice);
      yPosition -= 30; // Espace après header sur nouvelle page
      this.updateCurrentPageY(yPosition);
    } else {
      // Ajouter de l'espace entre les items et la synthèse
      yPosition -= 40;
      this.updateCurrentPageY(yPosition);
    }

    // Dessiner la synthèse avec QR code
    yPosition = await this.drawSummaryWithQRCode(invoice);
    this.updateCurrentPageY(yPosition);

    // Ajouter les conditions de vente et moyens de paiement
    yPosition = await this.drawPaymentTermsAndConditions(invoice, yPosition);
    this.updateCurrentPageY(yPosition);
  }

  /**
   * Dessine le tableau des items et la synthèse
   */
  private async drawItemsAndSummary(invoice: FacturXInvoice): Promise<void> {
    const { page } = this.pages[this.currentPageIndex];
    let { currentY: yPosition } = this.pages[this.currentPageIndex];

    // Dessiner l'en-tête du tableau
    yPosition = await this.drawTableHeader(yPosition);
    this.updateCurrentPageY(yPosition);

    // Dessiner chaque ligne
    for (let index = 0; index < invoice.lines.length; index++) {
      const item = invoice.lines[index];
      const rowHeight = 28.35;

      // Vérifier s'il faut une nouvelle page
      if (this.needsNewPage(rowHeight)) {
        this.createNewPage();
        // Dessiner header sur nouvelle page
        yPosition = await this.drawPageHeader(invoice);
        // Redessiner l'en-tête du tableau
        yPosition = await this.drawTableHeader(yPosition);
        this.updateCurrentPageY(yPosition);
      }

      yPosition = await this.drawTableRow(item, index, yPosition);
      this.updateCurrentPageY(yPosition);
    }

    // Ajouter de l'espace entre les items et la synthèse
    yPosition -= 40;
    this.updateCurrentPageY(yPosition);

    // Dessiner la synthèse
    yPosition = await this.drawSummaryWithQRCode(invoice);
    this.updateCurrentPageY(yPosition);

    // Ajouter les conditions de vente et moyens de paiement
    yPosition = await this.drawPaymentTermsAndConditions(invoice, yPosition);
    this.updateCurrentPageY(yPosition);
  }

  /**
   * Ajoute les pieds de page à toutes les pages
   */
  private addFootersToAllPages(invoice: FacturXInvoice): void {
    this.pages.forEach((pageInfo, index) => {
      this.addFooterToPage(pageInfo.page, invoice, index + 1);
    });
  }

  /**
   * Ajoute les numéros de page
   */
  private addPageNumbers(): void {
    const totalPages = this.pages.length;
    this.pages.forEach((pageInfo, index) => {
      const pageNumber = index + 1;
      const text = `Page ${pageNumber} sur ${totalPages}`;
      pageInfo.page.drawText(text, {
        x: this.A4_WIDTH - this.MARGIN - this.fontRegular.widthOfTextAtSize(text, 8),
        y: this.MARGIN - 10,
        size: 8,
        font: this.fontRegular,
        color: this.COLORS.gray
      });
    });
  }

  /**
   * Dessine l'en-tête du tableau avec un design moderne et colonnes équilibrées
   */
  private async drawTableHeader(yPosition: number): Promise<number> {
    const { page } = this.pages[this.currentPageIndex];
    
    // Colonnes du tableau avec largeurs parfaitement équilibrées pour A4
    // Total disponible: 510 points (A4_WIDTH - 2*MARGIN)
    const TABLE_COLS = {
      number: { x: this.MARGIN, width: 25 },                    // 25
      description: { x: this.MARGIN + 25, width: 200 },        // 200  
      quantity: { x: this.MARGIN + 225, width: 45 },           // 45
      unit: { x: this.MARGIN + 270, width: 45 },               // 45
      unitPrice: { x: this.MARGIN + 315, width: 65 },          // 65
      vat: { x: this.MARGIN + 380, width: 45 },                // 45
      total: { x: this.MARGIN + 425, width: 85 }               // 85 = TOTAL: 510
    };

    const headerHeight = 35;

    // Dégradé de fond moderne pour l'en-tête
    page.drawRectangle({
      x: this.MARGIN,
      y: yPosition - headerHeight,
      width: this.CONTENT_WIDTH,
      height: headerHeight,
      color: this.COLORS.pink
    });

    // Bordure supérieure plus claire pour l'effet moderne
    page.drawRectangle({
      x: this.MARGIN,
      y: yPosition - 6,
      width: this.CONTENT_WIDTH,
      height: 6,
      color: rgb(0.95, 0.7, 0.85) // Rose plus clair
    });

    // Séparateurs verticaux subtils entre colonnes
    const separatorColor = rgb(1, 1, 1);
    const separatorPositions = [
      TABLE_COLS.description.x, 
      TABLE_COLS.quantity.x, 
      TABLE_COLS.unit.x, 
      TABLE_COLS.unitPrice.x, 
      TABLE_COLS.vat.x, 
      TABLE_COLS.total.x
    ];

    separatorPositions.forEach(x => {
      page.drawLine({
        start: { x, y: yPosition },
        end: { x, y: yPosition - headerHeight },
        thickness: 0.5,
        color: separatorColor,
        opacity: 0.4
      });
    });

    const headerY = yPosition - 22;
    
    // En-têtes avec texte blanc et typographie moderne
    page.drawText('#', {
      x: TABLE_COLS.number.x + 8,
      y: headerY,
      size: 11,
      font: this.fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('DESCRIPTION', {
      x: TABLE_COLS.description.x + 8,
      y: headerY,
      size: 11,
      font: this.fontBold,
      color: rgb(1, 1, 1)
    });

    // Autres en-têtes centrés avec couleur blanche
    this.drawCenteredHeaderText(page, 'QTÉ', TABLE_COLS.quantity, headerY, rgb(1, 1, 1));
    this.drawCenteredHeaderText(page, 'UNITÉ', TABLE_COLS.unit, headerY, rgb(1, 1, 1));
    this.drawCenteredHeaderText(page, 'PRIX U.', TABLE_COLS.unitPrice, headerY, rgb(1, 1, 1));
    this.drawCenteredHeaderText(page, 'TVA%', TABLE_COLS.vat, headerY, rgb(1, 1, 1));
    this.drawRightAlignedHeaderText(page, 'TOTAL €', TABLE_COLS.total, headerY, rgb(1, 1, 1));

    return yPosition - headerHeight;
  }

  /**
   * Dessine une ligne du tableau avec description multi-lignes
   */
  private async drawTableRow(item: any, index: number, yPosition: number): Promise<number> {
    const { page } = this.pages[this.currentPageIndex];
    const baseRowHeight = 30;

    // Mêmes colonnes que dans drawTableHeader - EXACTEMENT LES MÊMES
    const TABLE_COLS = {
      number: { x: this.MARGIN, width: 25 },                    
      description: { x: this.MARGIN + 25, width: 200 },        
      quantity: { x: this.MARGIN + 225, width: 45 },           
      unit: { x: this.MARGIN + 270, width: 45 },               
      unitPrice: { x: this.MARGIN + 315, width: 65 },          
      vat: { x: this.MARGIN + 380, width: 45 },                
      total: { x: this.MARGIN + 425, width: 85 }               
    };

    // Diviser la description en lignes en utilisant la largeur complète de la colonne
    const description = item.description || '';
    const descriptionColumnWidth = TABLE_COLS.description.width - 12; // -12 pour les marges
    const descriptionLines = this.wrapText(description, descriptionColumnWidth);
    const actualRowHeight = Math.max(baseRowHeight, descriptionLines.length * 12 + 8);

    // Alternating row colors
    if (index % 2 === 1) {
      page.drawRectangle({
        x: this.MARGIN,
        y: yPosition - actualRowHeight,
        width: this.CONTENT_WIDTH,
        height: actualRowHeight,
        color: this.COLORS.grayLight
      });
    }

    const itemY = yPosition - 15;

    // Numéro de ligne
    page.drawText((index + 1).toString(), {
      x: TABLE_COLS.number.x + 6,
      y: itemY,
      size: 9,
      font: this.fontRegular,
      color: this.COLORS.dark
    });

    // Description multi-lignes
    descriptionLines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: TABLE_COLS.description.x + 6,
        y: itemY - (lineIndex * 12),
        size: 9,
        font: this.fontRegular,
        color: this.COLORS.dark
      });
    });

    // Centrer verticalement les autres colonnes par rapport à la description
    const centerY = itemY - ((descriptionLines.length - 1) * 12) / 2;

    // Autres colonnes centrées/alignées à droite
    this.drawCenteredCellText(page, item.quantity?.toString() || '1', TABLE_COLS.quantity, centerY);
    this.drawCenteredCellText(page, 'unit', TABLE_COLS.unit, centerY);
    this.drawRightAlignedCellText(page, (item.unitPrice || 0).toFixed(2), TABLE_COLS.unitPrice, centerY);
    this.drawCenteredCellText(page, `${((item.vatRate || 0) * 100).toFixed(0)}`, TABLE_COLS.vat, centerY);
    
    const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
    this.drawRightAlignedCellText(page, lineTotal.toFixed(2), TABLE_COLS.total, centerY, this.fontBold);

    return yPosition - actualRowHeight;
  }

  /**
   * Divise un texte en lignes selon une largeur maximale en utilisant la largeur de colonne complète
   */
  private wrapText(text: string, maxWidth: number): string[] {
    if (!text) return [''];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.fontRegular.widthOfTextAtSize(testLine, 9);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Mot trop long, le couper pour tenir dans la largeur
          let remainingWord = word;
          while (remainingWord.length > 0) {
            let cutIndex = remainingWord.length;
            while (cutIndex > 0) {
              const testPart = remainingWord.substring(0, cutIndex) + (cutIndex < remainingWord.length ? '...' : '');
              const partWidth = this.fontRegular.widthOfTextAtSize(testPart, 9);
              if (partWidth <= maxWidth) {
                lines.push(testPart);
                remainingWord = remainingWord.substring(cutIndex);
                break;
              }
              cutIndex--;
            }
            if (cutIndex === 0) break; // Sécurité
          }
          currentLine = '';
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Dessine les conditions de paiement et de vente
   */
  private async drawPaymentTermsAndConditions(invoice: FacturXInvoice, yPosition: number): Promise<number> {
    const { page } = this.pages[this.currentPageIndex];
    
    yPosition -= 30; // Espace avant les conditions

    // Titres des conditions en français et anglais
    page.drawText('CONDITIONS DE PAIEMENT ET DE VENTE', {
      x: this.MARGIN,
      y: yPosition,
      size: 11,
      font: this.fontBold,
      color: this.COLORS.pink
    });

    // Titre en anglais aligné à droite
    const paymentInfoText = 'PAYMENT INFORMATION';
    const paymentInfoWidth = this.fontBold.widthOfTextAtSize(paymentInfoText, 11);
    page.drawText(paymentInfoText, {
      x: this.A4_WIDTH - this.MARGIN - paymentInfoWidth,
      y: yPosition,
      size: 11,
      font: this.fontBold,
      color: this.COLORS.pink
    });

    yPosition -= 20;

    // Conditions de paiement à gauche
    const conditions = [
      'Paiement à 30 jours fin de mois.',
      'En cas de retard de paiement, des pénalités seront appliquées.',
      'Aucun escompte pour paiement anticipé.',
      'Réclamations à adresser dans les 8 jours.',
    ];

    let conditionsY = yPosition;
    conditions.forEach(condition => {
      page.drawText(`• ${condition}`, {
        x: this.MARGIN,
        y: conditionsY,
        size: 9,
        font: this.fontRegular,
        color: this.COLORS.gray
      });
      conditionsY -= 15;
    });

    // Informations de paiement à droite
    const paymentDetails = [
      `IBAN : ${invoice.payment?.payeeIBAN || 'FR76 1234 5678 9012 3456 7890 123'}`,
      `BIC : ${invoice.payment?.payeeBIC || 'AGRIFRPP'}`,
      `Reference: ${invoice.header?.invoiceNumber || 'FAC-2025-001'}`,
      `Due date: ${invoice.payment?.dueDate?.toLocaleDateString('en-US') || '8/27/2025'}`
    ];

    let paymentY = yPosition;
    paymentDetails.forEach(detail => {
      const detailWidth = this.fontRegular.widthOfTextAtSize(detail, 9);
      page.drawText(detail, {
        x: this.A4_WIDTH - this.MARGIN - detailWidth,
        y: paymentY,
        size: 9,
        font: this.fontRegular,
        color: this.COLORS.gray
      });
      paymentY -= 15;
    });

    // Retourner la position la plus basse entre les deux colonnes
    const finalY = Math.min(conditionsY, paymentY);
    return finalY;
  }

  /**
   * Méthodes utilitaires pour l'alignement du texte dans les tableaux
   */
  private drawCenteredHeaderText(page: PDFPage, text: string, column: any, y: number, color = this.COLORS.gray): void {
    const textWidth = this.fontBold.widthOfTextAtSize(text, 10);
    page.drawText(text, {
      x: column.x + (column.width - textWidth) / 2,
      y: y,
      size: 10,
      font: this.fontBold,
      color: color
    });
  }

  private drawRightAlignedHeaderText(page: PDFPage, text: string, column: any, y: number, color = this.COLORS.gray): void {
    const textWidth = this.fontBold.widthOfTextAtSize(text, 10);
    page.drawText(text, {
      x: column.x + column.width - textWidth - 5,
      y: y,
      size: 10,
      font: this.fontBold,
      color: color
    });
  }

  private drawCenteredCellText(page: PDFPage, text: string, column: any, y: number): void {
    const textWidth = this.fontRegular.widthOfTextAtSize(text, 8);
    page.drawText(text, {
      x: column.x + (column.width - textWidth) / 2,
      y: y,
      size: 8,
      font: this.fontRegular,
      color: this.COLORS.dark
    });
  }

  private drawRightAlignedCellText(page: PDFPage, text: string, column: any, y: number, font = this.fontRegular): void {
    const textWidth = font.widthOfTextAtSize(text, 8);
    page.drawText(text, {
      x: column.x + column.width - textWidth - 5,
      y: y,
      size: 8,
      font: font,
      color: this.COLORS.dark
    });
  }

  /**
   * Ajoute un pied de page à une page spécifique
   */
  private addFooterToPage(page: PDFPage, invoice: FacturXInvoice, pageNumber: number): void {
    const footerY = 40;
    
    const line1 = `${invoice.seller?.name || 'Mon Entreprise SAS'} - SIRET: ${invoice.seller?.registrationNumber || ''} - TVA: ${invoice.seller?.vatNumber || 'FR12345678901'}`;
    const line2 = `${invoice.seller?.postalAddress?.line1 || '1 Boulevard de la République'}, ${invoice.seller?.postalAddress?.postalCode || '75010'} ${invoice.seller?.postalAddress?.city || 'Paris'}`;

    // Centered text
    let line1Width = this.fontRegular.widthOfTextAtSize(line1, 8);
    let line2Width = this.fontRegular.widthOfTextAtSize(line2, 8);

    page.drawText(line1, {
      x: (this.A4_WIDTH - line1Width) / 2,
      y: footerY + 15,
      size: 8,
      font: this.fontRegular,
      color: this.COLORS.gray
    });

    page.drawText(line2, {
      x: (this.A4_WIDTH - line2Width) / 2,
      y: footerY,
      size: 8,
      font: this.fontRegular,
      color: this.COLORS.gray
    });

    // Code de facture à gauche dans le pied de page
    const invoiceNumber = invoice.header?.invoiceNumber || 'FACT-2025-001';
    const dateStr = new Date().toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '.');
    const dateIdentifier = `${dateStr}.${invoiceNumber}`;
    
    page.drawText(dateIdentifier, {
      x: this.MARGIN,
      y: footerY,
      size: 8,
      font: this.fontRegular,
      color: this.COLORS.gray
    });
  }

  // Helper methods
  private calculateSubtotal(invoice: FacturXInvoice): number {
    return invoice.lines.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
  }

  private calculateVAT(invoice: FacturXInvoice): number {
    return invoice.lines.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * item.vatRate), 0);
  }

  private calculateTotal(invoice: FacturXInvoice): number {
    return this.calculateSubtotal(invoice) + this.calculateVAT(invoice);
  }

  /**
   * Calculate VAT details grouped by rate
   */
  private calculateVATDetails(invoice: FacturXInvoice): VATDetail[] {
    const vatMap = new Map<number, { base: number; amount: number }>();

    invoice.lines.forEach((item: any) => {
      const rate = item.vatRate || 0;
      const base = item.quantity * item.unitPrice;
      const amount = base * rate;

      if (vatMap.has(rate)) {
        const existing = vatMap.get(rate)!;
        existing.base += base;
        existing.amount += amount;
      } else {
        vatMap.set(rate, { base, amount });
      }
    });

    return Array.from(vatMap.entries())
      .map(([rate, { base, amount }]) => ({ rate, base, amount }))
      .sort((a, b) => a.rate - b.rate); // Sort by rate ascending
  }

  private formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} €`;
  }

  /**
   * Génère un pattern simple de QR code pour la démonstration
   */
  private generateSimpleQRPattern(): number[][] {
    return [
      [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,1,1,0,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
      [1,0,1,1,0,1,1,1,0,1,1,0,1,0,1,1,0]
    ];
  }
}