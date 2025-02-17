import fs from 'fs';
import { PDFDocument, PDFName, PDFArray } from 'pdf-lib';
import { Invoice } from '../models/Invoice';
import { Signer } from '../signature/Signer';

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
  constructor(
    private pdfBytes: Uint8Array,
    private invoice: Invoice
  ) {}

  public sign(privateKey: string): Buffer {
    return Signer.sign(this.pdfBytes, privateKey);
  }

  public verify(signature: Buffer, publicKey: string): boolean {
    return Signer.verify(this.pdfBytes, signature, publicKey);
  }

  public async save(destinationPath: string, options?: PDFOption): Promise<void> {
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
    return this.pdfBytes;
  }

  /**
   * Extract the embedded XML from the PDF.
   * Assumes the embedded file is named "factur-x.xml" and was attached via pdf-lib's attach() method.
   */
  public async extractEmbeddedXml(): Promise<Uint8Array> {
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
}
