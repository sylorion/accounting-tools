// src/core/PaymentDetails.ts

/** Informations de paiement simplifiées (code moyen, IBAN, etc.) */
export class PaymentDetails {
  constructor(
    public paymentMeansCode: string, // ex. "58" = virement SEPA
    public payeeIBAN?: string,
    public payeeBIC?: string,
    public dueDate?: Date,
    public paymentTermsText?: string
  ) {}
}
