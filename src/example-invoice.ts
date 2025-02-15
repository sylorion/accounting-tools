// example-usage.ts
import {
  FacturxEngine,
  FacturxProfiles,
  InvoiceTemplateSimple,
  InvoiceData,
} from './index';
import { writeFileSync } from 'fs';

async function main() {
  // Données d'exemple
  const invoiceData: InvoiceData = {
    invoiceNumber: '2025-0001',
    invoiceDate: new Date(),
    seller: {
      name: 'Ma Société',
      street: '123 Rue Principale',
      city: '75000 Paris',
      countryCode: 'FR',
      vatNumber: 'FR123456789'
    },
    buyer: {
      name: 'Mon Client',
      street: '45 Avenue Ach',
      city: '75010 Paris',
      countryCode: 'FR',
    },
    items: [
      { description: 'Produit A', quantity: 2, unitPrice: 50, vatRate: 0.20 },
      { description: 'Service B', quantity: 1, unitPrice: 100, vatRate: 0.20 },
    ],
    currency: 'EUR',
    disclaimers: [ 'Aucune remise ne sera appliquée a posteriori.' ],
    notes: [ 'Merci de votre confiance !' ],
  };

  // Choix du template
  const template = new InvoiceTemplateSimple();

  // Instancier le moteur Factur-X, en profil "EXTENDED" par exemple
  const engine = new FacturxEngine(template, FacturxProfiles.EXTENDED);

  // Générer le PDF
  const pdfBytes = await engine.generate(invoiceData);

  // Écrire sur disque
  writeFileSync('output-facturx.pdf', pdfBytes);

  console.log('Facture Factur-X (profil EXTENDED) générée avec succès !');
}

main().catch(console.error);
