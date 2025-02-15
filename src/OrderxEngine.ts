// src/OrderxEngine.ts
import { PDFDocument } from 'pdf-lib';
import { BaseOrderTemplate } from './templates/BaseOrderTemplate';
import { OrderxXmlBuilder } from './OrderxXmlBuilder';
import { OrderData } from './models/OrderData';
import { BaseOrderItem } from './models/BaseOrderItem';
import { OrderxProfiles } from './core/OrderxProfiles';

export class OrderxEngine<T extends BaseOrderItem> {
  constructor(
    private template: BaseOrderTemplate<T>,
    private profile: OrderxProfiles
  ) {}

  /** Génère le PDF + XML Order-X (PDF/A-3). */
  public async generate(orderData: OrderData<T>): Promise<Uint8Array> {
    // 1. PDF visuel
    const pdfBytes = await this.template.render(orderData);

    // 2. XML
    const xmlBuilder = new OrderxXmlBuilder<T>(orderData, this.profile);
    const xmlBuffer = xmlBuilder.buildXml();

    // 3. Charger le PDF -> attacher le XML
    const pdfDoc = await PDFDocument.load(pdfBytes);
    await pdfDoc.attach(xmlBuffer, 'orderx.xml', {
      mimeType: 'application/xml',
      description: 'Order-X XML file',
      creationDate: new Date(),
      modificationDate: new Date(),
    });

    // 4. Ajuster métadonnées, PDF/A-3, etc. (mêmes considérations que pour Factur-X)
    pdfDoc.setTitle('Commande Order-X');
    pdfDoc.setSubject('Commande électronique (Order-X)');

    // 5. Sauvegarder
    return await pdfDoc.save();
  }
}
