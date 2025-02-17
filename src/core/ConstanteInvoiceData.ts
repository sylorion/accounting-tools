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
  BASIC: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer"
    ],
    forbiddenFields: [
      "deliveryParty",
      "docAllowanceCharges",
      "additionalDocs"
    ]
  },
  EN16931: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer"
    ],
    forbiddenFields: []
  },
  EXTENDED: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer"
    ],
    forbiddenFields: []
  }
};

