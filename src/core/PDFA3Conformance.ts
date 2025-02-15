// src/core/PdfA3Conformance.ts
import { PDFDocument, PDFName, PDFString, PDFHexString, PDFDict, PDFRef, PDFArray } from 'pdf-lib';
import fs from 'fs';

/**
 * Injecte un profil ICC et crée un OutputIntent.
 * @param pdfDoc Le document PDF
 * @param iccPath Chemin local du fichier sRGB.icc (ou autre).
 */
export async function embedIccProfile(pdfDoc: PDFDocument, iccPath: string): Promise<PDFRef> {
  const iccData = fs.readFileSync(iccPath); // charge le binaire ICC
  const iccBuffer = Uint8Array.from(iccData);

  const iccStream = pdfDoc.context.flateStream(iccBuffer, {
    // Dictionnaire PDF
    Type: PDFName.of('OutputIntent'),
    S: PDFName.of('GTS_PDFA1'), // Sur PDF/A-3, la clef reste GTS_PDFA1
    N: PDFName.of('RGB'),
  });
  const iccRef = pdfDoc.context.register(iccStream);

  // Crée le dictionnaire OutputIntent
  const outputIntentDict = pdfDoc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    OutputCondition: 'sRGB ICC Profile',
    OutputConditionIdentifier: 'sRGB',
    Info: 'sRGB',
    DestOutputProfile: iccRef,
  });
  const outputIntentRef = pdfDoc.context.register(outputIntentDict);

  // Ajoute ce OutputIntent dans le catalogue PDF
  const catalog = pdfDoc.catalog; // => PDFDict
  let outputIntents = catalog.get(PDFName.of('OutputIntents'));
  if (!outputIntents) {
    outputIntents = pdfDoc.context.obj([]);
    catalog.set(PDFName.of('OutputIntents'), outputIntents);
  }
  const arr = outputIntents as PDFArray;
  arr.push(outputIntentRef);

  return outputIntentRef;
}

/**
 * Crée ou remplace le flux XMP Metadata PDF/A-3,
 * indiquant part=3, conformance=B (ou autre).
 */
export function embedPdfA3Xmp(
  pdfDoc: PDFDocument,
  isInvoiceOrOrder: 'invoice' | 'order' | 'other' = 'invoice'
) {
  // 1. Exemple minimal de XMP pour PDF/A-3B
  // On peut l'adapter (dc:title, pdf:Producer, etc.).
  const xmp = `<?xpacket begin=\"\uFEFF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>
<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">
 <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">
  <rdf:Description rdf:about=\"\"
    xmlns:pdfaExtension=\"http://www.aiim.org/pdfa/ns/extension/\"
    xmlns:pdfaSchema=\"http://www.aiim.org/pdfa/ns/schema#\"
    xmlns:pdfaProperty=\"http://www.aiim.org/pdfa/ns/property#\"
    xmlns:pdfaid=\"http://www.aiim.org/pdfa/ns/id/\"
    xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\"
  >
    <pdfaid:part>3</pdfaid:part>
    <pdfaid:conformance>B</pdfaid:conformance>
    <xmp:CreatorTool>My FacturX/OrderX Generator</xmp:CreatorTool>
    <!-- Optionnel: on peut distinguer Factur-X vs Order-X ici -->
    <xmp:Description>${isInvoiceOrOrder}</xmp:Description>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end=\"w\"?>`;

  // 2. On crée un flux PDF binaire
  const xmpUint8 = new TextEncoder().encode(xmp);
  const xmpStream = pdfDoc.context.flateStream(xmpUint8, {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });
  const xmpRef = pdfDoc.context.register(xmpStream);

  // 3. On l'inscrit dans le catalogue (clé /Metadata)
  pdfDoc.catalog.set(PDFName.of('Metadata'), xmpRef);
}

/**
 * Marque le document comme PDF/A-3 en:
 *  - configurant l'OutputIntent (ICC),
 *  - injectant un flux XMP pdfaid:part=3,
 *  - plaçant le ou les fichiers attachés dans /AF (Associated Files),
 *  - positionnant /AFRelationship dans la FileSpec.
 * @param pdfDoc Le document PDF
 * @param attachedFileRefs tableau de références vers les FileSpec joints (XML Factur-X, Order-X, etc.)
 * @param iccPath Chemin vers l'ICC sRGB
 * @param isInvoiceOrOrder Simple tag pour info XMP
 */
export async function markAsPdfA3(
  pdfDoc: PDFDocument,
  attachedFileRefs: PDFRef[],
  iccPath: string,
  isInvoiceOrOrder: 'invoice' | 'order' | 'other' = 'invoice'
) {
  // 1. Embedding ICC + OutputIntent
  await embedIccProfile(pdfDoc, iccPath);

  // 2. Embedding XMP
  embedPdfA3Xmp(pdfDoc, isInvoiceOrOrder);

  // 3. /AF array dans le catalogue
  const catalog = pdfDoc.catalog;
  let afArray = catalog.get(PDFName.of('AF'));
  if (!afArray) {
    afArray = pdfDoc.context.obj([]);
    catalog.set(PDFName.of('AF'), afArray);
  }
  const arrayAF = afArray as PDFArray;
  for (const fRef of attachedFileRefs) {
    // On ajoute le fileSpec dans la liste /AF
    arrayAF.push(fRef);

    // On définit /AFRelationship sur la FileSpec => /Alternative, /Source, /Data, etc.
    const fileSpecDict = fRef.deref() as PDFDict;
    fileSpecDict.set(PDFName.of('AFRelationship'), PDFName.of('Source')); 
    // "Source" ou "Alternative" selon la sémantique (Factur-X => "Source" est standard)
  }

  // 4. Autres ajustements pour PDF/A-3
  // - Marquer /Lang (optionnel)
  // - Marquer /MarkInfo => /Marked true
  catalog.set(PDFName.of('Lang'), PDFString.of('fr-FR'));
  catalog.set(PDFName.of('MarkInfo'), pdfDoc.context.obj({ Marked: true }));
}
