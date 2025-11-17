#!/usr/bin/env node
// src/cli.ts

/**
 * CLI pour générer des factures Factur-X et des devis conformes
 *
 * Usage:
 *   npm run cli invoice    # Générer une facture
 *   npm run cli quote      # Générer un devis
 *   npm run cli order      # Générer une commande Order-X
 *   npm run cli validate   # Valider un fichier XML
 */

import fs from 'fs';
import path from 'path';
import { PDFDocument, utf8Encode } from 'pdf-lib';
import { FacturXInvoice } from './core/FacturXInvoice';
import { FacturxProfile, TaxCategoryCode, DocTypeCode } from './core/EnumInvoiceType';
import { DocumentHeader } from './core/DocumentHeader';
import { TradeParty, PostalAddress } from './core/HeaderTradeAgreement';
import { PaymentDetails } from './core/PaymentDetails';
import { InvoiceLine } from './core/InvoiceLine';
import { AllowanceCharge } from './core/AllowanceCharge';
import { InvoiceTemplateFancy } from './templates/InvoiceTemplateFancy';
import { InvoiceTemplateBrand } from './templates/InvoiceTemplateBrand';
import { InputSanitizer } from './utils/InputSanitizer';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message: string) {
  log(`❌ ${message}`, 'red');
}

function success(message: string) {
  log(`✅ ${message}`, 'green');
}

function info(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Affiche l'aide du CLI
 */
function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}Accounting Tools CLI${colors.reset}
${colors.bright}Version 1.0.0${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run cli <command> [options]

${colors.bright}COMMANDS:${colors.reset}
  ${colors.green}invoice${colors.reset}     Generate a Factur-X compliant invoice
  ${colors.green}quote${colors.reset}       Generate a compliant quote (pro forma)
  ${colors.green}order${colors.reset}       Generate an Order-X compliant order
  ${colors.green}validate${colors.reset}    Validate a Factur-X XML file
  ${colors.green}help${colors.reset}        Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.cyan}npm run cli invoice${colors.reset}
  ${colors.cyan}npm run cli quote${colors.reset}
  ${colors.cyan}npm run cli validate facture.xml${colors.reset}

${colors.bright}PROFILES:${colors.reset}
  ${colors.yellow}MINIMUM${colors.reset}    - Minimal information
  ${colors.yellow}BASICWL${colors.reset}    - Basic without lines
  ${colors.yellow}BASIC${colors.reset}      - Basic with lines
  ${colors.yellow}EN16931${colors.reset}    - European standard (recommended for B2B)
  ${colors.yellow}EXTENDED${colors.reset}   - All fields (for complex ERP systems)

${colors.bright}DOCUMENTATION:${colors.reset}
  See ANALYSE_COMPLETE_FACTURX_DEVIS.md for complete guide
