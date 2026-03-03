// src/test-multi-page.ts
// Test multi-page invoice with QR code and full PDF/A-3 pipeline
// Output: output/test-multi-page-invoice.pdf

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

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const sellerAddress = PostalAddressImpl.builder()
    .street('1 Boulevard de la Republique')
    .city('Paris')
    .postalCode('75010')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Mon Entreprise SAS')
    .address(sellerAddress)
    .vatId('FR12345678901')
    .build();

  const buyerAddress = PostalAddressImpl.builder()
    .street('45 Avenue Client')
    .city('Lyon')
    .postalCode('69002')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Client XYZ SARL')
    .address(buyerAddress)
    .vatId('FR98765432100')
    .build();

  const header = DocumentHeaderImpl.builder()
    .id('2025-FA-002')
    .invoiceNumber('2025-FA-002')
    .name('FACTURE MULTI-PAGES')
    .invoiceDate(new Date(2025, 6, 28))
    .typeCode(DocTypeCode.INVOICE)
    .build();

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .dueDate(new Date(2025, 7, 28))
    .termsDescription('Paiement sous 30 jours fin de mois.')
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

  // Generate 50 lines to force multiple pages
  for (let i = 1; i <= 50; i++) {
    const longDesc = `Article #${i} : Description tres detaillee de l'article SKU-ABC-${i.toString().padStart(3, '0')}. Ce produit comprend plusieurs caracteristiques techniques importantes et des specifications detaillees pour une utilisation professionnelle.`;

    const price = 25 + (i * 3.5);
    const qty = Math.ceil(Math.random() * 5);

    invoice.addLine(new InvoiceLineImpl(
      i.toString(),
      longDesc,
      qty,
      price,
      0.20
    ));
  }

  const options: Partial<TemplateOptions> = {
    language: 'fr',
    showTaxBreakdown: true,
    showPaymentTerms: true,
    sellerSiren: '123456789',
    sellerSiret: '12345678900012',
    paymentLink: 'https://pay.mon-entreprise.fr/inv/2025-FA-002',
    validateBeforeGeneration: false,
    validateAfterGeneration: false,
  };

  try {
    const result = await generateFancyPDF(invoice, options);
    const outPath = path.join(OUTPUT_DIR, 'test-multi-page-invoice.pdf');
    fs.writeFileSync(outPath, result.pdf);
    console.log(`PDF multi-pages genere: ${outPath}`);
    console.log(`Pages: ${result.pageCount}, Taille: ${Math.round(result.fileSize / 1024)} KB`);
  } catch (err) {
    console.error('Erreur lors de la generation du PDF:', err);
  }
})();
