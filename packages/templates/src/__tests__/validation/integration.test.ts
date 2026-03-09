/**
 * Integration tests for complete validation pipeline with external tools
 */

import {
  FacturXInvoice,
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
} from '@facturx/core';
import {
  ValidationPipeline,
} from '../../validation/ValidationPipeline';
import {
  checkExternalValidators,
} from '../../validation/ExternalValidators';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestInvoice(profile = FacturxProfile.EN16931): FacturXInvoice {
  return new FacturXInvoice(
    profile,
    {
      id: 'TEST-2024-001',
      invoiceNumber: 'TEST-2024-001',
      name: 'Test Invoice',
      invoiceDate: new Date('2024-01-15'),
      typeCode: DocTypeCode.INVOICE,
      notes: [
        { content: 'Indemnité forfaitaire pour frais de recouvrement : 40€', subjectCode: 'PMT' },
        { content: 'Taux de pénalités de retard : 3x le taux légal', subjectCode: 'PMD' },
        { content: 'Pas d\'escompte pour paiement anticipé', subjectCode: 'AAB' },
      ],
    },
    {
      name: 'Test Company SARL',
      address: {
        street: '123 Test Street',
        postalCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
      },
      vatId: 'FR12345678901',
      legalId: '123456789',
      legalIdScheme: '0002',
      electronicAddress: 'contact@testcompany.fr',
      electronicAddressScheme: 'EM',
    },
    {
      name: 'Client Test SAS',
      address: {
        street: '456 Client Avenue',
        postalCode: '69001',
        city: 'Lyon',
        countryCode: 'FR',
      },
      vatId: 'FR98765432109',
      legalId: '987654321',
      legalIdScheme: '0002',
      electronicAddress: 'client@test.fr',
      electronicAddressScheme: 'EM',
    },
    {
      meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
      iban: 'FR7630001007941234567890185',
      bic: 'BNPAFRPP',
      dueDate: new Date('2024-02-15'),
      termsDescription: 'Payment within 30 days',
    },
    [
      {
        id: '1',
        description: 'Consulting Service',
        quantity: 10,
        unitPrice: 100,
        vatRate: 0.20,
        taxCategoryCode: 'S',
        unitCode: 'HUR',
        lineTotal: 1000,
        allowances: [],
        charges: [],
      },
      {
        id: '2',
        description: 'Software License',
        quantity: 5,
        unitPrice: 200,
        vatRate: 0.20,
        taxCategoryCode: 'S',
        unitCode: 'C62',
        lineTotal: 1000,
        allowances: [],
        charges: [],
      },
    ],
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe('Validation Integration Tests', () => {
  let testInvoice: FacturXInvoice;

  beforeAll(() => {
    testInvoice = createTestInvoice();
  });

  describe('Internal Validation Pipeline', () => {
    test('should validate invoice before generation', async () => {
      const pipeline = new ValidationPipeline({
        enableRealXsdValidation: false, // skip real XSD in test (needs schema files)
      });
      const result = await pipeline.validateBeforeGeneration(testInvoice);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('validatedAt');
      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');

      expect(result.steps).toHaveProperty('profile');
      expect(result.steps).toHaveProperty('xsd');

      expect(result.summary).toHaveProperty('totalErrors');
      expect(result.summary).toHaveProperty('totalWarnings');
      expect(result.summary).toHaveProperty('stepsCompleted');
      expect(result.summary).toHaveProperty('stepsPassed');
      expect(result.summary).toHaveProperty('overallScore');
      expect(result.summary).toHaveProperty('complianceLevel');
    });

    test('should include business rule validation step', async () => {
      const pipeline = new ValidationPipeline({
        enableRealXsdValidation: false,
        enableBusinessRuleValidation: true,
        enableFrenchRules: true,
      });
      const result = await pipeline.validateBeforeGeneration(testInvoice);

      expect(result.steps).toHaveProperty('businessRules');
      if (result.steps.businessRules) {
        expect(result.steps.businessRules.name).toContain('Business Rule');
        expect(result.steps.businessRules).toHaveProperty('passed');
        expect(result.steps.businessRules).toHaveProperty('duration');
      }
    });

    test('should include code list validation step', async () => {
      const pipeline = new ValidationPipeline({
        enableRealXsdValidation: false,
        enableCodeListValidation: true,
      });
      const result = await pipeline.validateBeforeGeneration(testInvoice);

      expect(result.steps).toHaveProperty('codeLists');
      if (result.steps.codeLists) {
        expect(result.steps.codeLists.name).toContain('Code List');
        expect(result.steps.codeLists).toHaveProperty('passed');
      }
    });

    test('quick validation should be fast', async () => {
      const pipeline = new ValidationPipeline();
      const startTime = Date.now();
      const isValid = await pipeline.validateQuick(testInvoice);
      const duration = Date.now() - startTime;

      expect(typeof isValid).toBe('boolean');
      expect(duration).toBeLessThan(100);
    });
  });

  describe('External Validation', () => {
    let toolsAvailable: any;

    beforeAll(async () => {
      toolsAvailable = await checkExternalValidators();
    });

    test('should detect available external tools', async () => {
      expect(toolsAvailable).toHaveProperty('veraPDF');
      expect(toolsAvailable).toHaveProperty('mustangproject');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle disabled validation steps', async () => {
      const pipeline = new ValidationPipeline({
        enableProfileValidation: false,
        enableXsdValidation: false,
        enableRealXsdValidation: false,
        enableBusinessRuleValidation: false,
        enableCodeListValidation: false,
        enablePdfA3Validation: false,
        enableXmlAttachmentCheck: false,
        enableExternalValidation: false,
      });

      const result = await pipeline.validateBeforeGeneration(testInvoice);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    test('should generate XML without errors', () => {
      const xml = testInvoice.generateXml();

      expect(xml).toContain('urn:cen.eu:en16931:2017');
      expect(xml).toContain('SubjectCode');
      expect(xml).toContain('PMT');
      expect(xml).toContain('URIUniversalCommunication');
      expect(xml).toContain('SpecifiedLegalOrganization');
      expect(xml).toContain('schemeID="0002"');
      expect(xml).toContain('currencyID="EUR"');
      // AllowanceTotalAmount and ChargeTotalAmount are only emitted when > 0
      expect(xml).toContain('TaxBasisTotalAmount');
    });
  });
});
