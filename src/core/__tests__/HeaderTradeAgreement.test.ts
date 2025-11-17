import { PostalAddress, TradeContact, TradeParty } from '../HeaderTradeAgreement';

describe('PostalAddress', () => {
  describe('constructor', () => {
    it('should create a postal address with all parameters', () => {
      const address = new PostalAddress(
        '123 Main Street',
        'Paris',
        '75001',
        'FR',
        'Building A'
      );

      expect(address.line1).toBe('123 Main Street');
      expect(address.city).toBe('Paris');
      expect(address.postalCode).toBe('75001');
      expect(address.countryCode).toBe('FR');
      expect(address.line2).toBe('Building A');
    });

    it('should create a postal address with default country code', () => {
      const address = new PostalAddress(
        '456 Rue de la Paix',
        'Lyon',
        '69001'
      );

      expect(address.line1).toBe('456 Rue de la Paix');
      expect(address.city).toBe('Lyon');
      expect(address.postalCode).toBe('69001');
      expect(address.countryCode).toBe('FR');
      expect(address.line2).toBeUndefined();
    });

    it('should handle different country codes', () => {
      const countries = ['FR', 'DE', 'GB', 'IT', 'ES', 'US'];

      countries.forEach(code => {
        const address = new PostalAddress('Street', 'City', '12345', code);
        expect(address.countryCode).toBe(code);
      });
    });

    it('should handle addresses with line2', () => {
      const address = new PostalAddress(
        'Main St',
        'Paris',
        '75001',
        'FR',
        'Apt 5B'
      );

      expect(address.line2).toBe('Apt 5B');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const address = new PostalAddress('', '', '', '');

      expect(address.line1).toBe('');
      expect(address.city).toBe('');
      expect(address.postalCode).toBe('');
      expect(address.countryCode).toBe('');
    });

    it('should handle special characters', () => {
      const address = new PostalAddress(
        '123 Rue de l\'Église',
        'Saint-Étienne',
        '42000',
        'FR',
        'Bât. C - 3ème étage'
      );

      expect(address.line1).toContain("l'Église");
      expect(address.city).toBe('Saint-Étienne');
      expect(address.line2).toContain('3ème');
    });
  });
});

describe('TradeContact', () => {
  describe('constructor', () => {
    it('should create a contact with all parameters', () => {
      const contact = new TradeContact(
        'John Doe',
        'john@example.com',
        '+33 1 23 45 67 89',
        'Sales Department'
      );

      expect(contact.contactName).toBe('John Doe');
      expect(contact.contactEmail).toBe('john@example.com');
      expect(contact.contactPhoneNumber).toBe('+33 1 23 45 67 89');
      expect(contact.divisionName).toBe('Sales Department');
    });

    it('should create a contact with only name', () => {
      const contact = new TradeContact('Jane Smith');

      expect(contact.contactName).toBe('Jane Smith');
      expect(contact.contactEmail).toBeUndefined();
      expect(contact.contactPhoneNumber).toBeUndefined();
      expect(contact.divisionName).toBeUndefined();
    });
  });

  describe('getFullContactInfo', () => {
    it('should return formatted info with all fields', () => {
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
      const contact = new TradeContact('Jane Doe');
      const info = contact.getFullContactInfo();

      expect(info).toContain('Jane Doe');
      expect(info).not.toContain('undefined');
    });

    it('should format with division name', () => {
      const contact = new TradeContact(
        'Bob Smith',
        'bob@example.com',
        '+1234567890',
        'IT Department'
      );

      const info = contact.getFullContactInfo();

      expect(info).toContain('(IT Department)');
    });

    it('should handle empty strings gracefully', () => {
      const contact = new TradeContact('', '', '', '');
      const info = contact.getFullContactInfo();

      expect(typeof info).toBe('string');
    });
  });

  describe('hasValidEmailForm', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'first.last+tag@example.org',
        'a@b.c'
      ];

      validEmails.forEach(email => {
        const contact = new TradeContact('Name', email);
        expect(contact.hasValidEmailForm()).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        ''
      ];

      invalidEmails.forEach(email => {
        const contact = new TradeContact('Name', email);
        expect(contact.hasValidEmailForm()).toBe(false);
      });
    });

    it('should return false when email is undefined', () => {
      const contact = new TradeContact('Name');

      expect(contact.hasValidEmailForm()).toBe(false);
    });

    it('should handle complex but valid email formats', () => {
      const contact = new TradeContact('Name', 'user+tag@sub.example.co.uk');

      expect(contact.hasValidEmailForm()).toBe(true);
    });
  });

  describe('hasValidPhoneNumberForm', () => {
    it('should return true for valid phone numbers', () => {
      const validPhones = [
        '+33123456789',
        '+1-555-123-4567',
        '01 23 45 67 89',
        '+44 (0)20 7123 4567',
        '123456789',
        '+49 30 12345678'
      ];

      validPhones.forEach(phone => {
        const contact = new TradeContact('Name', undefined, phone);
        expect(contact.hasValidPhoneNumberForm()).toBe(true);
      });
    });

    it('should return false for invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        'phone',
        '+33 abc',
        '123@456'
      ];

      invalidPhones.forEach(phone => {
        const contact = new TradeContact('Name', undefined, phone);
        expect(contact.hasValidPhoneNumberForm()).toBe(false);
      });
    });

    it('should return false when phone is undefined', () => {
      const contact = new TradeContact('Name');

      expect(contact.hasValidPhoneNumberForm()).toBe(false);
    });

    it('should handle international formats', () => {
      const contact = new TradeContact('Name', undefined, '+1 (555) 123-4567');

      expect(contact.hasValidPhoneNumberForm()).toBe(true);
    });

    it('should accept empty string and return false', () => {
      const contact = new TradeContact('Name', undefined, '');

      expect(contact.hasValidPhoneNumberForm()).toBe(false);
    });
  });
});

