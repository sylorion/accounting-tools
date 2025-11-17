import { DocumentHeader } from '../DocumentHeader';
import { DocTypeCode } from '../EnumInvoiceType';

describe('DocumentHeader', () => {
  describe('constructor', () => {
    it('should create a header with all required parameters', () => {
      const invoiceDate = new Date('2025-01-15');
      const issueDate = new Date('2025-01-16');

      const header = new DocumentHeader(
        'DOC-2025-001',
        'INV-001',
        'FACTURE',
        invoiceDate,
        issueDate,
        DocTypeCode.INVOICE,
        ['Note 1', 'Note 2']
      );

      expect(header.id).toBe('DOC-2025-001');
      expect(header.invoiceNumber).toBe('INV-001');
      expect(header.name).toBe('FACTURE');
      expect(header.invoiceDate).toBe(invoiceDate);
      expect(header.issueDate).toBe(issueDate);
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
      expect(header.notes).toEqual(['Note 1', 'Note 2']);
    });

    it('should create a header with default values', () => {
      const invoiceDate = new Date('2025-01-15');

      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        invoiceDate
      );

      expect(header.id).toBe('DOC-001');
      expect(header.invoiceNumber).toBe('INV-001');
      expect(header.name).toBe('FACTURE');
      expect(header.invoiceDate).toBe(invoiceDate);
      expect(header.issueDate).toBeInstanceOf(Date);
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
      expect(header.notes).toEqual([]);
    });

    it('should handle different document type codes', () => {
      const invoiceDate = new Date('2025-01-15');
      const typeCodes = [
        DocTypeCode.INVOICE,
        DocTypeCode.CREDIT_NOTE,
        DocTypeCode.DEBIT_NOTE,
        DocTypeCode.CORRECTION,
        DocTypeCode.PRO_FORMAT
      ];

      typeCodes.forEach(typeCode => {
        const header = new DocumentHeader(
          'DOC-001',
          'INV-001',
          'Document',
          invoiceDate,
          new Date(),
          typeCode
        );

        expect(header.typeCode).toBe(typeCode);
      });
    });

    it('should preserve date objects', () => {
      const invoiceDate = new Date('2025-06-15T10:30:00');
      const issueDate = new Date('2025-06-16T14:45:00');

      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        invoiceDate,
        issueDate
      );

      expect(header.invoiceDate.getTime()).toBe(invoiceDate.getTime());
      expect(header.issueDate.getTime()).toBe(issueDate.getTime());
    });
  });

  describe('addNote', () => {
    it('should add a single note to empty notes array', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        new Date()
      );

      header.addNote('First note');

      expect(header.notes).toEqual(['First note']);
      expect(header.notes.length).toBe(1);
    });

    it('should add multiple notes sequentially', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        new Date()
      );

      header.addNote('First note');
      header.addNote('Second note');
      header.addNote('Third note');

      expect(header.notes).toEqual(['First note', 'Second note', 'Third note']);
      expect(header.notes.length).toBe(3);
    });

    it('should preserve order of added notes', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        new Date()
      );

      const notes = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
      notes.forEach(note => header.addNote(note));

      expect(header.notes).toEqual(notes);
    });

    it('should add notes to existing notes array', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        new Date(),
        new Date(),
        DocTypeCode.INVOICE,
        ['Initial note']
      );

      header.addNote('Additional note');

      expect(header.notes).toEqual(['Initial note', 'Additional note']);
      expect(header.notes.length).toBe(2);
    });

    it('should handle empty string notes', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        new Date()
      );

      header.addNote('');
      header.addNote('Valid note');
      header.addNote('');

      expect(header.notes).toEqual(['', 'Valid note', '']);
      expect(header.notes.length).toBe(3);
    });

    it('should handle notes with special characters', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        new Date()
      );

      const specialNote = 'Note with special chars: €, £, ¥, @, #, &';
      header.addNote(specialNote);

      expect(header.notes).toContain(specialNote);
    });

    it('should handle very long notes', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        new Date()
      );

      const longNote = 'x'.repeat(10000);
      header.addNote(longNote);

      expect(header.notes[0]).toBe(longNote);
      expect(header.notes[0].length).toBe(10000);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for id and invoiceNumber', () => {
      const header = new DocumentHeader(
        '',
        '',
        '',
        new Date()
      );

      expect(header.id).toBe('');
      expect(header.invoiceNumber).toBe('');
      expect(header.name).toBe('');
    });

    it('should handle special characters in document identifiers', () => {
      const header = new DocumentHeader(
        'DOC-2025/001-A',
        'INV#123-B',
        'FACTURE & AVOIR',
        new Date()
      );

      expect(header.id).toBe('DOC-2025/001-A');
      expect(header.invoiceNumber).toBe('INV#123-B');
      expect(header.name).toBe('FACTURE & AVOIR');
    });

    it('should handle invoice date before issue date', () => {
      const invoiceDate = new Date('2025-01-01');
      const issueDate = new Date('2025-01-15');

      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        invoiceDate,
        issueDate
      );

      expect(header.invoiceDate.getTime()).toBeLessThan(header.issueDate.getTime());
    });

    it('should handle invoice date after issue date', () => {
      const invoiceDate = new Date('2025-01-15');
      const issueDate = new Date('2025-01-01');

      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        invoiceDate,
        issueDate
      );

      expect(header.invoiceDate.getTime()).toBeGreaterThan(header.issueDate.getTime());
    });

    it('should handle same invoice and issue dates', () => {
      const sameDate = new Date('2025-01-15');

      const header = new DocumentHeader(
        'DOC-001',
        'INV-001',
        'FACTURE',
        sameDate,
        sameDate
      );

      expect(header.invoiceDate).toBe(sameDate);
      expect(header.issueDate).toBe(sameDate);
    });
  });
});
