/**
 * generate-all.ts
 *
 * Script de generation complete de toutes les factures d'exemple
 * avec tous les templates disponibles.
 *
 * Usage: npx ts-node generate-all.ts
 */

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
  AllowanceChargeImpl,
} from '@facturx/core';
import {
  generatePDF,
  generateModernPDF,
  generateFancyPDF,
  generateBrandPDF,
  generateCorporatePDF,
  generateMinimalPDF,
  TemplateType,
  TemplateOptions,
  PDFGenerationResult,
} from '@facturx/templates';

// ============================================================================
// OUTPUT CONFIGURATION
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureOutputDir(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`\nDossier de sortie: ${OUTPUT_DIR}\n`);
}

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

function createSellerParty(): TradePartyImpl {
  const address = PostalAddressImpl.builder()
    .street('42 avenue des Champs-Elysees')
    .city('Paris')
    .postalCode('75008')
    .countryCode('FR')
    .build();

  return TradePartyImpl.builder()
    .name('SMP Solutions SAS')
    .address(address)
    .vatId('FR89123456789')
    .legalId('891234567')
    .legalIdScheme('0002')
    .electronicAddress('facturation@smp-solutions.fr')
    .electronicAddressScheme('EM')
    .email('facturation@smp-solutions.fr')
    .phone('+33 1 42 68 53 00')
    .build();
}

function createBuyerParty(): TradePartyImpl {
  const address = PostalAddressImpl.builder()
    .street('15 rue de la Republique')
    .city('Lyon')
    .postalCode('69002')
    .countryCode('FR')
    .build();

  return TradePartyImpl.builder()
    .name('Acme Industries SARL')
    .address(address)
    .vatId('FR45987654321')
    .legalId('459876543')
    .legalIdScheme('0002')
    .electronicAddress('comptabilite@acme-industries.fr')
    .electronicAddressScheme('EM')
    .email('comptabilite@acme-industries.fr')
    .build();
}

