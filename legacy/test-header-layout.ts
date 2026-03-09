import fs from 'fs';
import { PostalAddress } from './core/HeaderTradeAgreement';
import { DocumentHeader } from './core/DocumentHeader';
import { FacturXInvoice } from './core/FacturXInvoice';
import { FacturxProfile } from './core/EnumInvoiceType';
import { PaymentDetails } from './core/PaymentDetails';
import { InvoiceLine } from './core/InvoiceLine';
import { InvoiceTemplateFancy } from './templates/InvoiceTemplateFancy';
import { PDFDocument, utf8Encode } from 'pdf-lib';

// Test rapide avec 5 articles pour vérifier le layout du header
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
  const sellerAddress = new PostalAddress("123 Rue du Commerce", "Paris", "75001", "FR");
  const seller = new ExtendedTradeParty(
    "Test Company SARL",
    sellerAddress,
    "FR12345678901",
    "Test Company Legal",
    "John Smith (Billing)",
    "billing@test.com",
    "+33 1 00 00 00 00"
  );

  const buyerAddress = new PostalAddress("456 Avenue Client", "Lyon", "69000", "FR");
  const buyer = new ExtendedTradeParty(
    "Client Test SAS",
    buyerAddress,
    "FR98765432100",
    "Client Test Legal",
    "Jane Doe (Purchase)",
    "purchase@client.com",
    "+33 4 00 00 00 00"
  );

  const header = new DocumentHeader(
    "TEST-2025-001",
    "FACT-2025-001",
    "Test Header Layout",
    new Date(2025, 6, 28), // 28 juillet 2025
    new Date()
  );

  const payment = new PaymentDetails(
    "58",
    "FR7630004000031234567890143",
    "BNPAFRPPXXX",
    new Date(2025, 7, 28),
    "Paiement test."
  );

  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    seller as any,
    buyer as any,
    payment
  );

  // 5 articles seulement pour test rapide
  for (let i = 1; i <= 5; i++) {
    invoice.lines.push(new InvoiceLine(
      i.toString(),
      `Test Article ${i} - Description courte`,
      1,
      100 + i * 10,
      0.20
    ));
  }

  const template = new InvoiceTemplateFancy();
  try {
    const pdfBytes = await template.render(invoice);
    const xmlBuilder = invoice.generateXml(true);
    const pdfDoc = await PDFDocument.load(pdfBytes);

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

    pdfDoc.setTitle('Test Header Layout');
    pdfDoc.setAuthor('Test Company');

    fs.writeFileSync("test-header-layout.pdf", await pdfDoc.save());
    console.log("✅ PDF de test généré avec succès : test-header-layout.pdf");
    console.log("🎯 Layout header testé : QR code + INV.2025.01 vertical + date horizontale");
  } catch (err) {
    console.error("❌ Erreur:", err);
  }
})();
