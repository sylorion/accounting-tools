// src/FacturxEngine.ts
import { BaseInvoiceItem } from './models/BaseInvoiceItem';
import { InvoiceData } from './models/InvoiceData';
import { BaseInvoiceTemplate } from './templates/BaseInvoiceTemplate';
import { FacturXInvoice } from './core/FacturXInvoice';

import { FacturxProfile } from './core/EnumInvoiceType';
import {
  markAsPdfA3,
} from './core/PDFA3Conformance';

import { PDFDocument } from 'pdf-lib';

export class FacturxEngine<T extends BaseInvoiceItem> {
  constructor(
    private template: BaseInvoiceTemplate<T>,
    private profile: FacturxProfile
  ) {}

  /**
   * Génère le PDF + XML Factur-X et renvoie le PDF final (PDF/A-3).
   */
  public async generate(invoice: FacturXInvoice): Promise<Uint8Array> {
    // 1. Génération du PDF principal (visuel)
    const pdfBytes = await this.template.render(invoice);

    // 2. Construction du XML
    const xmlBuilder = invoice.generateXml(true);
    const xmlBuffer = xmlBuilder.buildXml();

    // 3. Charger le PDF pour y insérer le XML
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 4. Attacher le fichier XML en tant qu'embedded file
    const _ = await pdfDoc.attach(
      xmlBuffer,
      'facturx.xml',
      {
        mimeType: 'application/xml',
        description: 'Factur-X XML file',
        creationDate: new Date(),
        modificationDate: new Date()
      }
    );

    // 5. PDF/A-3 => On doit mettre à jour les métadonnées (PDF/A Conformance)
    //   5.1. pdf-lib ne gère pas nativement l’entièreté de PDF/A-3
    //        Il faut ajouter manuellement l’objet /AF, le schema XMP, etc.
    //   5.2. Pour la démo, on ajoute un tri minimal :
    pdfDoc.setTitle('Facture Factur-X');
    pdfDoc.setSubject('Facture électronique (Factur-X)');

    // Dans un vrai projet, on manipule le catalogue PDF (pdfDoc.context) pour
    // y insérer /AF, /Metadata, /OutputIntents, etc. => Cf. specs PDF/A-3.

    // 6. Sauvegarder le PDF final
    return await pdfDoc.save();
  }
}
