// test-multipage.ts
// Migrated to use @facturx/core + @facturx/templates pipeline
// Generates two multi-page invoices to verify alignment and QR code
// Output: output/test-multipage-invoice.pdf and output/test-multipage-invoice-1.pdf

import fs from 'fs';
import path from 'path';
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

const OUTPUT_DIR = path.join(__dirname, 'output');

function createSeller() {
  const address = PostalAddressImpl.builder()
    .street('123 Rue de la Test')
    .city('Paris')
    .postalCode('75001')
    .countryCode('FR')
    .build();
  return TradePartyImpl.builder()
    .name('Ma Societe SARL')
    .address(address)
    .vatId('FR12345678901')
    .build();
}

function createBuyer() {
  const address = PostalAddressImpl.builder()
    .street('456 Avenue du Client')
    .city('Lyon')
    .postalCode('69002')
    .countryCode('FR')
    .build();
  return TradePartyImpl.builder()
    .name('Client Test SAS')
    .address(address)
    .vatId('FR98765432100')
    .build();
}

function createPayment() {
  return PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .dueDate(new Date(2025, 7, 27))
    .termsDescription('Paiement a 30 jours fin de mois.')
    .build();
}

// Variant 1: 50 items with uniform descriptions
function createMultiPageInvoice50(): FacturXInvoice {
  const header = DocumentHeaderImpl.builder()
    .id('FACT-2025-001')
    .invoiceNumber('FACT-2025-001')
    .name('FACTURE TEST MULTI-PAGES')
    .invoiceDate(new Date(2025, 6, 28))
    .typeCode(DocTypeCode.INVOICE)
    .build();

  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    createSeller(),
    createBuyer(),
    createPayment(),
    [],
    [],
    CurrencyCode.EUR,
  );

  for (let i = 1; i <= 50; i++) {
    invoice.addLine(new InvoiceLineImpl(
      String(i),
      `Produit de test numero ${i} - Description longue avec details techniques et specifications detaillees`,
      Math.floor(Math.random() * 10) + 1,
      Math.random() * 100 + 10,
      0.20,
    ));
  }

  return invoice;
}

// Variant 2: 30 items with mixed long/short descriptions
function createMultiPageInvoiceMixed(): FacturXInvoice {
  const header = DocumentHeaderImpl.builder()
    .id('FACT-2025-002')
    .invoiceNumber('FACT-2025-002')
    .name('FACTURE DESCRIPTIONS VARIEES')
    .invoiceDate(new Date(2025, 6, 28))
    .typeCode(DocTypeCode.INVOICE)
    .build();

  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    createSeller(),
    createBuyer(),
    createPayment(),
    [],
    [],
    CurrencyCode.EUR,
  );

  const descriptions = [
    'Description courte',
    "Description un peu plus longue pour tester l'affichage sur une ligne",
    "Description tres detaillee qui devrait s'etaler sur plusieurs lignes pour verifier que le systeme de wrapping fonctionne correctement et que l'alignement des autres colonnes reste parfait",
    'Consultation strategique en architecture IT incluant audit complet, recommandations et roadmap de modernisation',
    'Dev',
    "Developpement d'une application web moderne avec React, TypeScript, API REST et base de donnees PostgreSQL. Integration continue et deploiement automatise.",
    'Formation equipe technique sur les meilleures pratiques DevOps',
    "Maintenance corrective et evolutive du systeme d'information, incluant la gestion des incidents et le support de niveau 2 et 3",
    'Licence logicielle annuelle',
    'Audit de securite - pentest interne et externe avec rapport detaille des vulnerabilites et recommandations de remediation prioritaires',
  ];

  for (let i = 1; i <= 30; i++) {
    const desc = descriptions[(i - 1) % descriptions.length];
    invoice.addLine(new InvoiceLineImpl(
      String(i),
      desc,
      Math.ceil(Math.random() * 5),
      Math.random() * 500 + 50,
      i % 5 === 0 ? 0.055 : 0.20,
    ));
  }

  return invoice;
}

const baseOptions: Partial<TemplateOptions> = {
  language: 'fr',
  showTaxBreakdown: true,
  showPaymentTerms: true,
  sellerSiren: '123456789',
  sellerSiret: '12345678900012',
  paymentLink: 'https://pay.smp-solutions.fr/inv/FACT-2025-001',
  validateBeforeGeneration: false,
  validateAfterGeneration: false,
};

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate variant 1: 50 items
  console.log('Generation facture 50 items...');
  const invoice50 = createMultiPageInvoice50();
  const result1 = await generateFancyPDF(invoice50, baseOptions);
  const out1 = path.join(OUTPUT_DIR, 'test-multipage-invoice.pdf');
  fs.writeFileSync(out1, result1.pdf);
  console.log(`PDF genere: ${out1} (${result1.pageCount} pages, ${Math.round(result1.fileSize / 1024)} KB)`);

  // Also write to root for backward compatibility
  fs.writeFileSync('./test-multipage-invoice.pdf', result1.pdf);

  // Generate variant 2: 30 items with mixed descriptions
  console.log('Generation facture descriptions variees...');
  const invoiceMixed = createMultiPageInvoiceMixed();
  const opts2: Partial<TemplateOptions> = {
    ...baseOptions,
    paymentLink: 'https://pay.smp-solutions.fr/inv/FACT-2025-002',
  };
  const result2 = await generateFancyPDF(invoiceMixed, opts2);
  const out2 = path.join(OUTPUT_DIR, 'test-multipage-invoice-1.pdf');
  fs.writeFileSync(out2, result2.pdf);
  console.log(`PDF genere: ${out2} (${result2.pageCount} pages, ${Math.round(result2.fileSize / 1024)} KB)`);

  // Also write to root for backward compatibility
  fs.writeFileSync('./test-multipage-invoice-1.pdf', result2.pdf);

  console.log('Tous les PDFs multi-pages generes avec succes.');
})();
