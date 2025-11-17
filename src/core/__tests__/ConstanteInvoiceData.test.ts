import { PROFILE_POLICIES, ProfileConstraints } from '../ConstanteInvoiceData';
import { FacturxProfile } from '../EnumInvoiceType';

describe('ConstanteInvoiceData', () => {
  describe('PROFILE_POLICIES', () => {
    it('should contain all profile types', () => {
      expect(PROFILE_POLICIES).toHaveProperty(FacturxProfile.MINIMUM);
      expect(PROFILE_POLICIES).toHaveProperty(FacturxProfile.BASIC);
      expect(PROFILE_POLICIES).toHaveProperty(FacturxProfile.BASICWL);
      expect(PROFILE_POLICIES).toHaveProperty(FacturxProfile.EN16931);
      expect(PROFILE_POLICIES).toHaveProperty(FacturxProfile.EXTENDED);
    });

    it('should have correct structure for all profiles', () => {
      Object.values(FacturxProfile).forEach(profile => {
        const policy = PROFILE_POLICIES[profile];
        expect(policy).toBeDefined();
        expect(policy).toHaveProperty('mandatoryFields');
        expect(policy).toHaveProperty('forbiddenFields');
        expect(Array.isArray(policy.mandatoryFields)).toBe(true);
        expect(Array.isArray(policy.forbiddenFields)).toBe(true);
      });
    });
  });

  describe('MINIMUM profile', () => {
    const minimumPolicy = PROFILE_POLICIES[FacturxProfile.MINIMUM];

    it('should have required mandatory fields', () => {
      expect(minimumPolicy.mandatoryFields).toContain('header.invoiceNumber');
      expect(minimumPolicy.mandatoryFields).toContain('header.invoiceDate');
      expect(minimumPolicy.mandatoryFields).toContain('seller');
      expect(minimumPolicy.mandatoryFields).toContain('buyer');
      expect(minimumPolicy.mandatoryFields).toContain('monetary.totalAmount');
      expect(minimumPolicy.mandatoryFields.length).toBe(5);
    });

    it('should forbid complex fields', () => {
      expect(minimumPolicy.forbiddenFields).toContain('lines');
      expect(minimumPolicy.forbiddenFields).toContain('delivery');
      expect(minimumPolicy.forbiddenFields).toContain('paymentMeans');
      expect(minimumPolicy.forbiddenFields).toContain('taxes');
      expect(minimumPolicy.forbiddenFields.length).toBe(4);
    });
  });

  describe('BASIC profile', () => {
    const basicPolicy = PROFILE_POLICIES[FacturxProfile.BASIC];

    it('should have required mandatory fields', () => {
      expect(basicPolicy.mandatoryFields).toContain('header.invoiceNumber');
      expect(basicPolicy.mandatoryFields).toContain('header.invoiceDate');
      expect(basicPolicy.mandatoryFields).toContain('seller');
      expect(basicPolicy.mandatoryFields).toContain('buyer');
      expect(basicPolicy.mandatoryFields).toContain('lines');
      expect(basicPolicy.mandatoryFields.length).toBe(5);
    });

    it('should forbid specific fields', () => {
      expect(basicPolicy.forbiddenFields).toContain('deliveryParty');
      expect(basicPolicy.forbiddenFields).toContain('docAllowanceCharges');
      expect(basicPolicy.forbiddenFields).toContain('additionalDocs');
      expect(basicPolicy.forbiddenFields.length).toBe(3);
    });

    it('should allow lines unlike MINIMUM', () => {
      expect(basicPolicy.mandatoryFields).toContain('lines');
      expect(basicPolicy.forbiddenFields).not.toContain('lines');
    });
  });

  describe('BASICWL profile', () => {
    const basicwlPolicy = PROFILE_POLICIES[FacturxProfile.BASICWL];

    it('should have required mandatory fields', () => {
      expect(basicwlPolicy.mandatoryFields).toContain('header.invoiceNumber');
      expect(basicwlPolicy.mandatoryFields).toContain('header.invoiceDate');
      expect(basicwlPolicy.mandatoryFields).toContain('seller');
      expect(basicwlPolicy.mandatoryFields).toContain('buyer');
      expect(basicwlPolicy.mandatoryFields).toContain('lines');
      expect(basicwlPolicy.mandatoryFields.length).toBeGreaterThanOrEqual(5);
    });

    it('should forbid specific fields', () => {
      expect(basicwlPolicy.forbiddenFields).toContain('buyer.contact');
      expect(basicwlPolicy.forbiddenFields).toContain('deliveryParty');
      expect(basicwlPolicy.forbiddenFields.length).toBe(2);
    });

    it('should require more fields than BASIC', () => {
      expect(basicwlPolicy.mandatoryFields.length).toBeGreaterThan(
        PROFILE_POLICIES[FacturxProfile.BASIC].mandatoryFields.length
      );
    });
  });

  describe('EN16931 profile', () => {
    const en16931Policy = PROFILE_POLICIES[FacturxProfile.EN16931];

    it('should have comprehensive mandatory fields', () => {
      expect(en16931Policy.mandatoryFields).toContain('header.invoiceNumber');
      expect(en16931Policy.mandatoryFields).toContain('header.invoiceDate');
      expect(en16931Policy.mandatoryFields).toContain('seller');
      expect(en16931Policy.mandatoryFields).toContain('buyer');
      expect(en16931Policy.mandatoryFields).toContain('lines');
      expect(en16931Policy.mandatoryFields).toContain('payment');
      expect(en16931Policy.mandatoryFields).toContain('currency');
      expect(en16931Policy.mandatoryFields.length).toBe(7);
    });

    it('should have no forbidden fields', () => {
      expect(en16931Policy.forbiddenFields).toEqual([]);
      expect(en16931Policy.forbiddenFields.length).toBe(0);
    });

    it('should be the most restrictive in mandatory fields', () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASIC,
        FacturxProfile.BASICWL,
        FacturxProfile.EXTENDED
      ];

      profiles.forEach(profile => {
        expect(en16931Policy.mandatoryFields.length).toBeGreaterThanOrEqual(
          PROFILE_POLICIES[profile].mandatoryFields.length
        );
      });
    });
  });

  describe('EXTENDED profile', () => {
    const extendedPolicy = PROFILE_POLICIES[FacturxProfile.EXTENDED];

    it('should have minimal mandatory fields', () => {
      expect(extendedPolicy.mandatoryFields).toContain('header.invoiceNumber');
      expect(extendedPolicy.mandatoryFields).toContain('header.invoiceDate');
      expect(extendedPolicy.mandatoryFields).toContain('seller');
      expect(extendedPolicy.mandatoryFields).toContain('buyer');
      expect(extendedPolicy.mandatoryFields.length).toBe(4);
    });

    it('should have no forbidden fields', () => {
      expect(extendedPolicy.forbiddenFields).toEqual([]);
      expect(extendedPolicy.forbiddenFields.length).toBe(0);
    });

    it('should allow maximum flexibility', () => {
      expect(extendedPolicy.forbiddenFields.length).toBe(0);
    });
  });

  describe('profile comparisons', () => {
    it('should have MINIMUM with most forbidden fields', () => {
      const minimumForbidden = PROFILE_POLICIES[FacturxProfile.MINIMUM].forbiddenFields.length;
      const otherProfiles = [
        FacturxProfile.BASIC,
        FacturxProfile.BASICWL,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED
      ];

      otherProfiles.forEach(profile => {
        expect(minimumForbidden).toBeGreaterThanOrEqual(
          PROFILE_POLICIES[profile].forbiddenFields.length
        );
      });
    });

    it('should have EXTENDED and EN16931 with no forbidden fields', () => {
      expect(PROFILE_POLICIES[FacturxProfile.EXTENDED].forbiddenFields.length).toBe(0);
      expect(PROFILE_POLICIES[FacturxProfile.EN16931].forbiddenFields.length).toBe(0);
    });

    it('should have EN16931 with most mandatory fields', () => {
      const en16931Mandatory = PROFILE_POLICIES[FacturxProfile.EN16931].mandatoryFields.length;
      const otherProfiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASIC,
        FacturxProfile.BASICWL,
        FacturxProfile.EXTENDED
      ];

      otherProfiles.forEach(profile => {
        expect(en16931Mandatory).toBeGreaterThanOrEqual(
          PROFILE_POLICIES[profile].mandatoryFields.length
        );
      });
    });
  });

  describe('field naming conventions', () => {
    it('should use dot notation for nested fields', () => {
      Object.values(PROFILE_POLICIES).forEach(policy => {
        policy.mandatoryFields.forEach(field => {
          if (field.includes('.')) {
            const parts = field.split('.');
            expect(parts.length).toBeGreaterThanOrEqual(2);
          }
        });
      });
    });

    it('should not have duplicate mandatory fields within a profile', () => {
      Object.values(PROFILE_POLICIES).forEach(policy => {
        const uniqueFields = new Set(policy.mandatoryFields);
        expect(uniqueFields.size).toBe(policy.mandatoryFields.length);
      });
    });

    it('should not have duplicate forbidden fields within a profile', () => {
      Object.values(PROFILE_POLICIES).forEach(policy => {
        const uniqueFields = new Set(policy.forbiddenFields);
        expect(uniqueFields.size).toBe(policy.forbiddenFields.length);
      });
    });
  });

  describe('common mandatory fields', () => {
    it('should have header.invoiceNumber as mandatory in all profiles', () => {
      Object.values(FacturxProfile).forEach(profile => {
        expect(PROFILE_POLICIES[profile].mandatoryFields).toContain('header.invoiceNumber');
      });
    });

    it('should have header.invoiceDate as mandatory in all profiles', () => {
      Object.values(FacturxProfile).forEach(profile => {
        expect(PROFILE_POLICIES[profile].mandatoryFields).toContain('header.invoiceDate');
      });
    });

    it('should have seller as mandatory in all profiles', () => {
      Object.values(FacturxProfile).forEach(profile => {
        expect(PROFILE_POLICIES[profile].mandatoryFields).toContain('seller');
      });
    });

    it('should have buyer as mandatory in all profiles', () => {
      Object.values(FacturxProfile).forEach(profile => {
        expect(PROFILE_POLICIES[profile].mandatoryFields).toContain('buyer');
      });
    });
  });

  describe('ProfileConstraints interface', () => {
    it('should allow optional fields property', () => {
      const customConstraint: ProfileConstraints = {
        mandatoryFields: ['field1'],
        forbiddenFields: ['field2'],
        optionalFields: ['field3', 'field4']
      };

      expect(customConstraint.optionalFields).toBeDefined();
      expect(customConstraint.optionalFields?.length).toBe(2);
    });

    it('should work without optional fields property', () => {
      const customConstraint: ProfileConstraints = {
        mandatoryFields: ['field1'],
        forbiddenFields: ['field2']
      };

      expect(customConstraint.optionalFields).toBeUndefined();
    });
  });
});
