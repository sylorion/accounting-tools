// generatePDF.ts
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { buildSampleInvoice } from './invoiceDataFactory';
import { invoiceToHbsContext } from './transformForTemplate';

async function generatePdf() {
  // 1) On construit l'objet FacturXInvoice
  const invoice = buildSampleInvoice();

  // 2) Transforme en données adaptées (ou on passe direct `invoice`)
  const dataContext = invoiceToHbsContext(invoice);

  // 3) Lit le template .hbs
  const templatePath = path.join(__dirname, '.', 'templates', 'InvoiceBrandTemplate.hbs');
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  // 4) Compile le template Handlebars
  const template = Handlebars.compile(templateContent);

  // 5) Génère le HTML final
  const html = template(dataContext);

  // 6) Lance Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 7) Injecte le HTML et attend la fin du chargement
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // 8) Génére le PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: false,
    margin: { top: '10mm', bottom: '10mm' },
  });

  await browser.close();

  // 9) Écrit le PDF dans un fichier
  fs.writeFileSync('facture-sample-hbs.pdf', pdfBuffer);
  console.log('PDF généré : facture-sample-hbs.pdf');
}

generatePdf().catch(console.error);
