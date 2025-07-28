// test-modern-design.ts
import { PostalAddress } from './src/core/HeaderTradeAgreement';
import { DocumentHeader } from './src/core/DocumentHeader';
import { FacturXInvoice } from './src/core/FacturXInvoice';
import { FacturxProfile } from './src/core/EnumInvoiceType';
import { PaymentDetails } from './src/core/PaymentDetails';
import { InvoiceLine } from './src/core/InvoiceLine';
import { InvoiceTemplateFancy } from './src/templates/InvoiceTemplateFancy';
import { TradeParty } from './src/core/HeaderTradeAgreement';
import fs from 'fs';

function createTestFacturXInvoice(): FacturXInvoice {
  // Vendeur
  const sellerAddress = new PostalAddress("123 Rue de la Test", "Paris", "75001", "FR");
  const seller = new TradeParty("Ma Société SARL", sellerAddress, "FR12345678901");

  // Acheteur
  const buyerAddress = new PostalAddress("456 Avenue du Client", "Lyon", "69002", "FR");
  const buyer = new TradeParty("Client Test SAS", buyerAddress, "FR98765432100");

  // En-tête de document
  const header = new DocumentHeader(
    "2025-DOC-001",
    "FACT-2025-001", 
    "FACTURE MODERNE",
    new Date(2025, 6, 28), // 28 juillet 2025
    new Date()
  );

  // Paiement
  const payment = new PaymentDetails(
    "58", // SEPA Credit Transfer
    "FR7630004000031234567890143",
    "BNPAFRPPXXX",
    new Date(2025, 7, 27), // 27 août 2025
    "Paiement sous 30 jours"
  );

  // Création de la facture
  const invoice = new FacturXInvoice(FacturxProfile.EXTENDED, header, seller, buyer, payment);

  // Ajout de nombreuses lignes pour tester le multi-page et l'alignement
  const items = [
    { name: "Consultation stratégique IT", price: 850.00, qty: 8 },
    { name: "Développement application web - Phase 1", price: 1200.50, qty: 12 },
    { name: "Formation équipe technique", price: 750.00, qty: 6 },
    { name: "Audit sécurité système", price: 950.25, qty: 4 },
    { name: "Migration données legacy", price: 1580.00, qty: 2 },
    { name: "Maintenance serveur mensuelle", price: 280.75, qty: 24 },
    { name: "Licence logiciel premium (annuelle)", price: 2100.00, qty: 1 },
    { name: "Support technique niveau 3", price: 125.50, qty: 40 },
    { name: "Sauvegarde cloud (1TB)", price: 89.99, qty: 12 },
    { name: "Hébergement web premium", price: 45.00, qty: 36 }
  ];

  // Ajouter plus d'items pour créer 3-4 pages
  for (let i = 0; i < 60; i++) {
    const baseItem = items[i % items.length];
    const variation = Math.random() * 0.2 + 0.9; // Variation de prix ±10%
    
    invoice.lines.push(new InvoiceLine(
      (i + 1).toString(),
      `${baseItem.name} ${i + 1} - Description détaillée du service ou produit incluant les spécifications techniques`,
      baseItem.qty + Math.floor(Math.random() * 3),
      baseItem.price * variation,
      0.20 // 20% TVA
    ));
  }

  return invoice;
}

(async () => {
  console.log('🎨 Test du nouveau design moderne...');
  console.log('📊 Génération d\'une facture avec 60 lignes détaillées...');

  const invoice = createTestFacturXInvoice();
  const template = new InvoiceTemplateFancy();
  
  try {
    const pdfBytes = await template.render(invoice);
    fs.writeFileSync('./test-modern-design.pdf', pdfBytes);
    
    const fileSizeKB = Math.round(pdfBytes.length / 1024);
    console.log('✅ PDF généré avec succès : ./test-modern-design.pdf');
    console.log(`📊 Taille du fichier : ${fileSizeKB} KB`);
    console.log('🎯 Vérifiez l\'alignement des colonnes et la séparation des en-têtes!');
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  }
})();