function createInvoice(): FacturXInvoice {
  const now = new Date();
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const header = DocumentHeaderImpl.builder()
    .id(`FA-${now.getFullYear()}-001`)
    .invoiceNumber(`FA-${now.getFullYear()}-001`)
    .name('FACTURE')
    .invoiceDate(now)
    .typeCode(DocTypeCode.INVOICE)
    .addNoteWithCode('En cas de retard de paiement, une indemnite forfaitaire de 40 euros pour frais de recouvrement sera exigee (art. L.441-10 du Code de commerce).', 'PMT')
    .addNoteWithCode('Taux des penalites de retard : 3 fois le taux d\'interet legal en vigueur.', 'PMD')
    .addNoteWithCode('Pas d\'escompte pour paiement anticipe.', 'AAB')
    .build();

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .dueDate(dueDate)
    .termsDescription('Paiement a 30 jours nets')
    .build();

  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    createSellerParty(),
    createBuyerParty(),
    payment,
    [],
    [],
    CurrencyCode.EUR,
  );

  // Lignes de facture variees
  invoice.addLine(new InvoiceLineImpl('1', 'Developpement application web - Sprint 1', 80, 95.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('2', 'Design UI/UX - Maquettes et prototypes', 40, 85.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('3', 'Optimisation SEO - Audit et implementation', 1, 1200.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('4', 'Redaction contenu - 10 articles blog', 10, 65.00, 0.10));
  invoice.addLine(new InvoiceLineImpl('5', 'Hebergement cloud - Abonnement mensuel', 3, 149.99, 0.20));
  invoice.addLine(new InvoiceLineImpl('6', 'Formation equipe - Session dediee (2 jours)', 2, 450.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('7', 'Support et maintenance - Forfait trimestriel', 1, 800.00, 0.20));

  // Remise commerciale
  invoice.addDocAllowanceCharge(
    new AllowanceChargeImpl(false, 350.00, 'Remise fidelite client', '95', 0.20)
  );

  return invoice;
}

function createCreditNote(): FacturXInvoice {
  const now = new Date();

  const header = DocumentHeaderImpl.builder()
    .id(`AV-${now.getFullYear()}-001`)
    .invoiceNumber(`AV-${now.getFullYear()}-001`)
    .name('AVOIR')
    .invoiceDate(now)
    .typeCode(DocTypeCode.CREDIT_NOTE)
    .addNoteWithCode('En cas de retard de paiement, une indemnite forfaitaire de 40 euros pour frais de recouvrement sera exigee (art. L.441-10 du Code de commerce).', 'PMT')
    .addNoteWithCode('Taux des penalites de retard : 3 fois le taux d\'interet legal en vigueur.', 'PMD')
    .addNoteWithCode('Pas d\'escompte pour paiement anticipe.', 'AAB')
    .build();

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .termsDescription('Remboursement sous 15 jours')
    .build();

  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    createSellerParty(),
    createBuyerParty(),
    payment,
    [],
    [],
    CurrencyCode.EUR,
  );

  invoice.addLine(new InvoiceLineImpl('1', 'Avoir - Prestation annulee (Design UI/UX)', 5, 85.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('2', 'Avoir - Erreur de facturation hebergement', 1, 149.99, 0.20));

  return invoice;
}

function createQuote(): FacturXInvoice {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const header = DocumentHeaderImpl.builder()
    .id(`DEV-${now.getFullYear()}-001`)
    .invoiceNumber(`DEV-${now.getFullYear()}-001`)
    .name('DEVIS')
    .invoiceDate(now)
    .typeCode(DocTypeCode.PRO_FORMAT)
    .dueDate(validUntil)
    .addNoteWithCode('En cas de retard de paiement, une indemnite forfaitaire de 40 euros pour frais de recouvrement sera exigee (art. L.441-10 du Code de commerce).', 'PMT')
    .addNoteWithCode('Taux des penalites de retard : 3 fois le taux d\'interet legal en vigueur.', 'PMD')
    .addNoteWithCode('Pas d\'escompte pour paiement anticipe.', 'AAB')
    .build();

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .dueDate(validUntil)
    .termsDescription('Devis valable 60 jours - Acompte de 30% a la commande')
    .build();

  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    createSellerParty(),
    createBuyerParty(),
    payment,
    [],
    [],
    CurrencyCode.EUR,
  );

  invoice.addLine(new InvoiceLineImpl('1', 'Developpement application mobile (iOS + Android)', 200, 110.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('2', 'Design systeme complet (Design System)', 60, 95.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('3', 'Infrastructure cloud - Setup initial', 1, 2500.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('4', 'Tests et recette - Phase complete', 40, 75.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('5', 'Deploiement et mise en production', 1, 1800.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('6', 'Documentation technique et utilisateur', 20, 60.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('7', 'Formation administrateurs (3 sessions)', 3, 500.00, 0.20));
  invoice.addLine(new InvoiceLineImpl('8', 'Garantie et support 12 mois', 12, 250.00, 0.20));

  // Remise projet
  invoice.addDocAllowanceCharge(
    new AllowanceChargeImpl(false, 2000.00, 'Remise projet global', '95', 0.20)
  );

  return invoice;
}

// ============================================================================
// GENERATION FUNCTIONS
// ============================================================================

interface DocumentConfig {
  name: string;
  label: string;
  factory: () => FacturXInvoice;
}

function createExtendedMultiItem(): FacturXInvoice {
  const now = new Date();
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const header = DocumentHeaderImpl.builder()
    .id(`FA-${now.getFullYear()}-EXT-001`)
    .invoiceNumber(`FA-${now.getFullYear()}-EXT-001`)
    .name('FACTURE')
    .invoiceDate(now)
    .typeCode(DocTypeCode.INVOICE)
    .addNoteWithCode('En cas de retard de paiement, une indemnite forfaitaire de 40 euros pour frais de recouvrement sera exigee.', 'PMT')
    .build();

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .dueDate(dueDate)
    .termsDescription('Paiement a 30 jours nets')
    .build();

  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    createSellerParty(),
    createBuyerParty(),
    payment,
    [],
    [],
    CurrencyCode.EUR,
  );

  // 30 items with varied descriptions to test multi-page and text wrapping
  const descriptions = [
    'Developpement application web - Sprint 1 (React, TypeScript, Node.js)',
    'Design UI/UX - Maquettes et prototypes Figma haute fidelite',
    'Optimisation SEO - Audit complet et implementation des recommandations techniques et editoriales',
    'Redaction contenu - Articles blog optimises pour le referencement naturel',
    'Hebergement cloud - Infrastructure AWS avec auto-scaling et monitoring',
    'Formation equipe - Session dediee sur les pratiques DevOps modernes (CI/CD, Docker, Kubernetes)',
    'Support et maintenance - Forfait trimestriel incluant corrections de bugs et mises a jour de securite',
    'Migration base de donnees - De MySQL vers PostgreSQL avec zero downtime',
    'Audit securite - Tests de penetration et analyse des vulnerabilites OWASP Top 10',
    'Integration API - Connexion avec systemes tiers (Stripe, Mailchimp, Salesforce)',
  ];

  for (let i = 0; i < 30; i++) {
    const desc = descriptions[i % descriptions.length];
    invoice.addLine(new InvoiceLineImpl(
      (i + 1).toString(),
      desc,
      Math.floor(Math.random() * 10) + 1,
      Math.random() * 300 + 50,
      i % 4 === 0 ? 0.10 : 0.20
    ));
  }

  // Remise commerciale
  invoice.addDocAllowanceCharge(
    new AllowanceChargeImpl(false, 500.00, 'Remise volume', '95', 0.20)
  );

  return invoice;
}

const DOCUMENTS: DocumentConfig[] = [
  { name: 'facture', label: 'Facture', factory: createInvoice },
  { name: 'avoir', label: 'Avoir', factory: createCreditNote },
  { name: 'devis', label: 'Devis', factory: createQuote },
  { name: 'extended-multi', label: 'Extended Multi-Items', factory: createExtendedMultiItem },
];

interface TemplateConfig {
  name: string;
  type: TemplateType;
  generator: (invoice: FacturXInvoice, options: Partial<TemplateOptions>) => Promise<PDFGenerationResult>;
}

const TEMPLATES: TemplateConfig[] = [
  { name: 'modern', type: TemplateType.MODERN, generator: generateModernPDF },
  { name: 'fancy', type: TemplateType.FANCY, generator: generateFancyPDF },
  { name: 'brand', type: TemplateType.BRAND, generator: generateBrandPDF },
  { name: 'corporate', type: TemplateType.CORPORATE, generator: generateCorporatePDF },
  { name: 'minimal', type: TemplateType.MINIMAL, generator: generateMinimalPDF },
];

const COMMON_OPTIONS: Partial<TemplateOptions> = {
  language: 'fr',
  showTaxBreakdown: true,
  showPaymentTerms: true,
  sellerSiren: '891234567',
  sellerSiret: '89123456700012',
  validateBeforeGeneration: false,
  validateAfterGeneration: false,
};

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  GENERATION COMPLETE - Factur-X Templates');
  console.log('  Date: ' + new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }));
  console.log('='.repeat(60));

  ensureOutputDir();

  let totalGenerated = 0;
  let totalSize = 0;
  const results: string[] = [];

  for (const doc of DOCUMENTS) {
    console.log(`\n--- ${doc.label.toUpperCase()} ---`);
    const invoice = doc.factory();

    // Also save XML
    const xml = invoice.generateXml(true);
    const xmlPath = path.join(OUTPUT_DIR, `${doc.name}.xml`);
    fs.writeFileSync(xmlPath, xml, 'utf-8');
    console.log(`  XML: ${doc.name}.xml (${(Buffer.byteLength(xml) / 1024).toFixed(1)} KB)`);

    for (const tmpl of TEMPLATES) {
      try {
        const result = await tmpl.generator(invoice, COMMON_OPTIONS);
        const filename = `${doc.name}-${tmpl.name}.pdf`;
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, result.pdf);

        const sizeKB = (result.fileSize / 1024).toFixed(1);
        console.log(`  PDF: ${filename} (${result.pageCount} page(s), ${sizeKB} KB)`);

        totalGenerated++;
        totalSize += result.fileSize;
        results.push(`${filename} - ${result.pageCount} page(s), ${sizeKB} KB`);
      } catch (err: any) {
        console.error(`  ERREUR: ${doc.name}-${tmpl.name}: ${err.message}`);
      }
    }
  }

  // --- Extended multi-item variants (Fancy only, with and without logo) ---
  console.log('\n--- VARIANTES EXTENDED (avec/sans logo) ---');
  const extInvoice = createExtendedMultiItem();

  // Variant 1: Without logo
  try {
    const result = await generateFancyPDF(extInvoice, {
      ...COMMON_OPTIONS,
      logoLayout: 'none',
      sellerSiren: '891234567',
      sellerSiret: '89123456700012',
      paymentLink: 'https://pay.smp-solutions.fr/inv/EXT-001',
    });
    const filename = 'extended-multi-fancy-sans-logo.pdf';
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), result.pdf);
    const sizeKB = (result.fileSize / 1024).toFixed(1);
    console.log(`  PDF: ${filename} (${result.pageCount} page(s), ${sizeKB} KB)`);
    totalGenerated++;
    totalSize += result.fileSize;
    results.push(`${filename} - ${result.pageCount} page(s), ${sizeKB} KB`);
  } catch (err: any) {
    console.error(`  ERREUR: extended-sans-logo: ${err.message}`);
  }

  // Variant 2: With logo above (using a placeholder - no actual image file)
  try {
    const result = await generateFancyPDF(extInvoice, {
      ...COMMON_OPTIONS,
      logoLayout: 'above',
      sellerSiren: '891234567',
      sellerSiret: '89123456700012',
      paymentLink: 'https://pay.smp-solutions.fr/inv/EXT-001',
    });
    const filename = 'extended-multi-fancy-avec-logo.pdf';
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), result.pdf);
    const sizeKB = (result.fileSize / 1024).toFixed(1);
    console.log(`  PDF: ${filename} (${result.pageCount} page(s), ${sizeKB} KB)`);
    totalGenerated++;
    totalSize += result.fileSize;
    results.push(`${filename} - ${result.pageCount} page(s), ${sizeKB} KB`);
  } catch (err: any) {
    console.error(`  ERREUR: extended-avec-logo: ${err.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  RESUME');
  console.log('='.repeat(60));
  console.log(`  Documents generes: ${totalGenerated}`);
  console.log(`  Taille totale: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`  Templates: ${TEMPLATES.map(t => t.name).join(', ')}`);
  console.log(`  Types: ${DOCUMENTS.map(d => d.label).join(', ')}`);
  console.log(`  Dossier: ${OUTPUT_DIR}`);
  console.log('\n  Fichiers:');
  for (const r of results) {
    console.log(`    - ${r}`);
  }
  console.log('\nGeneration terminee avec succes !');
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
