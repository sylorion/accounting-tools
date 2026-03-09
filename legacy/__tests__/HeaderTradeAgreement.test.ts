// src/__tests__/HeaderTradeAgreement.test.ts

import { PostalAddress, TradeContact, TradeParty } from '../core/HeaderTradeAgreement';

describe('PostalAddress', () => {
  describe('Constructor', () => {
    it('should create address with required parameters', () => {
      const address = new PostalAddress(
        '123 Main Street',
        'Paris',
        '75001',
        'FR'
      );

      expect(address.line1).toBe('123 Main Street');
      expect(address.city).toBe('Paris');
      expect(address.postalCode).toBe('75001');
      expect(address.countryCode).toBe('FR');
    });

    it('should use "FR" as default country code', () => {
      const address = new PostalAddress(
        '123 Main Street',
        'Paris',
        '75001'
      );

      expect(address.countryCode).toBe('FR');
    });

    it('should accept line2 parameter', () => {
      const address = new PostalAddress(
        '123 Main Street',
        'Paris',
        '75001',
        'FR',
        'Building A, Floor 3'
      );

      expect(address.line2).toBe('Building A, Floor 3');
    });

    it('should allow undefined line2', () => {
      const address = new PostalAddress(
        '123 Main Street',
        'Paris',
        '75001',
        'FR'
      );

      expect(address.line2).toBeUndefined();
    });
  });

  describe('Different countries', () => {
    it('should handle French address', () => {
      const address = new PostalAddress(
        '45 Avenue des Champs-Élysées',
        'Paris',
        '75008',
        'FR'
      );

      expect(address.countryCode).toBe('FR');
    });

    it('should handle German address', () => {
      const address = new PostalAddress(
        'Unter den Linden 1',
        'Berlin',
        '10117',
        'DE'
      );

      expect(address.countryCode).toBe('DE');
    });

    it('should handle US address', () => {
      const address = new PostalAddress(
        '1600 Pennsylvania Avenue NW',
        'Washington',
        '20500',
        'US'
      );

      expect(address.countryCode).toBe('US');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      const address = new PostalAddress('', '', '', '');
      expect(address.line1).toBe('');
      expect(address.city).toBe('');
      expect(address.postalCode).toBe('');
      expect(address.countryCode).toBe('');
    });

    it('should handle special characters', () => {
      const address = new PostalAddress(
        "123 Rue de l'Église",
        'Saint-Étienne',
        '42000',
        'FR',
        'Bâtiment A'
      );

      expect(address.line1).toContain("l'");
      expect(address.city).toContain('É');
      expect(address.line2).toContain('â');
    });

    it('should handle very long address', () => {
      const longAddress = 'A'.repeat(500);
      const address = new PostalAddress(longAddress, 'Paris', '75001', 'FR');
      expect(address.line1.length).toBe(500);
    });
  });
});

