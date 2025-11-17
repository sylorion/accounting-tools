import { PaymentDetails } from '../PaymentDetails';

describe('PaymentDetails', () => {
  describe('constructor', () => {
    it('should create an instance with all parameters', () => {
      const dueDate = new Date('2025-12-31');
      const payment = new PaymentDetails(
        '58',
        'FR7630006000011234567890189',
        'BNPAFRPPXXX',
        dueDate,
        'Payment within 30 days'
      );

      expect(payment.paymentMeansCode).toBe('58');
      expect(payment.payeeIBAN).toBe('FR7630006000011234567890189');
      expect(payment.payeeBIC).toBe('BNPAFRPPXXX');
      expect(payment.dueDate).toBe(dueDate);
      expect(payment.paymentTermsText).toBe('Payment within 30 days');
    });

    it('should create an instance with only required parameter', () => {
      const payment = new PaymentDetails('30');

      expect(payment.paymentMeansCode).toBe('30');
      expect(payment.payeeIBAN).toBeUndefined();
      expect(payment.payeeBIC).toBeUndefined();
      expect(payment.dueDate).toBeUndefined();
      expect(payment.paymentTermsText).toBeUndefined();
    });

    it('should create an instance with partial parameters', () => {
      const payment = new PaymentDetails('58', 'FR1234567890123456789');

      expect(payment.paymentMeansCode).toBe('58');
      expect(payment.payeeIBAN).toBe('FR1234567890123456789');
      expect(payment.payeeBIC).toBeUndefined();
    });

    it('should handle different payment means codes', () => {
      const codes = ['10', '20', '30', '48', '49', '58'];

      codes.forEach(code => {
        const payment = new PaymentDetails(code);
        expect(payment.paymentMeansCode).toBe(code);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const payment = new PaymentDetails('', '', '', undefined, '');

      expect(payment.paymentMeansCode).toBe('');
      expect(payment.payeeIBAN).toBe('');
      expect(payment.payeeBIC).toBe('');
      expect(payment.paymentTermsText).toBe('');
    });

    it('should handle special characters in IBAN and BIC', () => {
      const payment = new PaymentDetails(
        '58',
        'DE89370400440532013000',
        'COBADEFFXXX'
      );

      expect(payment.payeeIBAN).toBe('DE89370400440532013000');
      expect(payment.payeeBIC).toBe('COBADEFFXXX');
    });

    it('should handle future and past due dates', () => {
      const futureDate = new Date('2050-12-31');
      const pastDate = new Date('2000-01-01');

      const payment1 = new PaymentDetails('58', undefined, undefined, futureDate);
      const payment2 = new PaymentDetails('58', undefined, undefined, pastDate);

      expect(payment1.dueDate).toBe(futureDate);
      expect(payment2.dueDate).toBe(pastDate);
    });

    it('should handle very long payment terms text', () => {
      const longText = 'Payment terms: '.repeat(100);
      const payment = new PaymentDetails('58', undefined, undefined, undefined, longText);

      expect(payment.paymentTermsText).toBe(longText);
      expect(payment.paymentTermsText?.length).toBe(longText.length);
    });

    it('should preserve date object reference', () => {
      const dueDate = new Date('2025-06-15');
      const payment = new PaymentDetails('58', undefined, undefined, dueDate);

      expect(payment.dueDate).toBe(dueDate);
      expect(payment.dueDate?.getTime()).toBe(dueDate.getTime());
    });
  });

  describe('SEPA payment details', () => {
    it('should handle SEPA transfer details', () => {
      const payment = new PaymentDetails(
        '58',
        'FR7630001007941234567890185',
        'BNPAFRPPXXX',
        new Date('2025-12-01'),
        'SEPA transfer within 30 days'
      );

      expect(payment.paymentMeansCode).toBe('58');
      expect(payment.payeeIBAN).toContain('FR');
      expect(payment.payeeBIC).toContain('BNPAFRPP');
    });

    it('should handle international IBAN formats', () => {
      const ibans = [
        'GB82WEST12345698765432',
        'DE89370400440532013000',
        'IT60X0542811101000000123456',
        'ES9121000418450200051332'
      ];

      ibans.forEach(iban => {
        const payment = new PaymentDetails('58', iban);
        expect(payment.payeeIBAN).toBe(iban);
      });
    });
  });
});
