import { Libxml } from 'node-libxml';
import fs from 'fs';

export async function validate(xmlContent: string, xsdPath: string): Promise<void> {
  try{
    const libxml = new Libxml();
    libxml.loadXml(xmlContent); 
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');
    console.log("\n\n\nXSD path: " + xsdPath); 
    // Charger le schéma XSD
      libxml.loadSchemas([xsdContent]); 
    // Valider l’XML
    const result = libxml.validateAgainstSchemas(1); 
    console.log("\n\nValidation result: " + result);
    if (!result) {
      const errors = libxml.validationSchemaErrors ?? [];
      if (errors.length !== 0) {
        // const errorMsg = errors.map((e) => `${e.message} (ligne ${e.line})`).join("; ");
        throw new Error("\n\n\nValidation échouée: " + JSON.stringify(errors, null, 2)); 
      }
    }
  } catch (e) {
    const errorMsg = e // .forEach((e) => `${e.message} (line ${e.line})`).join("; ");
    throw new Error("Validation Error: " + errorMsg);
  }
}
