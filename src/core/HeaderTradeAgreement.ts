// src/core/HeaderTradeAgreement.ts

/** Adresse postale de base */
export class PostalAddress {
  constructor(
    public line1: string,
    public city: string,
    public postalCode: string,
    public countryCode: string = "FR",
    public line2?: string
  ) {}
}

export class TradeContact {
  constructor(
    public contactName: string,
    public contactEmail?: string,
    public contactPhoneNumber?: string,
    public divisionName?: string,
  ) {}

  /** getFullContactInfo */
  getFullContactInfo(): string {
    return `${this.contactName || ''} ${this.divisionName ?  '(' + this.divisionName + ')' : ''}, ${this.contactPhoneNumber || ''}, ${this.contactEmail || ''}`.trim();
  }

  /** Returns a boolean indicating if the contact has a valid email address */
  hasValidEmailForm(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.contactEmail ? emailPattern.test(this.contactEmail) : false;
  }

  /** Returns a boolean indicating if the contact has a valid phone number */
  hasValidPhoneNumberForm(): boolean {
    const phonePattern = /^[0-9+\-\s()]*$/;
    return this.contactPhoneNumber ? phonePattern.test(this.contactPhoneNumber) : false;
  }
}

/** Partie (vendeur, acheteur) : nom + adresse, vatNumber éventuel */
export class TradeParty {
  constructor(
    public name: string,
    public postalAddress: PostalAddress,
    public vatNumber?: string,
    public contacts: TradeContact[] = []
  ) {}

  /** Add a new contact */
  addContact(contact: TradeContact): void {
    this.contacts.push(contact);
  }
}
