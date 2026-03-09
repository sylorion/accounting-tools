// Test script pour InvoiceTemplateFancy avec FacturXInvoice
import { InvoiceTemplateFancy } from './src/templates/InvoiceTemplateFancy';
import { FacturXInvoice } from './src/core/FacturXInvoice';
import { FacturxProfile } from './src/core/EnumInvoiceType';
import { DocumentHeader } from './src/core/DocumentHeader';
import { TradeParty, PostalAddress } from './src/core/HeaderTradeAgreement';
import { PaymentDetails } from './src/core/PaymentDetails';
import { InvoiceLine } from './src/core/InvoiceLine';
import fs from 'fs';

// Créer une facture de test avec FacturXInvoice
const createTestFacturXInvoice = (): FacturXInvoice => {
  // 1. Créer l'adresse du vendeur
  const sellerAddress = new PostalAddress(
    "123 Rue de la Test",    // line1
    "Paris",                 // city
    "75001",                 // postalCode
    "FR",                    // countryCode
    ""                       // line2
  );
  
  const seller = new TradeParty(
    "Ma Société SARL",
    sellerAddress,
    "FR12345678901"
  );
  seller.registrationNumber = "12345678901234";

  // 2. Créer l'adresse de l'acheteur
  const buyerAddress = new PostalAddress(
    "456 Avenue du Client",
    "Lyon", 
    "69002",
    "FR",
    ""
  );
  
  const buyer = new TradeParty(
    "Client Test SAS",
    buyerAddress,
    "FR98765432100"
  );
  buyer.registrationNumber = "98765432109876";

  // 3. En-tête de document
  const header = new DocumentHeader(
    "FACT-2025-001",              // id
    "FACT-2025-001",              // invoiceNumber
    "Facture Test Multi-Pages",   // name
    new Date(),                   // invoiceDate
    new Date()                    // issueDate
  );

  // 4. Détails de paiement
  const payment = new PaymentDetails(
    "58",                         // paymentMeansCode (SEPA Credit Transfer)
    "FR7630004000031234567890143", // iban
    "BNPAFRPPXXX",                // bic
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // dueDate (30 jours)
    "Paiement à 30 jours fin de mois."
  );

  // 5. Créer la facture
  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    seller,
    buyer,
    payment
  );

  // 6. Ajouter beaucoup de lignes pour tester les pages multiples
  for (let i = 1; i <= 50; i++) {
    const line = new InvoiceLine(
      `LINE-${i}`,                                                    // id
      `Produit de test numéro ${i} - Description longue avec détails techniques et spécifications détaillées`, // description
      Math.floor(Math.random() * 10) + 1,                           // quantity
      Math.random() * 100 + 10,                                     // unitPrice
      0.20                                                          // vatRate
    );
    invoice.lines.push(line);
  }

  return invoice;
};

// Test de génération
async function testMultiPageGeneration() {
  console.log('🚀 Test de génération PDF multi-pages avec FacturXInvoice...');
  
  try {
    const invoice = createTestFacturXInvoice();
    console.log(`📄 Génération d'une facture avec ${invoice.lines.length} lignes...`);
    
    // Utiliser directement le template fancy
    const template = new InvoiceTemplateFancy();
    
    const pdfBytes = await template.render(invoice);
    
    // Sauvegarder le PDF
    const outputPath = './test-facturx-multipage.pdf';
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ PDF généré avec succès : ${outputPath}`);
    console.log(`📊 Taille du fichier : ${Math.round(pdfBytes.length / 1024)} KB`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testMultiPageGeneration();
}
