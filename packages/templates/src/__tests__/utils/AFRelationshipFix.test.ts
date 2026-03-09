/**
 * Tests for AFRelationshipFix module
 * Tests PDF/A-3 compliant file attachment with AFRelationship
 */

import { PDFDocument, PDFName, PDFArray, PDFDict, PDFString } from 'pdf-lib';
import { attachFileWithAFRelationship } from '../../utils/AFRelationshipFix';

describe('AFRelationshipFix', () => {
  let pdfDoc: PDFDocument;

  beforeEach(async () => {
    pdfDoc = await PDFDocument.create();
  });

  describe('attachFileWithAFRelationship', () => {
    it('should attach a file with AFRelationship', async () => {
      const testData = Buffer.from('<?xml version="1.0"?><test>data</test>', 'utf-8');
      const fileName = 'test.xml';

      const fileSpecRef = await attachFileWithAFRelationship(
        pdfDoc,
        testData,
        fileName,
        {
          mimeType: 'text/xml',
          description: 'Test XML',
          relationship: 'Data',
        }
      );

      expect(fileSpecRef).toBeDefined();
    });

    it('should create Names dictionary in catalog', async () => {
      const testData = Buffer.from('test data', 'utf-8');

      await attachFileWithAFRelationship(pdfDoc, testData, 'test.xml');

      const catalog = pdfDoc.catalog;
      const names = catalog.get(PDFName.of('Names'));

      expect(names).toBeDefined();
      expect(names).toBeInstanceOf(PDFDict);
    });

    it('should create EmbeddedFiles structure', async () => {
      const testData = Buffer.from('test data', 'utf-8');

      await attachFileWithAFRelationship(pdfDoc, testData, 'test.xml');

      const catalog = pdfDoc.catalog;
      const names = catalog.get(PDFName.of('Names')) as PDFDict;
      const embeddedFiles = names.get(PDFName.of('EmbeddedFiles'));

      expect(embeddedFiles).toBeDefined();
      expect(embeddedFiles).toBeInstanceOf(PDFDict);
    });

    it('should add file to Names array', async () => {
      const testData = Buffer.from('test data', 'utf-8');
      const fileName = 'test.xml';

      await attachFileWithAFRelationship(pdfDoc, testData, fileName);

      const catalog = pdfDoc.catalog;
      const names = catalog.get(PDFName.of('Names')) as PDFDict;
      const embeddedFiles = names.get(PDFName.of('EmbeddedFiles')) as PDFDict;
      const namesArray = embeddedFiles.get(PDFName.of('Names')) as PDFArray;

      expect(namesArray).toBeDefined();
      expect(namesArray.size()).toBeGreaterThanOrEqual(2);
    });

    it('should create /AF array in catalog', async () => {
      const testData = Buffer.from('test data', 'utf-8');

      await attachFileWithAFRelationship(pdfDoc, testData, 'test.xml');

      const catalog = pdfDoc.catalog;
      const afArray = catalog.get(PDFName.of('AF'));

      expect(afArray).toBeDefined();
      expect(afArray).toBeInstanceOf(PDFArray);
    });

    it('should add file spec to /AF array', async () => {
      const testData = Buffer.from('test data', 'utf-8');

      const fileSpecRef = await attachFileWithAFRelationship(pdfDoc, testData, 'test.xml');

      const catalog = pdfDoc.catalog;
      const afArray = catalog.get(PDFName.of('AF')) as PDFArray;

      expect(afArray.size()).toBe(1);
      expect(afArray.get(0)).toEqual(fileSpecRef);
    });

    it('should set AFRelationship on file spec', async () => {
      const testData = Buffer.from('test data', 'utf-8');

      const fileSpecRef = await attachFileWithAFRelationship(
        pdfDoc,
        testData,
        'test.xml',
        { relationship: 'Data' }
      );

      const fileSpec = pdfDoc.context.lookup(fileSpecRef) as PDFDict;
      const afRelationship = fileSpec.get(PDFName.of('AFRelationship'));

      expect(afRelationship).toBeDefined();
      expect(afRelationship).toEqual(PDFName.of('Data'));
    });

    it('should handle different relationship types', async () => {
      const testData = Buffer.from('test data', 'utf-8');
      const relationships: Array<'Source' | 'Data' | 'Alternative' | 'Supplement' | 'Unspecified'> = [
        'Source',
        'Data',
        'Alternative',
        'Supplement',
        'Unspecified',
      ];

      for (const rel of relationships) {
        const pdfDoc2 = await PDFDocument.create();
        const fileSpecRef = await attachFileWithAFRelationship(
          pdfDoc2,
          testData,
          'test.xml',
          { relationship: rel }
        );

        const fileSpec = pdfDoc2.context.lookup(fileSpecRef) as PDFDict;
        const afRelationship = fileSpec.get(PDFName.of('AFRelationship'));

        expect(afRelationship).toEqual(PDFName.of(rel));
      }
    });

    it('should handle Buffer and Uint8Array', async () => {
      const bufferData = Buffer.from('buffer data', 'utf-8');
      const uint8Data = new Uint8Array([1, 2, 3, 4, 5]);

      const ref1 = await attachFileWithAFRelationship(pdfDoc, bufferData, 'test1.xml');
      const ref2 = await attachFileWithAFRelationship(pdfDoc, uint8Data, 'test2.bin');

      expect(ref1).toBeDefined();
      expect(ref2).toBeDefined();
    });

    it('should set correct file metadata', async () => {
      const testData = Buffer.from('test data', 'utf-8');
      const fileName = 'test.xml';
      const description = 'Test Description';
      const mimeType = 'application/xml';
      const creationDate = new Date('2024-01-01');
      const modificationDate = new Date('2024-01-02');

      const fileSpecRef = await attachFileWithAFRelationship(
        pdfDoc,
        testData,
        fileName,
        {
          description,
          mimeType,
          creationDate,
          modificationDate,
        }
      );

      const fileSpec = pdfDoc.context.lookup(fileSpecRef) as PDFDict;
      const fName = fileSpec.get(PDFName.of('F'));
      const desc = fileSpec.get(PDFName.of('Desc'));

      expect(fName).toEqual(PDFString.of(fileName));
      expect(desc).toEqual(PDFString.of(description));
    });

    it('should allow multiple file attachments', async () => {
      const testData1 = Buffer.from('data1', 'utf-8');
      const testData2 = Buffer.from('data2', 'utf-8');
      const testData3 = Buffer.from('data3', 'utf-8');

      await attachFileWithAFRelationship(pdfDoc, testData1, 'file1.xml');
      await attachFileWithAFRelationship(pdfDoc, testData2, 'file2.xml');
      await attachFileWithAFRelationship(pdfDoc, testData3, 'file3.xml');

      const catalog = pdfDoc.catalog;
      const afArray = catalog.get(PDFName.of('AF')) as PDFArray;
      const names = catalog.get(PDFName.of('Names')) as PDFDict;
      const embeddedFiles = names.get(PDFName.of('EmbeddedFiles')) as PDFDict;
      const namesArray = embeddedFiles.get(PDFName.of('Names')) as PDFArray;

      expect(afArray.size()).toBe(3);
      expect(namesArray.size()).toBe(6); // 3 files * 2 entries (name + spec)
    });

    it('should generate valid PDF after attachment', async () => {
      const testData = Buffer.from('<?xml version="1.0"?><invoice></invoice>', 'utf-8');

      await attachFileWithAFRelationship(pdfDoc, testData, 'factur-x.xml', {
        mimeType: 'text/xml',
        description: 'Factur-X XML Invoice',
        relationship: 'Data',
      });

      const pdfBytes = await pdfDoc.save();

      expect(pdfBytes).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should use default values when options not provided', async () => {
      const testData = Buffer.from('test', 'utf-8');

      const fileSpecRef = await attachFileWithAFRelationship(pdfDoc, testData, 'test.xml');

      const fileSpec = pdfDoc.context.lookup(fileSpecRef) as PDFDict;
      const afRelationship = fileSpec.get(PDFName.of('AFRelationship'));

      expect(afRelationship).toEqual(PDFName.of('Data')); // default relationship
      expect(fileSpecRef).toBeDefined();
    });
  });
});