`);
}

/**
 * Génère une facture interactive
 */
async function generateInvoice() {
  info('Génération d\'une facture Factur-X');
  console.log('');

  // 1. Demander le profil
  const profile = FacturxProfile.EN16931; // Par défaut EN16931
  info(`Profil sélectionné: ${profile}`);

  // 2. Créer les données de base (exemple simplifié)
  const sellerAddress = new PostalAddress(
    "123 Rue du Commerce",
    "Paris",
    "75001",
    "FR",
    "Bâtiment A"
  );

  const seller = new TradeParty(
    "Ma Société SAS",
    sellerAddress,
    "FR12345678901"
  );

  const buyerAddress = new PostalAddress(
    "45 Avenue Client",
    "Lyon",
    "69001",
    "FR"
  );

  const buyer = new TradeParty(
    "Client ABC SARL",
    buyerAddress,
    "FR98765432100"
  );

  const invoiceNumber = `FA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const header = new DocumentHeader(
    invoiceNumber,
    invoiceNumber,
    "FACTURE",
    new Date(),
    new Date(),
    DocTypeCode.INVOICE
  );

  const payment = new PaymentDetails(
    "58",
    "FR7630004000031234567890143",
    "BNPAFRPPXXX",
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
    "Paiement sous 30 jours"
  );

  const invoice = new FacturXInvoice(
    profile,
    header,
    seller,
    buyer,
    payment
  );

  // 3. Ajouter des lignes d'exemple
  invoice.lines.push(new InvoiceLine(
    "1",
    "Prestation de conseil stratégique",
    5,
    800.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "DAY"
  ));

  invoice.lines.push(new InvoiceLine(
    "2",
    "Formation équipe",
    3,
    450.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "HUR"
  ));

  // 4. Générer le XML
  info('Génération du XML Factur-X...');
  const xml = invoice.generateXml(true);
  const xmlFilename = `${invoiceNumber}.xml`;
  fs.writeFileSync(xmlFilename, xml);
  success(`XML généré: ${xmlFilename}`);

  // 5. Générer le PDF
  info('Génération du PDF...');
  const template = new InvoiceTemplateFancy();
  const pdfBytes = await template.render(invoice);

  // 6. Embarquer le XML dans le PDF
  info('Embedding XML dans PDF...');
  const pdfDoc = await PDFDocument.load(pdfBytes);

  await pdfDoc.attach(
    utf8Encode(xml),
    'factur-x.xml',
    {
      mimeType: 'application/xml',
      description: 'Factur-X XML Invoice',
      creationDate: new Date(),
      modificationDate: new Date()
    }
  );

  pdfDoc.setTitle(`Facture ${header.invoiceNumber}`);
  pdfDoc.setSubject('Facture électronique Factur-X');
  pdfDoc.setAuthor(seller.name);
  pdfDoc.setKeywords(['facture', 'factur-x', 'b2b']);

  const pdfFilename = `${invoiceNumber}.pdf`;
  fs.writeFileSync(pdfFilename, await pdfDoc.save());
  success(`PDF généré: ${pdfFilename}`);

  // 7. Afficher le récapitulatif
  const summary = invoice.finalizeTotals();
  console.log('');
  info('RÉCAPITULATIF:');
  console.log(`  Numéro:         ${invoice.header.invoiceNumber}`);
  console.log(`  Date:           ${invoice.header.invoiceDate.toLocaleDateString('fr-FR')}`);
  console.log(`  Total HT:       ${summary.taxBasis.toFixed(2)} €`);
  console.log(`  TVA:            ${summary.taxTotal.toFixed(2)} €`);
  console.log(`  Total TTC:      ${summary.grandTotal.toFixed(2)} €`);
  console.log('');
  success('Facture générée avec succès !');
}

/**
 * Génère un devis interactif
 */
