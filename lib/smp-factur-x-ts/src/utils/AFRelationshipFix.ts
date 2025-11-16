/**
 * Manual File Attachment with AFRelationship for PDF/A-3 Compliance
 *
 * pdf-lib's attach() doesn't create the proper structure or add AFRelationship.
 * This module creates the complete embedded file structure manually.
 *
 * Based on src/core/PDFA3Conformance.ts approach
 */

import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFRef } from 'pdf-lib';

/**
 * Manually attach a file with complete PDF/A-3 compliance
 * Creates the entire Names/EmbeddedFiles structure with AFRelationship
 */
export async function attachFileWithAFRelationship(
  pdfDoc: PDFDocument,
  fileData: Buffer | Uint8Array,
  fileName: string,
  options: {
    mimeType?: string;
    description?: string;
    creationDate?: Date;
    modificationDate?: Date;
    relationship?: 'Source' | 'Data' | 'Alternative' | 'Supplement' | 'Unspecified';
  } = {}
): Promise<PDFRef> {
  const {
    mimeType = 'text/xml',
    description = '',
    creationDate = new Date(),
    modificationDate = new Date(),
    relationship = 'Data',
  } = options;

  // Step 1: Create the embedded file stream
  const fileBytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);

  const embeddedFileStream = pdfDoc.context.stream(fileBytes, {
    Type: 'EmbeddedFile',
    Subtype: mimeType,
    Params: {
      Size: fileBytes.length,
      CreationDate: PDFString.fromDate(creationDate),
      ModDate: PDFString.fromDate(modificationDate),
    },
  });

  const embeddedFileStreamRef = pdfDoc.context.register(embeddedFileStream);

  // Step 2: Create the file specification dictionary WITH AFRelationship
  const fileSpecDict = pdfDoc.context.obj({
    Type: 'Filespec',
    F: PDFString.of(fileName),
    UF: PDFString.of(fileName),
    Desc: PDFString.of(description),
    AFRelationship: PDFName.of(relationship), // PDF/A-3 requirement
    EF: {
      F: embeddedFileStreamRef,
      UF: embeddedFileStreamRef,
    },
  });

  const fileSpecRef = pdfDoc.context.register(fileSpecDict);

  // Step 3: Add to catalog's Names/EmbeddedFiles structure
  const catalog = pdfDoc.catalog;

  // Get or create /Names dictionary
  let names = catalog.get(PDFName.of('Names'));
  if (!names) {
    names = pdfDoc.context.obj({});
    catalog.set(PDFName.of('Names'), names);
  }
  const namesDict = names as PDFDict;

  // Get or create /EmbeddedFiles dictionary
  let embeddedFiles = namesDict.get(PDFName.of('EmbeddedFiles'));
  if (!embeddedFiles) {
    embeddedFiles = pdfDoc.context.obj({});
    namesDict.set(PDFName.of('EmbeddedFiles'), embeddedFiles);
  }
  const embeddedFilesDict = embeddedFiles as PDFDict;

  // Get or create /Names array
  let namesArray = embeddedFilesDict.get(PDFName.of('Names'));
  if (!namesArray) {
    namesArray = pdfDoc.context.obj([]);
    embeddedFilesDict.set(PDFName.of('Names'), namesArray);
  }
  const array = namesArray as PDFArray;

  // Add [fileName, fileSpecRef] to the Names array
  array.push(PDFString.of(fileName));
  array.push(fileSpecRef);

  // Step 4: Add to /AF array in catalog (PDF/A-3 requirement)
  let afArray = catalog.get(PDFName.of('AF'));
  if (!afArray) {
    afArray = pdfDoc.context.obj([]);
    catalog.set(PDFName.of('AF'), afArray);
  }
  (afArray as PDFArray).push(fileSpecRef);

  console.log(`✓ ${fileName} attached with AFRelationship='${relationship}' and added to /AF array`);

  return fileSpecRef;
}
