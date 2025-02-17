import fs from 'fs';
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFString, PDFRef } from 'pdf-lib';
import { Invoice } from '../models/Invoice';
import { Signer } from '../signature/Signer';
import { ComplianceType } from './EnumInvoiceType';
import { FacturXInvoice } from './FacturXInvoice';
import { TemplateRenderer } from '../generators/templates/TemplateRenderer';
import { RendererOption } from '../generators/templates/RendererOption';
import { InvoiceTemplateSimple } from '../templates/InvoiceTemplateSimple';
import { BaseInvoiceItem } from '../models/BaseInvoiceItem';

export interface PDFOption {
  title?: string;
  subject?: string;
  author?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  summary?: string;
  provider?: string;
  // Additional permissions or encryption options could go here.
}

export class InvoicePDF {
  private pdfBytes?: Uint8Array;
  constructor(
    private invoice: FacturXInvoice,
    private options: PDFOption,
  ) {}

  public sign(privateKey: string): Buffer {
    
    if (!this.pdfBytes) {
      throw new Error("PDF bytes are not initialized.");
    }
    return Signer.sign(this.pdfBytes, privateKey);
  }

  public verify(signature: Buffer, publicKey: string): boolean {
    if (!this.pdfBytes) {
      throw new Error("PDF bytes are not initialized.");
    }
    return Signer.verify(this.pdfBytes, signature, publicKey);
  }

  public async save(destinationPath: string, options?: PDFOption): Promise<void> {
    if (!this.pdfBytes) {
      throw new Error("PDF bytes are not initialized.");
    }
    const pdfDoc = await PDFDocument.load(this.pdfBytes);
    if (options?.title) pdfDoc.setTitle(options.title);
    if (options?.subject) pdfDoc.setSubject(options.subject);
    if (options?.author) pdfDoc.setAuthor(options.author);
    if (options?.keywords) pdfDoc.setKeywords(options.keywords);
    if (options?.creator) pdfDoc.setCreator(options.creator);
    if (options?.producer) pdfDoc.setProducer(options.producer);
    if (options?.summary) pdfDoc.setSubject(options.summary);
    if (options?.provider) pdfDoc.setAuthor(options.provider);
    const finalBytes = await pdfDoc.save();
    fs.writeFileSync(destinationPath, finalBytes);
  }

  public getBytes(): Uint8Array {
    if (!this.pdfBytes) {
      throw new Error("PDF bytes are not initialized.");
    }
    return this.pdfBytes;
  }

  // /**
  //  * Render this invoice to PDF, with a given compliance type,
  //  * a chosen template, and optional override for the template's rendering options.
  //  * Returns a new InvoicePDF object for signing, verification, saving, etc.
  //  */
  // public async pdf<TLine extends BaseInvoiceItem>( 
  //   compliance: ComplianceType,
  //   template: InvoiceTemplateSimple<TLine>,
  //   invoice: FacturXInvoice,
  //   renderOptions?: Partial<RendererOption<TLine>>
  // ): Promise<Uint8Array<ArrayBufferLike>> { 
  //   // 1. Create new PDF

  //   // 2. Merge rendering options (the template might have base defaults).
  //   // For now, we just pass the user overrides; the template handles the rest.
  //   const mergedOptions: RendererOption<TLine> = {
  //     ...this.options,
  //     ...renderOptions,
  //   };
  //   // Buffer.from(xmlString, 'utf-8')
  //   if(this.pdfBytes)
  //   // 3. Render invoice content
  //   // const pdfBytes = await template.render(invoice, mergedOptions);
  //   const pdfBytes = await template.render(invoice, mergedOptions);

  //   const pdfDoc = await PDFDocument.load(pdfBytes);
  //   // 4. If compliance is FR_FACTUR_X, embed Factur-X XML
  //   if (compliance === ComplianceType.FR_FACTUR_X) {
  //     const xmlString = invoice.generateXml();
  //     const xmlBytes = new TextEncoder().encode(xmlString);
  //     // Embed the XML in the PDF
  //     await this.embedXmlInPdf(pdfDoc, xmlBytes);
  //   } else if (compliance === ComplianceType.GENERIC_UBL) {
  //     // const xmlString = invoice.generateUblXml(); // Generate UBL XML if needed
  //     // const xmlBytes = new TextEncoder().encode(xmlString);
  //     // return xmlBytes;
  //   } else {
  //     throw new Error(`Unsupported compliance type: ${compliance}`);
  //   }

  //   // 5. Return final bytes
  //   return await pdfDoc.save()
  // }

