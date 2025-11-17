/**
 * Tests for PDFA3Compliance module
 * Tests PDF/A-3 compliance utilities
 */

import { PDFDocument, PDFName, PDFArray, PDFDict } from 'pdf-lib';
import {
  generatePDFA3XMP,
  generateFileIDArray,
  loadChillaxFonts,
  loadSRGBProfile,
  setupPDFA3Compliance,
  applyPDFA3Compliance,
} from '../../utils/PDFA3Compliance';
import * as path from 'path';
import * as fs from 'fs';

describe('PDFA3Compliance', () => {
  describe('generatePDFA3XMP', () => {
    it('should generate valid XMP metadata', () => {
      const xmp = generatePDFA3XMP({
        title: 'Test Invoice',
        author: 'Test Company',
        subject: 'Invoice 12345',
      });

      expect(xmp).toContain('<?xpacket begin');
      expect(xmp).toContain('pdfaid:part>3');
      expect(xmp).toContain('pdfaid:conformance>B');
      expect(xmp).toContain('Test Invoice');
      expect(xmp).toContain('Test Company');
      expect(xmp).toContain('<?xpacket end');
    });

    it('should include Factur-X extensions', () => {
      const xmp = generatePDFA3XMP({
        title: 'Invoice',
      });

      expect(xmp).toContain('fx:DocumentFileName');
      expect(xmp).toContain('factur-x.xml');
      expect(xmp).toContain('fx:DocumentType');
      expect(xmp).toContain('INVOICE');
    });

    it('should use default values when not provided', () => {
      const xmp = generatePDFA3XMP({
        title: 'Test',
      });

      expect(xmp).toContain('Factur-X Generator');
      expect(xmp).toContain('factur-x-ts');
      expect(xmp).toContain('Invoice');
    });

    it('should handle custom keywords', () => {
      const xmp = generatePDFA3XMP({
        title: 'Test',
        keywords: ['custom', 'keywords', 'test'],
      });

      expect(xmp).toContain('custom');
      expect(xmp).toContain('keywords');
      expect(xmp).toContain('test');
    });
  });

  describe('generateFileIDArray', () => {
    it('should generate two identical IDs', () => {
      const [id1, id2] = generateFileIDArray();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).toBe(id2); // PDF/A-3 requires both IDs to be the same
    });

    it('should generate valid hex strings', () => {
      const [id1] = generateFileIDArray();

      expect(id1).toMatch(/^[0-9A-F]+$/); // Uppercase hex
      expect(id1.length).toBe(32); // MD5 hash length
    });

    it('should generate different IDs on subsequent calls', () => {
      const [id1] = generateFileIDArray();
      const [id2] = generateFileIDArray();

      expect(id1).not.toBe(id2); // Should be unique
    });
  });

  describe('loadChillaxFonts', () => {
    it('should load Chillax fonts from assets', async () => {
      const fonts = await loadChillaxFonts();

      expect(fonts).toBeDefined();
      expect(fonts.regular).toBeInstanceOf(Uint8Array);
      expect(fonts.bold).toBeInstanceOf(Uint8Array);
    });

    it('should load non-empty font files', async () => {
      const fonts = await loadChillaxFonts();

      expect(fonts.regular.length).toBeGreaterThan(0);
      expect(fonts.bold.length).toBeGreaterThan(0);
    });

    it('should load valid OTF fonts', async () => {
      const fonts = await loadChillaxFonts();

      // Check OTF magic number (OTTO)
      const regularHeader = String.fromCharCode(
        fonts.regular[0],
        fonts.regular[1],
        fonts.regular[2],
        fonts.regular[3]
      );
      const boldHeader = String.fromCharCode(
        fonts.bold[0],
        fonts.bold[1],
        fonts.bold[2],
        fonts.bold[3]
      );

      expect(regularHeader).toBe('OTTO');
      expect(boldHeader).toBe('OTTO');
    });
  });

  describe('loadSRGBProfile', () => {
    it('should load sRGB ICC profile', async () => {
      const profile = await loadSRGBProfile();

      expect(profile).toBeInstanceOf(Uint8Array);
      expect(profile.length).toBeGreaterThan(0);
    });

    it('should load valid ICC profile', async () => {
      const profile = await loadSRGBProfile();

      // Check ICC profile signature (first 4 bytes after size)
      const signature = String.fromCharCode(
        profile[36],
        profile[37],
        profile[38],
        profile[39]
      );

      expect(signature).toBe('acsp'); // ICC profile signature
    });

    it('should load sRGB2014.icc specifically', async () => {
      await loadSRGBProfile(); // Just verify it loads without error

      // File should exist at expected location
      const iccPath = path.join(__dirname, '../../../assets/icc/sRGB2014.icc');
      const exists = fs.existsSync(iccPath);

      expect(exists).toBe(true);
    });
  });

  describe('applyPDFA3Compliance', () => {
    let pdfDoc: PDFDocument;

    beforeEach(async () => {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage(); // Need at least one page
    });

    it('should add XMP metadata to catalog', async () => {
      await applyPDFA3Compliance(pdfDoc, {
        title: 'Test Invoice',
        author: 'Test Company',
      });

      const catalog = pdfDoc.catalog;
      const metadata = catalog.get(PDFName.of('Metadata'));

      expect(metadata).toBeDefined();
    });

    it('should add OutputIntents to catalog', async () => {
      await applyPDFA3Compliance(pdfDoc, {
        title: 'Test Invoice',
      });

      const catalog = pdfDoc.catalog;
      const outputIntents = catalog.get(PDFName.of('OutputIntents'));

      expect(outputIntents).toBeDefined();
      expect(outputIntents).toBeInstanceOf(PDFArray);
    });

    it('should set PDF version to 1.7', async () => {
      await applyPDFA3Compliance(pdfDoc, {
        title: 'Test Invoice',
      });

      const catalog = pdfDoc.catalog;
      const version = catalog.get(PDFName.of('Version'));

      expect(version).toEqual(PDFName.of('1.7'));
    });

    it('should add File ID to trailer', async () => {
      await applyPDFA3Compliance(pdfDoc, {
        title: 'Test Invoice',
      });

      const trailerInfo = pdfDoc.context.trailerInfo;

      expect(trailerInfo.ID).toBeDefined();
      expect(trailerInfo.ID).toBeInstanceOf(PDFArray);
    });

    it('should create valid PDF after compliance', async () => {
      await applyPDFA3Compliance(pdfDoc, {
        title: 'Test Invoice',
        author: 'Test Company',
        subject: 'Invoice 12345',
      });

      const pdfBytes = await pdfDoc.save();

      expect(pdfBytes).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should handle all metadata options', async () => {
      await applyPDFA3Compliance(pdfDoc, {
        title: 'Test Title',
        author: 'Test Author',
        subject: 'Test Subject',
        creator: 'Test Creator',
        keywords: ['test', 'keywords'],
      });

      const catalog = pdfDoc.catalog;
      const metadata = catalog.get(PDFName.of('Metadata'));

      expect(metadata).toBeDefined();
    });
  });

  describe('setupPDFA3Compliance', () => {
    let pdfDoc: PDFDocument;

    beforeEach(async () => {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
    });

    it('should be an alias for applyPDFA3Compliance', async () => {
      await setupPDFA3Compliance(pdfDoc, {
        title: 'Test Invoice',
      });

      const catalog = pdfDoc.catalog;
      const metadata = catalog.get(PDFName.of('Metadata'));
      const outputIntents = catalog.get(PDFName.of('OutputIntents'));

      expect(metadata).toBeDefined();
      expect(outputIntents).toBeDefined();
    });

    it('should set all PDF/A-3 requirements', async () => {
      await setupPDFA3Compliance(pdfDoc, {
        title: 'Test',
        author: 'Author',
      });

      const catalog = pdfDoc.catalog;

      // Check all required elements
      expect(catalog.get(PDFName.of('Metadata'))).toBeDefined();
      expect(catalog.get(PDFName.of('OutputIntents'))).toBeDefined();
      expect(catalog.get(PDFName.of('Version'))).toEqual(PDFName.of('1.7'));
      expect(pdfDoc.context.trailerInfo.ID).toBeDefined();
    });
  });

  describe('generatePDFFileID', () => {
    it('should generate MD5 hash from PDF bytes', () => {
      const { generatePDFFileID } = require('../../utils/PDFA3Compliance');
      const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const fileId = generatePDFFileID(testBytes);

      expect(fileId).toBeDefined();
      expect(typeof fileId).toBe('string');
      expect(fileId.length).toBe(32); // MD5 hash length
      expect(fileId).toMatch(/^[0-9A-F]+$/); // Uppercase hex
    });

    it('should generate consistent hash for same input', () => {
      const { generatePDFFileID } = require('../../utils/PDFA3Compliance');
      const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const fileId1 = generatePDFFileID(testBytes);
      const fileId2 = generatePDFFileID(testBytes);

      expect(fileId1).toBe(fileId2);
    });

    it('should generate different hashes for different inputs', () => {
      const { generatePDFFileID } = require('../../utils/PDFA3Compliance');
      const testBytes1 = new Uint8Array([1, 2, 3]);
      const testBytes2 = new Uint8Array([4, 5, 6]);
      const fileId1 = generatePDFFileID(testBytes1);
      const fileId2 = generatePDFFileID(testBytes2);

      expect(fileId1).not.toBe(fileId2);
    });
  });

  describe('addAFRelationshipToFile', () => {
    it('should add AFRelationship to file spec dict', async () => {
      const { addAFRelationshipToFile } = require('../../utils/PDFA3Compliance');
      const pdfDoc = await PDFDocument.create();
      const fileSpecDict = PDFDict.withContext(pdfDoc.context);

      addAFRelationshipToFile(fileSpecDict, 'Data');

      const afRelationship = fileSpecDict.get(PDFName.of('AFRelationship'));
      expect(afRelationship).toEqual(PDFName.of('Data'));
    });

    it('should default to "Data" relationship', async () => {
      const { addAFRelationshipToFile } = require('../../utils/PDFA3Compliance');
      const pdfDoc = await PDFDocument.create();
      const fileSpecDict = PDFDict.withContext(pdfDoc.context);

      addAFRelationshipToFile(fileSpecDict);

      const afRelationship = fileSpecDict.get(PDFName.of('AFRelationship'));
      expect(afRelationship).toEqual(PDFName.of('Data'));
    });

    it('should handle all relationship types', async () => {
      const { addAFRelationshipToFile } = require('../../utils/PDFA3Compliance');
      const relationships = ['Source', 'Data', 'Alternative', 'Supplement', 'Unspecified'];

      for (const rel of relationships) {
        const pdfDoc = await PDFDocument.create();
        const fileSpecDict = PDFDict.withContext(pdfDoc.context);
        addAFRelationshipToFile(fileSpecDict, rel as any);
        const afRelationship = fileSpecDict.get(PDFName.of('AFRelationship'));
        expect(afRelationship).toEqual(PDFName.of(rel));
      }
    });
  });

  describe('setPDFFileID', () => {
    it('should be a no-op function', async () => {
      const { setPDFFileID } = require('../../utils/PDFA3Compliance');
      const pdfDoc = await PDFDocument.create();

      // Should not throw
      expect(() => setPDFFileID(pdfDoc, 'test-id')).not.toThrow();
    });
  });

  describe('addFacturXAttachmentWithAFRelationship', () => {
    let pdfDoc: PDFDocument;

    beforeEach(async () => {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();
    });

    it('should attach file with AFRelationship', async () => {
      const { addFacturXAttachmentWithAFRelationship } = require('../../utils/PDFA3Compliance');
      const testData = Buffer.from('<?xml version="1.0"?><test>data</test>', 'utf-8');
      const fileName = 'factur-x.xml';

      await addFacturXAttachmentWithAFRelationship(pdfDoc, testData, fileName, {
        mimeType: 'text/xml',
        description: 'Test Factur-X XML',
      });

      const catalog = pdfDoc.catalog;
      const names = catalog.get(PDFName.of('Names'));
      expect(names).toBeDefined();
    });

    it('should create Names/EmbeddedFiles structure', async () => {
      const { addFacturXAttachmentWithAFRelationship } = require('../../utils/PDFA3Compliance');
      const testData = Buffer.from('test', 'utf-8');

      await addFacturXAttachmentWithAFRelationship(pdfDoc, testData, 'test.xml', {
        mimeType: 'text/xml',
      });

      const catalog = pdfDoc.catalog;
      const names = catalog.get(PDFName.of('Names')) as PDFDict;
      const embeddedFiles = names.get(PDFName.of('EmbeddedFiles'));

      expect(names).toBeDefined();
      expect(embeddedFiles).toBeDefined();
    });

    it('should add file to /AF array', async () => {
      const { addFacturXAttachmentWithAFRelationship } = require('../../utils/PDFA3Compliance');
      const testData = Buffer.from('test', 'utf-8');

      await addFacturXAttachmentWithAFRelationship(pdfDoc, testData, 'test.xml', {});

      const catalog = pdfDoc.catalog;
      const afArray = catalog.get(PDFName.of('AF'));

      expect(afArray).toBeDefined();
      expect(afArray).toBeInstanceOf(PDFArray);
    });

    it('should use default options', async () => {
      const { addFacturXAttachmentWithAFRelationship } = require('../../utils/PDFA3Compliance');
      const testData = Buffer.from('test', 'utf-8');

      await addFacturXAttachmentWithAFRelationship(pdfDoc, testData, 'test.xml', {});

      const catalog = pdfDoc.catalog;
      const afArray = catalog.get(PDFName.of('AF'));
      expect(afArray).toBeDefined();
    });

    it('should set file metadata dates', async () => {
      const { addFacturXAttachmentWithAFRelationship } = require('../../utils/PDFA3Compliance');
      const testData = Buffer.from('test', 'utf-8');
      const creationDate = new Date('2024-01-01');
      const modificationDate = new Date('2024-01-02');

      await addFacturXAttachmentWithAFRelationship(pdfDoc, testData, 'test.xml', {
        mimeType: 'text/xml',
        description: 'Test',
        creationDate,
        modificationDate,
      });

      const catalog = pdfDoc.catalog;
      const names = catalog.get(PDFName.of('Names'));
      expect(names).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should create fully compliant PDF/A-3 structure', async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage();

      // Apply all compliance measures
      await setupPDFA3Compliance(pdfDoc, {
        title: 'Test Invoice',
        author: 'Test Company',
        subject: 'Invoice 12345',
        keywords: ['Invoice', 'Test'],
      });

      const pdfBytes = await pdfDoc.save();
      const catalog = pdfDoc.catalog;

      // Verify all elements present
      expect(catalog.get(PDFName.of('Metadata'))).toBeDefined();
      expect(catalog.get(PDFName.of('OutputIntents'))).toBeDefined();
      expect(catalog.get(PDFName.of('Version'))).toEqual(PDFName.of('1.7'));
      expect(pdfDoc.context.trailerInfo.ID).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(1000); // Should be substantial
    });
  });
});
