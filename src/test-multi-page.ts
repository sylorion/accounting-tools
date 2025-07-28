import fs from 'fs';
import { PostalAddress } from './core/HeaderTradeAgreement';
import { DocumentHeader } from './core/DocumentHeader';
import { FacturXInvoice } from './core/FacturXInvoice';
import { FacturxProfile } from './core/EnumInvoiceType';
import { PaymentDetails } from './core/PaymentDetails';
import { InvoiceLine } from './core/InvoiceLine';
import { InvoiceTemplateFancy } from './templates/InvoiceTemplateFancy';
import { PDFDocument, utf8Encode } from 'pdf-lib';
import { PDFOption } from './generators/InvoicePDF';

export class ExtendedTradeParty {
  constructor(
    public name: string,
    public postalAddress: PostalAddress,
    public vatNumber?: string,
    public legalName?: string,
    public contactName?: string,
    public contactEmail?: string,
    public contactPhone?: string
  ) {}
}

(async () => {
  // Créer vendeur et acheteur avec informations complètes
  const sellerAddress = new PostalAddress("1 Boulevard de la République", "Paris", "75010", "FR", "Bâtiment A");
  const seller = new ExtendedTradeParty(
    "Mon Entreprise SAS",
    sellerAddress,
    "FR12345678901",
    "Mon Entreprise Officielle",
    "Jean Dupont (Service Facturation)",
    "facturation@m-entreprise.com",
    "+33 1 23 45 67 89"
  );

  const buyerAddress = new PostalAddress("45 Avenue Client", "Lyon", "69002", "FR", "Étage 3");
  const buyer = new ExtendedTradeParty(
    "Client XYZ SARL",
    buyerAddress,
    "FR98765432100",
    "Client XYZ Légal",
    "Marie Client (Achat)",
    "achats@clientxyz.fr",
    "+33 4 56 78 90 12"
  );

  // En-tête et paiement
  const header = new DocumentHeader(
    "DOC-2025-FA-2001",
    "2025-FA-002",
    "FACTURE MULTI-PAGES",
    new Date(2025, 6, 28), // 28 juillet 2025
    new Date(),
  );

  const payment = new PaymentDetails(
    "58",
    "FR7630004000031234567890143",
    "BNPAFRPPXXX",
    new Date(2025, 7, 28), // 28 août 2025
    "Paiement sous 30 jours fin de mois."
  );

  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    seller as any,
    buyer as any,
    payment
  );

  // Générer 50 lignes pour forcer plusieurs pages
  for (let i = 1; i <= 50; i++) {
    const longDesc = `Article #${i} : Description très détaillée de l'article SKU-ABC-${i.toString().padStart(3, '0')}. Ce produit comprend plusieurs caractéristiques techniques importantes et des spécifications détaillées pour une utilisation professionnelle dans le cadre de projets d'entreprise.`;
    
    const price = 25 + (i * 3.5);
    const qty = Math.ceil(Math.random() * 5);
    const vat = 0.20;
    
    invoice.lines.push(new InvoiceLine(
      i.toString(),
      longDesc,
      qty,
      price,
      vat
    ));
  }

  // Options PDF
  const options: PDFOption = {
    title: 'Facture Multi-Pages 2025-FA-002',
    author: 'Mon Entreprise SAS',
    subject: 'Facture électronique multi-pages',
    keywords: ['facture', 'multi-page', 'test'],
    creator: 'Accounting Tools',
    producer: 'InvoiceTemplateFancy'
  };

  // Générer le PDF
  const template = new InvoiceTemplateFancy();
  try {
    const pdfBytes = await template.render(invoice);
    const xmlBuilder = invoice.generateXml(true);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Attacher le XML
    await pdfDoc.attach(
      utf8Encode(xmlBuilder),
      'factur-x.xml',
      {
        mimeType: 'application/xml',
        description: 'Factur-X XML file',
        creationDate: new Date(),
        modificationDate: new Date()
      }
    );

    // Métadonnées
    if (options?.title) pdfDoc.setTitle(options.title);
    if (options?.subject) pdfDoc.setSubject(options.subject);
    if (options?.author) pdfDoc.setAuthor(options.author);
    if (options?.keywords) pdfDoc.setKeywords(options.keywords);
    if (options?.creator) pdfDoc.setCreator(options.creator);
    if (options?.producer) pdfDoc.setProducer(options.producer);

    fs.writeFileSync("test-multi-page-invoice.pdf", await pdfDoc.save());
    console.log("✅ PDF multi-pages généré avec succès : test-multi-page-invoice.pdf");
    console.log(`📄 Nombre de pages: ${pdfDoc.getPageCount()}`);
  } catch (err) {
    console.error("❌ Erreur lors de la génération du PDF:", err);
  }
})();
