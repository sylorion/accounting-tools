// test-long-descriptions.ts
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
    "FACTURE TEST DESCRIPTIONS LONGUES",
    new Date(2025, 6, 28),
    new Date()
  );

  // Paiement
  const payment = new PaymentDetails(
    "58",
    "FR7630004000031234567890143",
    "BNPAFRPPXXX",
    new Date(2025, 7, 27),
    "Paiement sous 30 jours"
  );

  const invoice = new FacturXInvoice(FacturxProfile.EXTENDED, header, seller, buyer, payment);

  // Ajouter des items avec des descriptions de différentes longueurs
  const longDescriptions = [
    "Description courte",
    "Description un peu plus longue pour tester l'affichage",
    "Description très très longue qui devrait s'étaler sur plusieurs lignes pour vérifier que le système de wrapping fonctionne correctement et que l'alignement des autres colonnes reste parfait",
    "Consultation stratégique en architecture IT incluant audit complet, recommandations et roadmap de modernisation",
    "Dev",
    "Développement d'une application web moderne avec React, TypeScript, API REST et base de données PostgreSQL",
    "Formation équipe technique sur les meilleures pratiques de développement, méthodologies agiles et outils DevOps modernes"
  ];

  for (let i = 0; i < 25; i++) {
    const desc = longDescriptions[i % longDescriptions.length];
    invoice.lines.push(new InvoiceLine(
      (i + 1).toString(),
      desc,
      Math.floor(Math.random() * 5) + 1,
      Math.random() * 500 + 50,
      0.20
    ));
  }

  return invoice;
}

(async () => {
  console.log('📝 Test des descriptions longues multi-lignes...');
  console.log('🔍 Vérification du wrapping de texte et alignement des colonnes...');

  const invoice = createTestFacturXInvoice();
  const template = new InvoiceTemplateFancy();
  
  try {
    const pdfBytes = await template.render(invoice);
    fs.writeFileSync('./test-long-descriptions.pdf', pdfBytes);
    
    const fileSizeKB = Math.round(pdfBytes.length / 1024);
    console.log('✅ PDF généré avec succès : ./test-long-descriptions.pdf');
    console.log(`📊 Taille du fichier : ${fileSizeKB} KB`);
    console.log('🎯 Vérifiez les descriptions multi-lignes et en-têtes répétés !');
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  }
})();
