// test-long-descriptions.ts
// Migrated to use @facturx/core + @facturx/templates pipeline
// for full PDF/A-3 compliance (embedded fonts, XMP, ICC, File ID, AFRelationship)

import fs from 'fs';
import {
  FacturXInvoice,
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
  CurrencyCode,
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLineImpl,
} from '@facturx/core';
import { generateFancyPDF, TemplateOptions } from '@facturx/templates';

function createTestFacturXInvoice(): FacturXInvoice {
  const sellerAddress = PostalAddressImpl.builder()
    .street('123 Rue de la Test')
    .city('Paris')
    .postalCode('75001')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Ma Societe SARL')
    .address(sellerAddress)
    .vatId('FR12345678901')
    .build();

  const buyerAddress = PostalAddressImpl.builder()
    .street('456 Avenue du Client')
    .city('Lyon')
    .postalCode('69002')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Client Test SAS')
    .address(buyerAddress)
    .vatId('FR98765432100')
    .build();

  const header = DocumentHeaderImpl.builder()
    .id('FACT-2025-001')
    .invoiceNumber('FACT-2025-001')
    .name('FACTURE TEST DESCRIPTIONS LONGUES')
    .invoiceDate(new Date(2025, 6, 28))
    .typeCode(DocTypeCode.INVOICE)
    .build();

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .dueDate(new Date(2025, 7, 27))
    .termsDescription('Paiement sous 30 jours')
    .build();

  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    seller,
    buyer,
    payment,
    [],
    [],
    CurrencyCode.EUR,
  );

  // Items with descriptions of varying lengths
  const longDescriptions = [
    'Description courte',
    "Description un peu plus longue pour tester l'affichage",
    "Description tres tres longue qui devrait s'etaler sur plusieurs lignes pour verifier que le systeme de wrapping fonctionne correctement et que l'alignement des autres colonnes reste parfait",
    'Consultation strategique en architecture IT incluant audit complet, recommandations et roadmap de modernisation',
    'Dev',
    'Developpement d\'une application web moderne avec React, TypeScript, API REST et base de donnees PostgreSQL',
    'Formation equipe technique sur les meilleures pratiques de developpement, methodologies agiles et outils DevOps modernes',
  ];

  for (let i = 0; i < 25; i++) {
    const desc = longDescriptions[i % longDescriptions.length];
    invoice.addLine(new InvoiceLineImpl(
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
  console.log('Test des descriptions longues multi-lignes...');
  console.log('Verification du wrapping de texte et alignement des colonnes...');

  const invoice = createTestFacturXInvoice();

  const options: Partial<TemplateOptions> = {
    language: 'fr',
    showTaxBreakdown: true,
    showPaymentTerms: true,
    sellerSiren: '123456789',
    sellerSiret: '12345678900012',
    paymentLink: 'https://pay.smp-solutions.fr/inv/FACT-2025-001',
    validateBeforeGeneration: false,
    validateAfterGeneration: false,
  };

  try {
    const result = await generateFancyPDF(invoice, options);
    fs.writeFileSync('./test-long-descriptions.pdf', result.pdf);

    const fileSizeKB = Math.round(result.fileSize / 1024);
    console.log(`PDF genere avec succes : ./test-long-descriptions.pdf`);
    console.log(`Pages: ${result.pageCount}, Taille: ${fileSizeKB} KB`);
    console.log('Verifiez les descriptions multi-lignes et en-tetes repetes !');
  } catch (error) {
    console.error('Erreur lors de la generation:', error);
  }
})();
