// example-validation.ts
import { FacturXInvoice, FacturxProfile, InvoiceHeader, TradeParty, PostalAddress, PaymentDetails, InvoiceLine, generateFacturxXml } from './core/FacturXInvoice';
import { validate  } from './validate-xml';
import fs from 'fs';
// xmlValidator.ts

import * as path from 'path';
import * as libxmljs from 'libxmljs';

/**
 * Valide un fichier XML contre un schéma XSD.
 * @param xmlFilePath Chemin du fichier XML à valider.
 * @param xsdFilePath Chemin du fichier XSD (schéma) à utiliser pour la validation.
 * @returns Tableau des erreurs de validation (vide si aucune erreur).
 */

function validateXmlMultiXsd(
  xmlPath: string,
  xsdPaths: string[]
): string[] {
  const errors: string[] = [];
  try {
    // Charger le XML
    const xmlData = fs.readFileSync(xmlPath, 'utf8');
    const xmlDoc = libxmljs.parseXml(xmlData);

    // Charger tous les schémas
    // xsdPaths doit inclure : le schéma principal (CrossIndustryInvoice.xsd)
    // et les 3 schémas importés
    const xsdDocs = xsdPaths.map((p) => {
      const data = fs.readFileSync(p, 'utf8');
      return libxmljs.parseXml(data);
    });

    // Valider en passant le tableau des schémas
    const isValid = xmlDoc.validate(xsdDocs.at(0)!);
    if (!isValid) {
      // Récupérer les erreurs
      for (const err of xmlDoc.validationErrors) {
        errors.push(err.message);
      }
    }
  } catch (e: any) {
    errors.push(`Exception lors de la validation : ${e.message}`);
  }
  return errors;
}

(async () => {
  // 1. Construire l'objet FacturX
  const seller = new TradeParty("Ma Société", new PostalAddress("12 Rue Principale", "Paris", "75000"));
  const buyer  = new TradeParty("Mon Client", new PostalAddress("45 Avenue Ach", "Paris", "75010"));
  const payment = new PaymentDetails("58", "FR7630004000031234567890143", "BNPAFRPP", new Date(2025, 0, 30));
  const header = new InvoiceHeader("FAC-2025-XYZ", new Date(2025,0,15));
  const invoice = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);
  // Lignes
  invoice.lines.push(new InvoiceLine("1", "Produit A", 2, 50, 0.20));
  invoice.lines.push(new InvoiceLine("2", "Service B", 1, 100, 0.20));

  // 2. Générer l'XML
  const xml = generateFacturxXml(invoice);

  // 3. Charger le schéma (XSD) et Valider

const errors = validateXmlWithXsd("facture_validated.xml", "schemas/xsd/4. Factur-X_1.07.2_EXTENDED/Factur-X_1.07.2_EXTENDED.xsd");
if (errors.length > 0) {
  console.error('Validation échouée :', errors);
} else {
  console.log('XML conforme au schéma XSD');
}
  try {
    await validate(xml, "schemas/xsd/4. Factur-X_1.07.2_EXTENDED/Factur-X_1.07.2_EXTENDED.xsd");
    console.log("Validation XSD : OK");
  } catch (err) {
    console.error("Validation XSD : ERREUR ->", err);
  }

  // (optionnel) 5. Schematron check
  // const errors = validateSchematron(xml, "schemas/facturx_en16931.xsl");
  // if (errors.length > 0) console.error("Schematron errors:", errors);
  
  // 6. Sauvegarde du XML
  fs.writeFileSync("facture_validated.xml", xml);

})();