describe('TradeContact', () => {
  describe('Constructor', () => {
    it('should create contact with name only', () => {
      const contact = new TradeContact('John Doe');
      expect(contact.contactName).toBe('John Doe');
      expect(contact.contactEmail).toBeUndefined();
      expect(contact.contactPhoneNumber).toBeUndefined();
      expect(contact.divisionName).toBeUndefined();
    });

    it('should create contact with all parameters', () => {
      const contact = new TradeContact(
        'John Doe',
        'john.doe@example.com',
        '+33 1 23 45 67 89',
        'Sales Department'
      );

      expect(contact.contactName).toBe('John Doe');
      expect(contact.contactEmail).toBe('john.doe@example.com');
      expect(contact.contactPhoneNumber).toBe('+33 1 23 45 67 89');
      expect(contact.divisionName).toBe('Sales Department');
    });
  });

  describe('getFullContactInfo', () => {
    it('should return full info with all fields', () => {
      const contact = new TradeContact(
        'John Doe',
        'john@example.com',
        '+33123456789',
        'Sales'
      );

      const info = contact.getFullContactInfo();
      expect(info).toContain('John Doe');
      expect(info).toContain('Sales');
      expect(info).toContain('+33123456789');
      expect(info).toContain('john@example.com');
    });

    it('should handle missing optional fields', () => {
      const contact = new TradeContact('John Doe');
      const info = contact.getFullContactInfo();
      expect(info).toContain('John Doe');
    });

    it('should handle missing division name', () => {
      const contact = new TradeContact(
        'John Doe',
        'john@example.com',
        '+33123456789'
      );

      const info = contact.getFullContactInfo();
      expect(info).not.toContain('()');
    });
  });

  describe('hasValidEmailForm', () => {
    it('should validate correct email', () => {
      const contact = new TradeContact('John', 'john@example.com');
      expect(contact.hasValidEmailForm()).toBe(true);
    });

    it('should validate email with subdomain', () => {
      const contact = new TradeContact('John', 'john@mail.example.com');
      expect(contact.hasValidEmailForm()).toBe(true);
    });

    it('should validate email with numbers', () => {
      const contact = new TradeContact('John', 'john123@example.com');
      expect(contact.hasValidEmailForm()).toBe(true);
    });

    it('should reject invalid email - no @', () => {
      const contact = new TradeContact('John', 'johnexample.com');
      expect(contact.hasValidEmailForm()).toBe(false);
    });

    it('should reject invalid email - no domain', () => {
      const contact = new TradeContact('John', 'john@');
      expect(contact.hasValidEmailForm()).toBe(false);
    });

    it('should reject invalid email - no TLD', () => {
      const contact = new TradeContact('John', 'john@example');
      expect(contact.hasValidEmailForm()).toBe(false);
    });

    it('should return false when email is undefined', () => {
      const contact = new TradeContact('John');
      expect(contact.hasValidEmailForm()).toBe(false);
    });

    it('should reject email with spaces', () => {
      const contact = new TradeContact('John', 'john doe@example.com');
      expect(contact.hasValidEmailForm()).toBe(false);
    });
  });

  describe('hasValidPhoneNumberForm', () => {
    it('should validate French phone number', () => {
      const contact = new TradeContact('John', undefined, '+33 1 23 45 67 89');
      expect(contact.hasValidPhoneNumberForm()).toBe(true);
    });

    it('should validate international format', () => {
      const contact = new TradeContact('John', undefined, '+1-555-123-4567');
      expect(contact.hasValidPhoneNumberForm()).toBe(true);
    });

    it('should validate phone with parentheses', () => {
      const contact = new TradeContact('John', undefined, '(01) 23 45 67 89');
      expect(contact.hasValidPhoneNumberForm()).toBe(true);
    });

    it('should validate plain numbers', () => {
      const contact = new TradeContact('John', undefined, '0123456789');
      expect(contact.hasValidPhoneNumberForm()).toBe(true);
    });

    it('should reject phone with letters', () => {
      const contact = new TradeContact('John', undefined, '01-ABC-DEFG');
      expect(contact.hasValidPhoneNumberForm()).toBe(false);
    });

    it('should reject phone with special chars', () => {
      const contact = new TradeContact('John', undefined, '01.23.45.67.89');
      expect(contact.hasValidPhoneNumberForm()).toBe(false);
    });

    it('should return false when phone is undefined', () => {
      const contact = new TradeContact('John');
      expect(contact.hasValidPhoneNumberForm()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty name', () => {
      const contact = new TradeContact('');
      expect(contact.contactName).toBe('');
    });

    it('should handle special characters in name', () => {
      const contact = new TradeContact('François-José María');
      expect(contact.contactName).toBe('François-José María');
    });

    it('should handle very long name', () => {
      const longName = 'A'.repeat(500);
      const contact = new TradeContact(longName);
      expect(contact.contactName.length).toBe(500);
    });
  });
});

describe('TradeParty', () => {
  describe('Constructor', () => {
    it('should create party with minimal parameters', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('My Company', address);

      expect(party.name).toBe('My Company');
      expect(party.postalAddress).toBe(address);
      expect(party.vatNumber).toBeUndefined();
      expect(party.contacts).toEqual([]);
    });

    it('should create party with all parameters', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const contact = new TradeContact('John Doe', 'john@example.com');

      const party = new TradeParty(
        'My Company SAS',
        address,
        'FR12345678901',
        'SIRET123456789',
        'contact@mycompany.com',
        '+33 1 23 45 67 89',
        [contact]
      );

      expect(party.name).toBe('My Company SAS');
      expect(party.postalAddress).toBe(address);
      expect(party.vatNumber).toBe('FR12345678901');
      expect(party.registrationNumber).toBe('SIRET123456789');
      expect(party.electronicAddress).toBe('contact@mycompany.com');
      expect(party.phone).toBe('+33 1 23 45 67 89');
      expect(party.contacts).toHaveLength(1);
      expect(party.contacts[0]).toBe(contact);
    });
  });

  describe('addContact method', () => {
    it('should add contact to empty contacts array', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('My Company', address);

      const contact = new TradeContact('John Doe', 'john@example.com');
      party.addContact(contact);

      expect(party.contacts).toHaveLength(1);
      expect(party.contacts[0]).toBe(contact);
    });

    it('should add multiple contacts', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('My Company', address);

      const contact1 = new TradeContact('John Doe', 'john@example.com');
      const contact2 = new TradeContact('Jane Smith', 'jane@example.com');
      const contact3 = new TradeContact('Bob Johnson', 'bob@example.com');

      party.addContact(contact1);
      party.addContact(contact2);
      party.addContact(contact3);

      expect(party.contacts).toHaveLength(3);
      expect(party.contacts[0]).toBe(contact1);
      expect(party.contacts[1]).toBe(contact2);
      expect(party.contacts[2]).toBe(contact3);
    });

    it('should add contact to existing contacts', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const existingContact = new TradeContact('Existing', 'existing@example.com');
      const party = new TradeParty(
        'My Company',
        address,
        undefined,
        undefined,
        undefined,
        undefined,
        [existingContact]
      );

      const newContact = new TradeContact('New', 'new@example.com');
      party.addContact(newContact);

      expect(party.contacts).toHaveLength(2);
      expect(party.contacts[0]).toBe(existingContact);
      expect(party.contacts[1]).toBe(newContact);
    });
  });

  describe('VAT number', () => {
    it('should handle French VAT number', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('My Company', address, 'FR12345678901');
      expect(party.vatNumber).toBe('FR12345678901');
    });

    it('should handle German VAT number', () => {
      const address = new PostalAddress('Street 1', 'Berlin', '10117', 'DE');
      const party = new TradeParty('My Company', address, 'DE123456789');
      expect(party.vatNumber).toBe('DE123456789');
    });

    it('should allow undefined VAT number', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('My Company', address);
      expect(party.vatNumber).toBeUndefined();
    });
  });

  describe('Real-world scenarios', () => {
    it('should create seller party', () => {
      const address = new PostalAddress(
        '123 Boulevard de la République',
        'Paris',
        '75010',
        'FR',
        'Bâtiment A'
      );

      const contact = new TradeContact(
        'Jean Dupont',
        'facturation@mycompany.fr',
        '+33 1 23 45 67 89',
        'Service Facturation'
      );

      const seller = new TradeParty(
        'My Company SAS',
        address,
        'FR12345678901',
        'SIRET 123 456 789 00012',
        'contact@mycompany.fr',
        '+33 1 23 45 67 89',
        [contact]
      );

      expect(seller.name).toBe('My Company SAS');
      expect(seller.vatNumber).toBe('FR12345678901');
      expect(seller.contacts).toHaveLength(1);
      expect(seller.contacts[0].contactName).toBe('Jean Dupont');
    });

    it('should create buyer party', () => {
      const address = new PostalAddress(
        '45 Avenue des Clients',
        'Lyon',
        '69001',
        'FR',
        'Étage 3'
      );

      const contact = new TradeContact(
        'Marie Martin',
        'achats@client.fr',
        '+33 4 56 78 90 12',
        'Service Achats'
      );

      const buyer = new TradeParty(
        'Client ABC SARL',
        address,
        'FR98765432100',
        undefined,
        'info@client.fr',
        '+33 4 56 78 90 12',
        [contact]
      );

      expect(buyer.name).toBe('Client ABC SARL');
      expect(buyer.vatNumber).toBe('FR98765432100');
      expect(buyer.contacts).toHaveLength(1);
    });

    it('should create party with multiple contacts', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('Large Company', address);

      party.addContact(new TradeContact('Sales', 'sales@company.com', '+33100000001', 'Sales'));
      party.addContact(new TradeContact('Support', 'support@company.com', '+33100000002', 'Support'));
      party.addContact(new TradeContact('Finance', 'finance@company.com', '+33100000003', 'Finance'));

      expect(party.contacts).toHaveLength(3);
      expect(party.contacts[0].divisionName).toBe('Sales');
      expect(party.contacts[1].divisionName).toBe('Support');
      expect(party.contacts[2].divisionName).toBe('Finance');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty company name', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('', address);
      expect(party.name).toBe('');
    });

    it('should handle special characters in company name', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('Société "L\'Innovation" & Co.', address);
      expect(party.name).toContain('"');
      expect(party.name).toContain("'");
      expect(party.name).toContain('&');
    });

    it('should handle very long company name', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const longName = 'A'.repeat(500);
      const party = new TradeParty(longName, address);
      expect(party.name.length).toBe(500);
    });
  });

  describe('Property modification', () => {
    it('should allow modifying properties', () => {
      const address = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const party = new TradeParty('My Company', address);

      party.name = 'Updated Company';
      party.vatNumber = 'FR99999999999';
      party.phone = '+33999999999';

      expect(party.name).toBe('Updated Company');
      expect(party.vatNumber).toBe('FR99999999999');
      expect(party.phone).toBe('+33999999999');
    });
  });
});