async function generateQuote() {
  info('Génération d\'un devis (Pro Forma)');
  console.log('');

  const profile = FacturxProfile.EN16931;
  info(`Profil sélectionné: ${profile}`);

  // Données de base
  const sellerAddress = new PostalAddress(
    "123 Rue du Commerce",
    "Paris",
    "75001",
    "FR"
  );

  const seller = new TradeParty(
    "Ma Société SAS",
    sellerAddress,
    "FR12345678901"
  );

  const buyerAddress = new PostalAddress(
    "45 Avenue Prospect",
    "Lyon",
    "69001",
    "FR"
  );

  const buyer = new TradeParty(
    "Prospect XYZ SARL",
    buyerAddress,
    "FR98765432100"
  );

  const quoteNumber = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const header = new DocumentHeader(
    quoteNumber,
    quoteNumber,
    "DEVIS",
    new Date(),
    new Date(),
    DocTypeCode.PRO_FORMAT  // 384 = Pro forma / Quote
  );

  header.notes = [
    "Devis valable 30 jours à compter de la date d'émission",
    "Acompte de 30% à la commande, solde à 30 jours",
    "Prix exprimés en euros HT"
  ];

  const payment = new PaymentDetails(
    "58",
    "FR7630004000031234567890143",
    "BNPAFRPPXXX",
    undefined,
    "Acompte 30% à la commande - Solde à 30 jours"
  );

  const quote = new FacturXInvoice(
    profile,
    header,
    seller,
    buyer,
    payment
  );

  // Lignes du devis
  quote.lines.push(new InvoiceLine(
    "1",
    "Développement application web sur mesure",
    40,
    650.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "DAY"
  ));

  quote.lines.push(new InvoiceLine(
    "2",
    "Design UI/UX",
    10,
    550.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "DAY"
  ));

  // Remise commerciale
  quote.docAllowanceCharges.push(
    new AllowanceCharge(
      false,
      1500.00,
      "Remise lancement - Nouveau client",
      "PROMO",
      0.20
    )
  );

  // Générer XML
  info('Génération du XML...');
  const xml = quote.generateXml(true);
  const xmlFilename = `${quoteNumber}.xml`;
  fs.writeFileSync(xmlFilename, xml);
  success(`XML généré: ${xmlFilename}`);

  // Générer PDF
  info('Génération du PDF...');
  const template = new InvoiceTemplateBrand();
  const pdfBytes = await template.render(quote);

  const pdfDoc = await PDFDocument.load(pdfBytes);

  await pdfDoc.attach(
    utf8Encode(xml),
    'factur-x.xml',
    {
      mimeType: 'application/xml',
      description: 'Factur-X Quotation',
      creationDate: new Date(),
      modificationDate: new Date()
    }
  );

  pdfDoc.setTitle(`Devis ${header.invoiceNumber}`);
  pdfDoc.setSubject('Devis / Quotation - Pro Forma');
  pdfDoc.setAuthor(seller.name);

  const pdfFilename = `${quoteNumber}.pdf`;
  fs.writeFileSync(pdfFilename, await pdfDoc.save());
  success(`PDF généré: ${pdfFilename}`);

  // Récapitulatif
  const summary = quote.finalizeTotals();
  console.log('');
  info('RÉCAPITULATIF DEVIS:');
  console.log(`  Numéro:         ${quote.header.invoiceNumber}`);
  console.log(`  Date:           ${quote.header.invoiceDate.toLocaleDateString('fr-FR')}`);
  console.log(`  Total HT:       ${summary.taxBasis.toFixed(2)} €`);
  console.log(`  TVA:            ${summary.taxTotal.toFixed(2)} €`);
  console.log(`  Total TTC:      ${summary.grandTotal.toFixed(2)} €`);
  console.log(`  Acompte 30%:    ${(summary.grandTotal * 0.30).toFixed(2)} €`);
  console.log('');
  success('Devis généré avec succès !');
}

/**
 * Valide un fichier XML Factur-X
 */
async function validateXml(xmlPath: string) {
  if (!xmlPath) {
    error('Veuillez spécifier le chemin du fichier XML à valider');
    console.log('Usage: npm run cli validate <fichier.xml>');
    process.exit(1);
  }

  if (!fs.existsSync(xmlPath)) {
    error(`Fichier non trouvé: ${xmlPath}`);
    process.exit(1);
  }

  info(`Validation du fichier: ${xmlPath}`);

  try {
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

    // Validation basique de la structure XML
    if (!xmlContent.includes('CrossIndustryInvoice')) {
      warn('Le fichier ne semble pas être un document Factur-X valide');
    }

    // Vérifier la présence des éléments obligatoires
    const requiredElements = [
      'ExchangedDocumentContext',
      'ExchangedDocument',
      'SupplyChainTradeTransaction'
    ];

    let valid = true;
    for (const element of requiredElements) {
      if (!xmlContent.includes(element)) {
        error(`Élément obligatoire manquant: ${element}`);
        valid = false;
      }
    }

    if (valid) {
      success('Fichier XML valide !');
      info('Note: Pour une validation XSD complète, utilisez un validateur externe');
    } else {
      error('Fichier XML invalide');
      process.exit(1);
    }
  } catch (err: any) {
    error(`Erreur lors de la validation: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'invoice':
        await generateInvoice();
        break;

      case 'quote':
        await generateQuote();
        break;

      case 'order':
        warn('Order-X generation coming soon!');
        info('Use "quote" command for now (Pro Forma)');
        break;

      case 'validate':
        await validateXml(args[1]);
        break;

      default:
        error(`Commande inconnue: ${command}`);
        console.log('Utilisez "npm run cli help" pour voir les commandes disponibles');
        process.exit(1);
    }
  } catch (err: any) {
    error(`Erreur: ${err.message}`);
    if (err.stack) {
      console.log(err.stack);
    }
    process.exit(1);
  }
}

// Exécuter le CLI si appelé directement
if (require.main === module) {
  main().catch((err) => {
    error(`Erreur fatale: ${err.message}`);
    process.exit(1);
  });
}

export { main };
