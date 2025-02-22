// example.ts
import { FacturXInvoice, generateFacturxXml, InvoiceHeader } from './core/FacturXInvoice';
import fs from 'fs';
import { FacturxProfile, InvoiceLine, PaymentDetails, PostalAddress, TradeContact, TradeParty } from './core/TaxCalculator';

// 1. Construire un objet FacturXInvoice
const seller = new TradeParty("Ma Société", new PostalAddress("12 Rue Principale", "Paris", "75000"), "FR123456789");
const buyer  = new TradeParty("Mon Client", new PostalAddress("45 Avenue Ach", "Paris", "75010"), "FR12345678900");
const payment = new PaymentDetails("58", "FR7630004000031234567890143", "BNPAFRPP", new Date(2025, 0, 30), "Paiement à 30 jours");
const header = new InvoiceHeader("1", "FAC-2025-001",  "FAC-2025-001", new Date(2025,0,15), new Date(2025,0,15));

// Ajout de deux contacts
seller.addContact(new TradeContact("Jean Dupont", "+33 1 23 45 67 89", "jean.dupont@exemple.com"));
seller.addContact(new TradeContact("Service ADV", "+33 1 23 45 00 00", "adv@exemple.com"));

const invoice = new FacturXInvoice(
  FacturxProfile.EXTENDED,
  header,
  seller,
  buyer,
  payment
);

// 2. Ajouter des lignes
invoice.lines.push(new InvoiceLine("1", "Produit A", 2, 50, 0.20));
invoice.lines.push(new InvoiceLine("2", "Service B", 1, 100, 0.20));

invoice.notes = ["Livraison prévue sous 72h"];
invoice.discounts.push({ percentage: 10, reason: "Remise fidélité" });
invoice.allowances.push(9);
invoice.charges.push(78);
invoice.taxes.push({ rate: 0.20, category: "S" });
invoice.taxes.push({ rate: 0.10, category: "R" });

// 3. Tentons d'ajouter un champ "deliveryParty" => Profil BASIC l'interdit
invoice.deliveryParty = new TradeParty("Entrepôt de livraison", new PostalAddress("1 Rue du Stock", "Paris", "75009"));

try {
  const xml = invoice.generateXml();
  fs.writeFileSync("facture-basic.xml", xml);
  console.log("Facture BASIC générée avec succès !");
} catch (err) {
  console.error("Erreur: ", err);
}

// // 3. Générer le XML
// const xml = generateFacturxXml(invoice);
// console.log(xml);

// // 4. (Optionnel) Sauvegarde dans un fichier
// fs.writeFileSync("facture-facturx.xml", xml);
