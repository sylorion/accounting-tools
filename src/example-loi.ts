// example-lots-of-items.ts

import fs from 'fs';
import { PostalAddress } from './core/HeaderTradeAgreement';
import { DocumentHeader } from './core/DocumentHeader';
import { FacturXInvoice } from './core/FacturXInvoice';
import { FacturxProfile } from './core/EnumInvoiceType';
import { PaymentDetails } from './core/PaymentDetails';
import { InvoiceLine } from './core/InvoiceLine';
import { AllowanceCharge } from './core/AllowanceCharge';
// import { FacturXEngine } from './FacturxEngine';
import { InvoicePDF } from './core/pdf'; 
import { PDFOption } from './generators/InvoicePDF';
// src/models/ExtendedTradeParty.ts
import { InvoiceTemplateFancy } from './templates/InvoiceTemplateFancy';
import { InvoiceTemplateBrand } from './templates/InvoiceTemplateBrand';
import { PDFDocument } from 'pdf-lib';

export class ExtendedTradeParty {
  constructor(
    public name: string,
    public postalAddress: PostalAddress,
    public vatNumber?: string,
    // Extensions
    public legalName?: string,
    public contactName?: string,
    public contactEmail?: string,
    public contactPhone?: string
  ) {}
}

(async () => {
  // 1. Construire un vendeur (ExtendedTradeParty) avec email, tel, etc.
  const sellerAddress = new PostalAddress("1 Boulevard de la République", "Paris", "75010", "FR", "Bâtiment A");
  const seller = new ExtendedTradeParty(
    "Mon Entreprise SAS",
    sellerAddress,
    "FR12345678901",            // vatNumber
    "Mon Entreprise Officielle",// legalName
    "Jean Dupont (Service Facturation)",
    "facturation@m-entreprise.com",
    "+33 1 23 45 67 89"
  );

  // 2. Construire un acheteur (ExtendedTradeParty) avec infos contact
  const buyerAddress = new PostalAddress("45 Avenue Ach", "Lyon", "69002", "FR", "Étage 3");
  const buyer = new ExtendedTradeParty(
    "Client XYZ SARL",
    buyerAddress,
    "FR98765432100",          // vatNumber
    "Client XYZ Légal",
    "Marie Client (Achat)",
    "achats@clientxyz.fr",
    "+33 4 56 78 90 12"
  );

  // 3. En-tête
  const header = new DocumentHeader(
    "DOC-2025-FA-1001", // id interne
    "2025-FA-001",      // invoiceNumber
    "FACTURE EXTENDED", // name
    new Date(2025, 3, 10),   // invoiceDate = 10 avril 2025
    new Date(),              // issueDate = maintenant
  );

  // 4. Paiement
  const payment = new PaymentDetails(
    "58",                          // code => 58 = SEPA Credit Transfer 
    "FR7630004000031234567890143", // IBAN
    "BNPAFRPPXXX",                 // BIC
    new Date(2025, 4, 10),         // dueDate => 10 mai 2025
    "Paiement sous 30 jours fin de mois."
  );

  // 5. Création de la facture Factur-X
  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    // On “cast” seller/buyer en TradeParty => ou on modifie FacturXInvoice pour accepter ExtendedTradeParty
    seller as any,
    buyer as any,
    payment
  );

  // 6. Ajout d'une mention: "Logo" en commentaire 
  // (Factur-X ne prévoit pas un champ XML "logo"; c'est géré côté PDF.)
  // On peut le mentionner dans "header.notes" ou en docAllowanceCharge reason.
  invoice.header.notes.push("Logo: /resources/images/mon-entreprise-logo.png");

  // 7. Générer 30 lignes
  for (let i = 1; i <= 65; i++) {
    const desc = `Article #${i} : Description complète de l'article SKU-ABC-${i}.`;
    // Variation du prix et de la TVA
    const price = Math.random() * (10 + i * 2);     //  ex. 10 + i*2 => 12, 14, 16...
    const qty   = Math.round(1 + Math.random() * i);             //  La quantité = i
    const vat   = 0.20;          //  20% 
    invoice.lines.push(new InvoiceLine(
      i.toString(),
      desc,
      qty,
      price,
      vat
    ));
  }

  // 8. Ajout d’un doc-level discount (remise globale) ex. 5%
  // Calculons 5% du lineTotal approx => on le fera a posteriori 
  // Pour la démo, on met 30 EUR fixes 
  invoice.docAllowanceCharges.push(
    new AllowanceCharge(
      false,      // false => remise
      30,         // actualAmount
      "Remise globale", 
      "DIsc5",
      0.20
    )
  );

  // 9. Ajout d’un doc-level charge ex. 25 EUR (frais de dossier)
  invoice.docAllowanceCharges.push(
    new AllowanceCharge(
      true,
      25,
      "Frais de dossier",
      "DOC",
      0.20
    )
  );

  // 10. Générer l'XML
  try {
    const xml = invoice.generateXml();
    fs.writeFileSync("facture-extended-lots-of-items.xml", xml);
    console.log("Facture générée avec succès : facture-extended-lots-of-items.xml");
  } catch (err) {
    console.error("Erreur:", err);
  }

  // 11. Save with PDF metadata
const options: PDFOption = {
  title: 'Invoice 2025-FA-001',
  author: 'Awesome Seller Corp.',
  subject: 'B2B Invoice Document',
  keywords: ['invoice', 'factur-x', 'b2b'],
  creator: 'SMP Accounting',
  producer: '@services/accounting',
  summary: 'This invoice covers services provided during the consultation phase.',
  provider: 'SMP Accounting Services'
};
  // 12. Générer le PDF
  const template = new InvoiceTemplateBrand();
  try {
    const pdfBytes = await template.render(invoice);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    if (options?.title) pdfDoc.setTitle(options.title);
    if (options?.subject) pdfDoc.setSubject(options.subject);
    if (options?.author) pdfDoc.setAuthor(options.author);
    if (options?.keywords) pdfDoc.setKeywords(options.keywords);
    if (options?.creator) pdfDoc.setCreator(options.creator);
    if (options?.producer) pdfDoc.setProducer(options.producer);
    if (options?.summary) pdfDoc.setSubject(options.summary);
    if (options?.provider) pdfDoc.setAuthor(options.provider);
    fs.writeFileSync("facture-extended-lots-of-items.pdf", await pdfDoc.save());
    console.log("PDF généré avec succès : facture-extended-lots-of-items.pdf");
  } catch (err) {
    console.error("Erreur lors de la génération du PDF:", err);
  }
})();
