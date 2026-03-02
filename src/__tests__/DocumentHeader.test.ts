// src/__tests__/DocumentHeader.test.ts

import { DocumentHeader } from '../core/DocumentHeader';
import { DocTypeCode } from '../core/EnumInvoiceType';

describe('DocumentHeader', () => {
  describe('Constructor', () => {
    it('should create instance with all parameters', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-2025-001',
        'FACTURE',
        new Date('2025-01-15'),
        new Date('2025-01-15'),
        DocTypeCode.INVOICE,
        ['Note 1', 'Note 2']
      );

      expect(header.id).toBe('DOC-001');
      expect(header.invoiceNumber).toBe('FA-2025-001');
      expect(header.name).toBe('FACTURE');
      expect(header.invoiceDate).toEqual(new Date('2025-01-15'));
      expect(header.issueDate).toEqual(new Date('2025-01-15'));
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
      expect(header.notes).toEqual(['Note 1', 'Note 2']);
    });

    it('should use default values for optional parameters', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-2025-001',
        'FACTURE',
        new Date('2025-01-15')
      );

      expect(header.issueDate).toBeDefined();
      expect(header.issueDate).toBeInstanceOf(Date);
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
      expect(header.notes).toEqual([]);
    });

    it('should handle different document types', () => {
      const invoice = new DocumentHeader(
        'INV-001',
        'FA-001',
        'FACTURE',
        new Date(),
        new Date(),
        DocTypeCode.INVOICE
      );
      expect(invoice.typeCode).toBe(DocTypeCode.INVOICE);
      expect(invoice.typeCode).toBe('380');

      const creditNote = new DocumentHeader(
        'CN-001',
        'CN-001',
        'AVOIR',
        new Date(),
        new Date(),
        DocTypeCode.CREDIT_NOTE
      );
      expect(creditNote.typeCode).toBe(DocTypeCode.CREDIT_NOTE);
      expect(creditNote.typeCode).toBe('381');

      const proForma = new DocumentHeader(
        'DEV-001',
        'DEV-001',
        'DEVIS',
        new Date(),
        new Date(),
        DocTypeCode.PRO_FORMAT
      );
      expect(proForma.typeCode).toBe(DocTypeCode.PRO_FORMAT);
      expect(proForma.typeCode).toBe('384');
    });
  });

  describe('addNote', () => {
    it('should add a note to empty notes array', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        new Date()
      );

      header.addNote('First note');

      expect(header.notes).toHaveLength(1);
      expect(header.notes[0]).toBe('First note');
    });

    it('should add multiple notes', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        new Date()
      );

      header.addNote('Note 1');
      header.addNote('Note 2');
      header.addNote('Note 3');

      expect(header.notes).toHaveLength(3);
      expect(header.notes).toEqual(['Note 1', 'Note 2', 'Note 3']);
    });

    it('should add note to existing notes', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        new Date(),
        new Date(),
        DocTypeCode.INVOICE,
        ['Existing note']
      );

      header.addNote('New note');

      expect(header.notes).toHaveLength(2);
      expect(header.notes).toEqual(['Existing note', 'New note']);
    });

    it('should handle empty string notes', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        new Date()
      );

      header.addNote('');

      expect(header.notes).toHaveLength(1);
      expect(header.notes[0]).toBe('');
    });

    it('should handle long notes', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        new Date()
      );

      const longNote = 'A'.repeat(1000);
      header.addNote(longNote);

      expect(header.notes).toHaveLength(1);
      expect(header.notes[0]).toBe(longNote);
      expect(header.notes[0].length).toBe(1000);
    });
  });

  describe('Properties', () => {
    it('should allow reading all properties', () => {
      const invoiceDate = new Date('2025-01-15');
      const issueDate = new Date('2025-01-16');

      const header = new DocumentHeader(
        'DOC-001',
        'FA-2025-001',
        'FACTURE',
        invoiceDate,
        issueDate,
        DocTypeCode.INVOICE,
        ['Test note']
      );

      expect(header.id).toBe('DOC-001');
      expect(header.invoiceNumber).toBe('FA-2025-001');
      expect(header.name).toBe('FACTURE');
      expect(header.invoiceDate).toBe(invoiceDate);
      expect(header.issueDate).toBe(issueDate);
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
      expect(header.notes).toEqual(['Test note']);
    });

    it('should allow modifying properties', () => {
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        new Date()
      );

      header.id = 'DOC-002';
      header.invoiceNumber = 'FA-002';
      header.name = 'INVOICE';
      header.typeCode = DocTypeCode.CREDIT_NOTE;

      expect(header.id).toBe('DOC-002');
      expect(header.invoiceNumber).toBe('FA-002');
      expect(header.name).toBe('INVOICE');
      expect(header.typeCode).toBe(DocTypeCode.CREDIT_NOTE);
    });
  });

  describe('Date handling', () => {
    it('should handle same invoice and issue date', () => {
      const date = new Date('2025-01-15');
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        date,
        date
      );

      expect(header.invoiceDate).toBe(date);
      expect(header.issueDate).toBe(date);
    });

    it('should handle different invoice and issue dates', () => {
      const invoiceDate = new Date('2025-01-15');
      const issueDate = new Date('2025-01-20');

      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        invoiceDate,
        issueDate
      );

      expect(header.invoiceDate).toBe(invoiceDate);
      expect(header.issueDate).toBe(issueDate);
      expect(header.invoiceDate.getTime()).toBeLessThan(header.issueDate.getTime());
    });

    it('should handle current date as default issue date', () => {
      const before = Date.now();
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        new Date('2025-01-15')
      );
      const after = Date.now();

      expect(header.issueDate.getTime()).toBeGreaterThanOrEqual(before);
      expect(header.issueDate.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
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

    it('should handle special characters in strings', () => {
      const header = new DocumentHeader(
        'DOC-001-<>&"',
        'FA-2025-001/àéè',
        'FACTURE™',
        new Date()
      );

      expect(header.id).toBe('DOC-001-<>&"');
      expect(header.invoiceNumber).toBe('FA-2025-001/àéè');
      expect(header.name).toBe('FACTURE™');
    });

    it('should handle very long strings', () => {
      const longId = 'A'.repeat(1000);
      const header = new DocumentHeader(
        longId,
        'FA-001',
        'FACTURE',
        new Date()
      );

      expect(header.id).toBe(longId);
      expect(header.id.length).toBe(1000);
    });

    it('should handle past dates', () => {
      const pastDate = new Date('2020-01-01');
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        pastDate
      );

      expect(header.invoiceDate).toBe(pastDate);
    });

    it('should handle future dates', () => {
      const futureDate = new Date('2030-01-01');
      const header = new DocumentHeader(
        'DOC-001',
        'FA-001',
        'FACTURE',
        futureDate
      );

      expect(header.invoiceDate).toBe(futureDate);
    });
  });

  describe('Real-world scenarios', () => {
    it('should create invoice header', () => {
      const header = new DocumentHeader(
        'INT-2025-001',
        'FA-2025-001',
        'FACTURE',
        new Date('2025-01-15'),
        new Date('2025-01-15'),
        DocTypeCode.INVOICE
      );

      header.addNote('Paiement sous 30 jours fin de mois');
      header.addNote('Pénalités de retard : 3 fois le taux légal');

      expect(header.typeCode).toBe('380');
      expect(header.notes).toHaveLength(2);
    });

    it('should create quote header (pro forma)', () => {
      const header = new DocumentHeader(
        'DEV-2025-042',
        'DEVIS-2025-042',
        'DEVIS',
        new Date('2025-04-10'),
        new Date('2025-04-10'),
        DocTypeCode.PRO_FORMAT
      );

      header.addNote('Devis valable 30 jours à compter de la date d\'émission');
      header.addNote('Acompte de 30% à la commande');

      expect(header.typeCode).toBe('384');
      expect(header.notes).toHaveLength(2);
    });

    it('should create credit note header', () => {
      const header = new DocumentHeader(
        'AV-2025-001',
        'AVOIR-2025-001',
        'AVOIR',
        new Date('2025-02-01'),
        new Date('2025-02-01'),
        DocTypeCode.CREDIT_NOTE
      );

      header.addNote('Avoir relatif à la facture FA-2025-001');

      expect(header.typeCode).toBe('381');
      expect(header.notes[0]).toContain('FA-2025-001');
    });
  });
});
