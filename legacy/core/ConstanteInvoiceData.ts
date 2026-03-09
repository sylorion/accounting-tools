// /src/core

import { FacturxProfile } from './EnumInvoiceType'; // => À adapter selon votre arborescence

//------------------------------------
//  LOGIQUE DE PROFIL (BASIC, EN16931, EXTENDED)
//------------------------------------
export interface ProfileConstraints {
  mandatoryFields: string[];
  forbiddenFields: string[];
  optionalFields?: string[];
}
  export const PROFILE_POLICIES: Record<FacturxProfile, ProfileConstraints> = {
  MINIMUM: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer"
    ],
    forbiddenFields: [
      "deliveryParty",
      "payeeParty"
    ]
  },
  BASIC: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer",
      "lines"
    ],
    forbiddenFields: [
      "deliveryParty",
      "docAllowanceCharges",
      "additionalDocs"
    ]
  },
  BASICWL: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer",
      "lines",
      "payment"
    ],
    forbiddenFields: [
      "buyer.contact",
      "deliveryParty"
    ]
  },
  EN16931: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer",
      "lines",
      "payment"
    ],
    forbiddenFields: []
  },
  EXTENDED: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer", 
    ],
    forbiddenFields: []
  }
};
