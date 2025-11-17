import {
  FacturxProfile,
  DocTypeCode,
  LegalOrganizationScheme,
  TaxCategoryCode,
  ComplianceType
} from '../EnumInvoiceType';

describe('EnumInvoiceType', () => {
  describe('FacturxProfile', () => {
    it('should have all profile values', () => {
      expect(FacturxProfile.MINIMUM).toBe('MINIMUM');
      expect(FacturxProfile.BASIC).toBe('BASIC');
      expect(FacturxProfile.BASICWL).toBe('BASICWL');
      expect(FacturxProfile.EN16931).toBe('EN16931');
      expect(FacturxProfile.EXTENDED).toBe('EXTENDED');
    });

    it('should have 5 profiles', () => {
      const profiles = Object.values(FacturxProfile);
      expect(profiles.length).toBe(5);
    });
  });

  describe('DocTypeCode', () => {
    it('should have correct code values', () => {
      expect(DocTypeCode.INVOICE).toBe('380');
      expect(DocTypeCode.CREDIT_NOTE).toBe('381');
      expect(DocTypeCode.DEBIT_NOTE).toBe('382');
      expect(DocTypeCode.CORRECTION).toBe('383');
      expect(DocTypeCode.PRO_FORMAT).toBe('384');
      expect(DocTypeCode.ADVANCE_PAYMENT).toBe('385');
      expect(DocTypeCode.FINAL_INVOICE).toBe('386');
      expect(DocTypeCode.CREDIT_MEMO).toBe('387');
      expect(DocTypeCode.ADJUSTMENT_INVOICE).toBe('388');
    });

    it('should have all document types', () => {
      const types = Object.values(DocTypeCode);
      expect(types.length).toBe(9);
    });
  });

  describe('LegalOrganizationScheme', () => {
    it('should have correct scheme codes', () => {
      expect(LegalOrganizationScheme.SIRET_0002).toBe('0002');
      expect(LegalOrganizationScheme.INSEE_0004).toBe('0004');
      expect(LegalOrganizationScheme.EAN_0007).toBe('0007');
      expect(LegalOrganizationScheme.GLN_0088).toBe('0088');
      expect(LegalOrganizationScheme.DUNS_0106).toBe('0106');
      expect(LegalOrganizationScheme.OIN_0177).toBe('0177');
      expect(LegalOrganizationScheme.USTID_9906).toBe('9906');
      expect(LegalOrganizationScheme.STEUERNR_9907).toBe('9907');
    });

    it('should have all scheme types', () => {
      const schemes = Object.values(LegalOrganizationScheme);
      expect(schemes.length).toBe(8);
    });
  });

  describe('TaxCategoryCode', () => {
    it('should have correct category codes', () => {
      expect(TaxCategoryCode.STANDARD).toBe('S');
      expect(TaxCategoryCode.REDUCED).toBe('AA');
      expect(TaxCategoryCode.ZERO).toBe('Z');
      expect(TaxCategoryCode.EXEMPT).toBe('E');
      expect(TaxCategoryCode.REVERSE_CHARGE).toBe('AE');
      expect(TaxCategoryCode.OUT_OF_SCOPE).toBe('O');
      expect(TaxCategoryCode.EXPORT).toBe('G');
    });

    it('should have all tax categories', () => {
      const categories = Object.values(TaxCategoryCode);
      expect(categories.length).toBe(7);
    });
  });

  describe('ComplianceType', () => {
    it('should have compliance types', () => {
      expect(ComplianceType.FR_FACTUR_X).toBe('FR_FACTUR_X');
      expect(ComplianceType.GENERIC_UBL).toBe('GENERIC_UBL');
      expect(ComplianceType.OTHER_REGION).toBe('OTHER_REGION');
    });

    it('should have all compliance types', () => {
      const types = Object.values(ComplianceType);
      expect(types.length).toBe(3);
    });
  });

  describe('enum usage', () => {
    it('should use FacturxProfile in switch statement', () => {
      const getProfileName = (profile: FacturxProfile): string => {
        switch (profile) {
          case FacturxProfile.MINIMUM:
            return 'Minimum';
          case FacturxProfile.BASIC:
            return 'Basic';
          case FacturxProfile.BASICWL:
            return 'Basic WL';
          case FacturxProfile.EN16931:
            return 'EN16931';
          case FacturxProfile.EXTENDED:
            return 'Extended';
          default:
            return 'Unknown';
        }
      };

      expect(getProfileName(FacturxProfile.EN16931)).toBe('EN16931');
      expect(getProfileName(FacturxProfile.MINIMUM)).toBe('Minimum');
    });

    it('should use TaxCategoryCode correctly', () => {
      const isStandardTax = (code: TaxCategoryCode): boolean => {
        return code === TaxCategoryCode.STANDARD;
      };

      expect(isStandardTax(TaxCategoryCode.STANDARD)).toBe(true);
      expect(isStandardTax(TaxCategoryCode.ZERO)).toBe(false);
    });

    it('should compare DocTypeCode values', () => {
      expect(DocTypeCode.INVOICE).not.toBe(DocTypeCode.CREDIT_NOTE);
      expect(DocTypeCode.CREDIT_NOTE).toBe('381');
    });
  });
});
