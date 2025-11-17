import { AdditionalDocument } from '../AdditionalDocument';

describe('AdditionalDocument', () => {
  describe('constructor', () => {
    it('should create an instance with all required parameters', () => {
      const doc = new AdditionalDocument('130', 'PO-123', 'Purchase Order', '/path/to/file.pdf');

      expect(doc.documentTypeCode).toBe('130');
      expect(doc.id).toBe('PO-123');
      expect(doc.name).toBe('Purchase Order');
      expect(doc.attachmentPath).toBe('/path/to/file.pdf');
    });

    it('should create an instance with only required parameter', () => {
      const doc = new AdditionalDocument('916');

      expect(doc.documentTypeCode).toBe('916');
      expect(doc.id).toBeUndefined();
      expect(doc.name).toBeUndefined();
      expect(doc.attachmentPath).toBeUndefined();
    });

    it('should create an instance with partial parameters', () => {
      const doc = new AdditionalDocument('130', 'PO-456');

      expect(doc.documentTypeCode).toBe('130');
      expect(doc.id).toBe('PO-456');
      expect(doc.name).toBeUndefined();
      expect(doc.attachmentPath).toBeUndefined();
    });
  });

  describe('getDocumentDetails', () => {
    it('should return formatted details with all fields populated', () => {
      const doc = new AdditionalDocument('130', 'PO-789', 'Order Document', '/files/order.pdf');
      const details = doc.getDocumentDetails();

      expect(details).toBe('Type: 130, ID: PO-789, Name: Order Document, Attachment: /files/order.pdf');
    });

    it('should return formatted details with N/A for missing optional fields', () => {
      const doc = new AdditionalDocument('916');
      const details = doc.getDocumentDetails();

      expect(details).toBe('Type: 916, ID: N/A, Name: N/A, Attachment: None');
    });

    it('should return formatted details with partial fields', () => {
      const doc = new AdditionalDocument('130', 'PO-999', 'My Document');
      const details = doc.getDocumentDetails();

      expect(details).toBe('Type: 130, ID: PO-999, Name: My Document, Attachment: None');
    });
  });

  describe('isAttachmentPresent', () => {
    it('should return true when attachment path is provided', () => {
      const doc = new AdditionalDocument('130', 'PO-123', 'Order', '/path/to/file.pdf');

      expect(doc.isAttachmentPresent()).toBe(true);
    });

    it('should return false when attachment path is undefined', () => {
      const doc = new AdditionalDocument('130', 'PO-123', 'Order');

      expect(doc.isAttachmentPresent()).toBe(false);
    });

    it('should return false when attachment path is empty string', () => {
      const doc = new AdditionalDocument('130', 'PO-123', 'Order', '');

      expect(doc.isAttachmentPresent()).toBe(false);
    });

    it('should return true for non-empty attachment path', () => {
      const doc = new AdditionalDocument('130', undefined, undefined, 'file.pdf');

      expect(doc.isAttachmentPresent()).toBe(true);
    });
  });

  describe('getAttachmentPath', () => {
    it('should return the attachment path when it exists', () => {
      const doc = new AdditionalDocument('130', 'PO-123', 'Order', '/documents/file.pdf');

      expect(doc.getAttachmentPath()).toBe('/documents/file.pdf');
    });

    it('should return null when attachment path is undefined', () => {
      const doc = new AdditionalDocument('130', 'PO-123', 'Order');

      expect(doc.getAttachmentPath()).toBeNull();
    });

    it('should return null when attachment path is empty string (falsy)', () => {
      const doc = new AdditionalDocument('130', 'PO-123', 'Order', '');

      // Empty string is falsy, so the || operator returns null
      expect(doc.getAttachmentPath()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in fields', () => {
      const doc = new AdditionalDocument('130', 'PO-#123!', 'Order & Document', '/path/with spaces.pdf');

      expect(doc.id).toBe('PO-#123!');
      expect(doc.name).toBe('Order & Document');
      expect(doc.attachmentPath).toBe('/path/with spaces.pdf');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const doc = new AdditionalDocument('130', longString, longString, longString);

      expect(doc.id).toBe(longString);
      expect(doc.name).toBe(longString);
      expect(doc.attachmentPath).toBe(longString);
    });
  });
});