  /**
   * Extract the embedded XML from the PDF.
   * Assumes the embedded file is named "factur-x.xml" and was attached via pdf-lib's attach() method.
   */
  public async extractEmbeddedXml(): Promise<Uint8Array> {
    if (!this.pdfBytes) {
      throw new Error("PDF bytes are not initialized.");
    }
    
    const pdfDoc = await PDFDocument.load(this.pdfBytes);
    const catalog = pdfDoc.catalog;

    // Look up the "Names" dictionary in the catalog.
    const names = catalog.get(PDFName.of('Names'));
    if (!names) {
      throw new Error("No Names dictionary found in PDF.");
    }
    const namesDict = names as any; // Using any because of internal structure.

    // Look for the EmbeddedFiles dictionary.
    const embeddedFiles = namesDict.get(PDFName.of('EmbeddedFiles'));
    if (!embeddedFiles) {
      throw new Error("No EmbeddedFiles found in the Names dictionary.");
    }
    const embeddedFilesDict = embeddedFiles as any;
    const filesArray = embeddedFilesDict.get(PDFName.of('Names'));
    if (!filesArray || !(filesArray instanceof PDFArray)) {
      throw new Error("EmbeddedFiles Names array is missing or invalid.");
    }

    let lookUpContent: any = null;
    // Iterate over the array: [ name1, fileSpec1, name2, fileSpec2, ... ]
    const array = filesArray.asArray();
    for (let i = 0; i < array.length; i += 2) {
      const fileNameObj = array[i];
      const fileName = (fileNameObj as any).value; // PDFString value.
      if (fileName === 'factur-x.xml') {
        // Next element is the file specification dictionary.
        const fileSpec = array[i + 1];
        const efDict = (fileSpec as any).get(PDFName.of('EF'));
        if (!efDict) {
          throw new Error("No EF dictionary found in the file specification for factur-x.xml.");
        }
        const fileStreamRef = efDict.get(PDFName.of('F'));
        if (!fileStreamRef) {
          throw new Error("No file stream reference found in the EF dictionary.");
        }
        const fileStream = pdfDoc.context.lookup(fileStreamRef);
        if (!fileStream || !(fileStream as any).contents) {
          throw new Error("Unable to retrieve the embedded XML file stream.");
        }
        lookUpContent = (fileStream as any).contents;
        return lookUpContent; 
      }
    }
    if (!lookUpContent) {
      throw new Error("Embedded XML file 'factur-x.xml' not found in PDF.");
    }
    return lookUpContent;
    // throw new Error("Embedded XML file 'factur-x.xml' not found in PDF.");
  }


  private async embedXmlInPdf(pdf: PDFDocument, xmlBytes: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = pdf;

    // pdf-lib 1.17.1 has an attach() method that can embed files.
    // We'll check if the method is available; else implement a workaround.
    // This approach sets up a FileSpec in the PDF.

    if (typeof (pdfDoc as any).attach === 'function') {
      // Use the attach() convenience if it exists.
      await (pdfDoc as any).attach(xmlBytes, 'factur-x.xml', {
        mimeType: 'application/xml',
        description: 'Factur-X embedded XML'
      });
    } else {
      // If attach() isn't available, we'd do a manual approach.
      // We'll skip the manual approach for brevity.
      console.warn('pdf-lib attach() not available. Skipping embed.');
    }

    // Minimal approach to set the AF entry in the PDF catalog.
    // This is required for a formal PDF/A-3 or PDF/A-3u compliance.
    // We'll do it if the attached file is present.

    const catalog = pdfDoc.catalog;
    const Names = catalog.lookup(PDFName.of('Names'));
    if (Names) {
      const embeddedFiles = (Names as any).lookup(PDFName.of('EmbeddedFiles'));
      if (embeddedFiles) {
        const embeddedFilesArray = (embeddedFiles as any).lookup(PDFName.of('Names'));
        if (embeddedFilesArray instanceof PDFArray && embeddedFilesArray.size() >= 2) {
          // We have at least one embedded file.
          const fileSpecRef = embeddedFilesArray.lookup(1);
          // Add an /AF entry to the catalog referencing the fileSpec.
          catalog.set(PDFName.of('AF'), pdfDoc.context.obj([fileSpecRef]));
        }
      }
    }

    // Optionally we could set XMP metadata, set PDF/A conformance, etc.
    // That is quite extensive, so we show only partial approach.

    return await pdfDoc.save();
  }

  /**
   * Injecte un profil ICC et crée un OutputIntent.
   * @param pdfDoc Le document PDF
   * @param iccPath Chemin local du fichier sRGB.icc (ou autre).
   */
  async embedIccProfile(pdfDoc: PDFDocument, iccPath: string): Promise<PDFRef> {
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
  private embedPdfA3Xmp(
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
  async markAsPdfA3(
    pdfDoc: PDFDocument,
    attachedFileRefs: PDFRef[],
    iccPath: string,
    isInvoiceOrOrder: 'invoice' | 'order' | 'other' = 'invoice'
  ) {
    // 1. Embedding ICC + OutputIntent
    await this.embedIccProfile(pdfDoc, iccPath);

    // 2. Embedding XMP
    await this.embedPdfA3Xmp(pdfDoc, isInvoiceOrOrder);

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
      const fileSpecDict = pdfDoc.context.lookup(fRef) as PDFDict;
      fileSpecDict.set(PDFName.of('AFRelationship'), PDFName.of('Source')); 
      // "Source" ou "Alternative" selon la sémantique (Factur-X => "Source" est standard)
    }

    // 4. Autres ajustements pour PDF/A-3
    // - Marquer /Lang (optionnel)
    // - Marquer /MarkInfo => /Marked true
    catalog.set(PDFName.of('Lang'), PDFString.of('fr-FR'));
    catalog.set(PDFName.of('MarkInfo'), pdfDoc.context.obj({ Marked: true }));
  }

}
