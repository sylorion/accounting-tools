// example-order.ts
import {
  OrderData,
  BaseOrderItem,
  OrderxProfiles,
  OrderTemplateSimple,
  OrderxEngine,
} from './'; // votre package
import { writeFileSync } from 'fs';

async function main() {
  // 1. Définition des données de commande
  const order: OrderData<BaseOrderItem> = {
    orderNumber: 'CMD-2025-001',
    orderDate: new Date(),
    seller: {
      name: 'Ma Société',
      street: '123 Rue Principale',
      city: '75000 Paris',
      countryCode: 'FR',
    },
    buyer: {
      name: 'Mon Client',
      street: '45 Avenue de la Réception',
      city: '75010 Paris',
      countryCode: 'FR',
    },
    currency: 'EUR',
    items: [
      { description: 'Article X', quantity: 3, unitPrice: 12.5 },
      { description: 'Article Y', quantity: 5, unitPrice: 9.99 },
    ],
    disclaimers: ['Commande ferme, pas de retour possible'],
    notes: ['Livraison prévue sous 72h'],
  };

  // 2. Choisir un template PDF
  const template = new OrderTemplateSimple<BaseOrderItem>();

  // 3. Instancier l’engine pour Order-X, choisir le profil (BASIC, EXTENDED, etc.)
  const engine = new OrderxEngine<BaseOrderItem>(template, OrderxProfiles.EXTENDED);

  // 4. Générer le PDF
  const pdfBytes = await engine.generate(order);

  // 5. Sauvegarder
  writeFileSync('commande-orderx.pdf', pdfBytes);
  console.log('Commande Order-X générée avec succès !');
}

main().catch(console.error);