describe('TradeParty', () => {
  describe('constructor', () => {
    it('should create a trade party with all parameters', () => {
      const address = new PostalAddress('123 Main St', 'Paris', '75001', 'FR');
      const contacts = [
        new TradeContact('John', 'john@example.com'),
        new TradeContact('Jane', 'jane@example.com')
      ];

      const party = new TradeParty(
        'ACME Corp',
        address,
        'FR12345678901',
        'SIRET123456789',
        'info@acme.com',
        '+33123456789',
        contacts
      );

      expect(party.name).toBe('ACME Corp');
      expect(party.postalAddress).toBe(address);
      expect(party.vatNumber).toBe('FR12345678901');
      expect(party.registrationNumber).toBe('SIRET123456789');
      expect(party.electronicAddress).toBe('info@acme.com');
      expect(party.phone).toBe('+33123456789');
      expect(party.contacts).toEqual(contacts);
    });

    it('should create a trade party with minimal parameters', () => {
      const address = new PostalAddress('Street', 'City', '12345');

      const party = new TradeParty('Company Name', address);

      expect(party.name).toBe('Company Name');
      expect(party.postalAddress).toBe(address);
      expect(party.vatNumber).toBeUndefined();
      expect(party.registrationNumber).toBeUndefined();
      expect(party.electronicAddress).toBeUndefined();
      expect(party.phone).toBeUndefined();
      expect(party.contacts).toEqual([]);
    });

    it('should initialize with empty contacts array by default', () => {
      const address = new PostalAddress('Street', 'City', '12345');
      const party = new TradeParty('Company', address);

      expect(Array.isArray(party.contacts)).toBe(true);
      expect(party.contacts.length).toBe(0);
    });
  });

  describe('addContact', () => {
    it('should add a contact to empty contacts array', () => {
      const address = new PostalAddress('Street', 'City', '12345');
      const party = new TradeParty('Company', address);
      const contact = new TradeContact('John Doe', 'john@example.com');

      party.addContact(contact);

      expect(party.contacts.length).toBe(1);
      expect(party.contacts[0]).toBe(contact);
    });

    it('should add multiple contacts', () => {
      const address = new PostalAddress('Street', 'City', '12345');
      const party = new TradeParty('Company', address);

      const contact1 = new TradeContact('Alice', 'alice@example.com');
      const contact2 = new TradeContact('Bob', 'bob@example.com');
      const contact3 = new TradeContact('Charlie', 'charlie@example.com');

      party.addContact(contact1);
      party.addContact(contact2);
      party.addContact(contact3);

      expect(party.contacts.length).toBe(3);
      expect(party.contacts).toContain(contact1);
      expect(party.contacts).toContain(contact2);
      expect(party.contacts).toContain(contact3);
    });

    it('should preserve order of added contacts', () => {
      const address = new PostalAddress('Street', 'City', '12345');
      const party = new TradeParty('Company', address);

      const contacts = [
        new TradeContact('First', 'first@example.com'),
        new TradeContact('Second', 'second@example.com'),
        new TradeContact('Third', 'third@example.com')
      ];

      contacts.forEach(c => party.addContact(c));

      expect(party.contacts[0].contactName).toBe('First');
      expect(party.contacts[1].contactName).toBe('Second');
      expect(party.contacts[2].contactName).toBe('Third');
    });

    it('should add contacts to existing contacts array', () => {
      const address = new PostalAddress('Street', 'City', '12345');
      const initialContact = new TradeContact('Initial', 'initial@example.com');
      const party = new TradeParty('Company', address, undefined, undefined, undefined, undefined, [initialContact]);

      const newContact = new TradeContact('New', 'new@example.com');
      party.addContact(newContact);

      expect(party.contacts.length).toBe(2);
      expect(party.contacts[0]).toBe(initialContact);
      expect(party.contacts[1]).toBe(newContact);
    });
  });

  describe('VAT and registration numbers', () => {
    it('should handle French VAT numbers', () => {
      const address = new PostalAddress('Street', 'City', '75001', 'FR');
      const party = new TradeParty('Company', address, 'FR12345678901');

      expect(party.vatNumber).toBe('FR12345678901');
    });

    it('should handle different EU VAT number formats', () => {
      const vatNumbers = [
        'DE123456789',
        'GB123456789',
        'IT12345678901',
        'ES12345678901'
      ];

      vatNumbers.forEach(vat => {
        const address = new PostalAddress('Street', 'City', '12345');
        const party = new TradeParty('Company', address, vat);

        expect(party.vatNumber).toBe(vat);
      });
    });

    it('should handle SIRET numbers', () => {
      const address = new PostalAddress('Street', 'City', '75001', 'FR');
      const party = new TradeParty(
        'Company',
        address,
        'FR12345678901',
        '12345678901234'
      );

      expect(party.registrationNumber).toBe('12345678901234');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const address = new PostalAddress('', '', '');
      const party = new TradeParty('', address, '', '', '', '');

      expect(party.name).toBe('');
      expect(party.vatNumber).toBe('');
      expect(party.registrationNumber).toBe('');
      expect(party.electronicAddress).toBe('');
      expect(party.phone).toBe('');
    });

    it('should handle special characters in company name', () => {
      const address = new PostalAddress('Street', 'City', '12345');
      const party = new TradeParty('ACME & Co. (France) S.A.R.L.', address);

      expect(party.name).toBe('ACME & Co. (France) S.A.R.L.');
    });

    it('should handle multiple contacts with same information', () => {
      const address = new PostalAddress('Street', 'City', '12345');
      const party = new TradeParty('Company', address);

      const contact1 = new TradeContact('Same Name', 'same@example.com');
      const contact2 = new TradeContact('Same Name', 'same@example.com');

      party.addContact(contact1);
      party.addContact(contact2);

      expect(party.contacts.length).toBe(2);
    });
  });

  describe('complete business scenarios', () => {
    it('should represent a complete seller entity', () => {
      const address = new PostalAddress(
        '10 Rue de Commerce',
        'Paris',
        '75001',
        'FR',
        'Bâtiment A'
      );

      const salesContact = new TradeContact(
        'Marie Dupont',
        'marie.dupont@company.fr',
        '+33 1 23 45 67 89',
        'Service Commercial'
      );

      const seller = new TradeParty(
        'Ma Société SARL',
        address,
        'FR12345678901',
        '12345678901234',
        'contact@company.fr',
        '+33 1 23 45 67 90'
      );

      seller.addContact(salesContact);

      expect(seller.name).toBe('Ma Société SARL');
      expect(seller.vatNumber).toBe('FR12345678901');
      expect(seller.contacts.length).toBe(1);
      expect(seller.contacts[0].hasValidEmailForm()).toBe(true);
    });

    it('should represent a complete buyer entity', () => {
      const address = new PostalAddress(
        '50 Avenue des Clients',
        'Lyon',
        '69001',
        'FR'
      );

      const buyer = new TradeParty(
        'Client Corp',
        address,
        'FR98765432109',
        undefined,
        'achat@client.fr'
      );

      expect(buyer.name).toBe('Client Corp');
      expect(buyer.vatNumber).toBe('FR98765432109');
      expect(buyer.electronicAddress).toBe('achat@client.fr');
    });
  });
});
