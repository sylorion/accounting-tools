/**
 * PDF/A-3 Compliance Utilities
 *
 * This module provides utilities to ensure PDF/A-3 compliance:
 * 1. Embedded fonts (no standard fonts)
 * 2. ICC color profiles (OutputIntent)
 * 3. XMP Metadata
 * 4. File ID generation
 * 5. AFRelationship for embedded files
 */

import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// XMP METADATA GENERATION
// ============================================================================

export interface PDFA3MetadataOptions {
  title: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  keywords?: string[];
  createDate?: Date;
  modifyDate?: Date;
  documentId?: string;
  instanceId?: string;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// UUID generation utility (currently unused but kept for future use)
// function generateUUID(): string {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === 'x' ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }

export function generatePDFA3XMP(options: PDFA3MetadataOptions): string {
  const {
    title,
    author = 'Factur-X Generator',
    subject = 'Electronic Invoice',
    creator = 'factur-x-ts',
    producer = 'pdf-lib + factur-x-ts',
    keywords = ['Invoice', 'Factur-X', 'EN16931'],
    createDate = new Date(),
    modifyDate = new Date(),
  } = options;

  const formatDate = (date: Date): string => date.toISOString();

  const keywordsXML = keywords.length > 0
    ? `<dc:subject>
        <rdf:Bag>
          ${keywords.map(k => `<rdf:li>${escapeXML(k)}</rdf:li>`).join('\n          ')}
        </rdf:Bag>
      </dc:subject>`
    : '';

  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">

      <!-- Dublin Core -->
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${escapeXML(author)}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(subject)}</rdf:li>
        </rdf:Alt>
      </dc:description>
      ${keywordsXML}

      <!-- XMP Basic -->
      <xmp:CreateDate>${formatDate(createDate)}</xmp:CreateDate>
      <xmp:ModifyDate>${formatDate(modifyDate)}</xmp:ModifyDate>
      <xmp:MetadataDate>${formatDate(modifyDate)}</xmp:MetadataDate>
      <xmp:CreatorTool>${escapeXML(creator)}</xmp:CreatorTool>

      <!-- PDF -->
      <pdf:Producer>${escapeXML(producer)}</pdf:Producer>

      <!-- PDF/A-3 Identification -->
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>

      <!-- Factur-X Extension -->
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>INVOICE</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The actual version of the Factur-X standard</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The conformance level of the embedded Factur-X data</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>

      <!-- Factur-X Properties -->
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// ============================================================================
// FILE ID GENERATION
// ============================================================================

export function generatePDFFileID(pdfBytes: Uint8Array): string {
  const hash = createHash('md5').update(pdfBytes).digest('hex');
  return hash.toUpperCase();
}

// ============================================================================
// FONT LOADING
// ============================================================================

export interface EmbeddedFonts {
  regular: Uint8Array;
  bold: Uint8Array;
}

/**
 * Load Chillax fonts from project directory
 */
export async function loadChillaxFonts(): Promise<EmbeddedFonts> {
  const fontsDir = path.join(__dirname, '../../../../src/Fonts/OTF');

  const regular = await fs.promises.readFile(path.join(fontsDir, 'Chillax-Regular.otf'));
  const bold = await fs.promises.readFile(path.join(fontsDir, 'Chillax-Bold.otf'));

  return {
    regular: new Uint8Array(regular),
    bold: new Uint8Array(bold),
  };
}

// ============================================================================
// ICC PROFILE LOADING
// ============================================================================

/**
 * Load sRGB ICC profile (version 2.0 for PDF/A-3 compliance)
 */
export async function loadSRGBProfile(): Promise<Uint8Array> {
  // Use sRGB2014.icc (version 2.0, RGB/XYZ-mntr) which is PDF/A-3 compliant
  // sRGB_v4 profiles are version 4.2 which is NOT accepted by veraPDF (must be < 5.0)
  const iccPath = path.join(__dirname, '../../../../src/compliance/sRGB2014.icc');
  const iccData = await fs.promises.readFile(iccPath);
  return new Uint8Array(iccData);
}

// ============================================================================
// PDF/A-3 COMPLIANCE APPLICATION
// ============================================================================

export async function applyPDFA3Compliance(
  pdfDoc: PDFDocument,
  options: PDFA3MetadataOptions
): Promise<void> {
  // 1. Add XMP Metadata
  const xmpMetadata = generatePDFA3XMP(options);
  const xmpBytes = new TextEncoder().encode(xmpMetadata);

  const metadataStreamRef = pdfDoc.context.register(
    pdfDoc.context.stream(xmpBytes, {
      Type: 'Metadata',
      Subtype: 'XML',
    })
  );

  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataStreamRef);

  // 2. Add OutputIntent (sRGB ICC Profile)
  const srgbProfile = await loadSRGBProfile();
  const iccStreamRef = pdfDoc.context.register(
    pdfDoc.context.stream(srgbProfile)
  );

  const outputIntentDict = pdfDoc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    OutputConditionIdentifier: 'sRGB IEC61966-2.1',
    RegistryName: 'http://www.color.org',
    Info: 'sRGB IEC61966-2.1',
    DestOutputProfile: iccStreamRef,
  });

  const outputIntents = pdfDoc.context.obj([outputIntentDict]);
  pdfDoc.catalog.set(PDFName.of('OutputIntents'), outputIntents);

  // 3. Set PDF Version to 1.7
  pdfDoc.catalog.set(PDFName.of('Version'), PDFName.of('1.7'));
}

/**
 * Add AFRelationship to an embedded file
 */
export function addAFRelationshipToFile(
  fileSpecDict: PDFDict,
  relationship: 'Source' | 'Data' | 'Alternative' | 'Supplement' | 'Unspecified' = 'Data'
): void {
  fileSpecDict.set(PDFName.of('AFRelationship'), PDFName.of(relationship));
}

/**
 * Set File ID in PDF trailer (done during save)
 * Note: pdf-lib handles File ID generation automatically during save
 * This function is kept for API compatibility but currently unused
 */
export function setPDFFileID(_pdfDoc: PDFDocument, _fileId: string): void {
  // Note: pdf-lib sets the ID automatically during save
  // We'll add it manually after the PDF is generated if needed
  // Currently unused - pdf-lib handles this
}

// ============================================================================
// COMPREHENSIVE PDF/A-3 SETUP
// ============================================================================

export interface PDFA3SetupOptions {
  title: string;
  author?: string;
  subject?: string;
  creator?: string;
  keywords?: string[];
}

/**
 * Apply all PDF/A-3 compliance measures to a PDF document
 */
export async function setupPDFA3Compliance(
  pdfDoc: PDFDocument,
  options: PDFA3SetupOptions
): Promise<void> {
  const metadataOptions: PDFA3MetadataOptions = {
    ...options,
    createDate: new Date(),
    modifyDate: new Date(),
  };

  await applyPDFA3Compliance(pdfDoc, metadataOptions);
}
