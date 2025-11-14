// src/core/OrderxProfiles.ts

/**
 * Profils Order-X disponibles
 *
 * Order-X est basé sur le standard UN/CEFACT Cross Industry Order
 * et propose plusieurs profils selon le niveau de détail requis.
 *
 * @see https://www.fnfe-mpe.org/order-x/
 */
export enum OrderxProfiles {
  /**
   * BASIC - Profil de base pour commandes simples
   * Contient les informations minimales requises :
   * - Numéro de commande
   * - Date
   * - Parties (vendeur/acheteur)
   * - Lignes de commande basiques
   */
  BASIC = "BASIC",

  /**
   * COMFORT - Profil intermédiaire
   * Ajoute au profil BASIC :
   * - Détails de livraison
   * - Informations de paiement
   * - Dates de livraison souhaitées
   * - Remises/Frais au niveau document
   */
  COMFORT = "COMFORT",

  /**
   * EXTENDED - Profil complet
   * Contient tous les champs possibles :
   * - Tous les champs COMFORT
   * - Remises/Frais au niveau ligne
   * - Documents additionnels
   * - Informations logistiques détaillées
   * - Références croisées
   * - Conditions commerciales complètes
   */
  EXTENDED = "EXTENDED"
}

/**
 * Configuration des profils Order-X
 * Définit les contraintes et règles de validation pour chaque profil
 */
export interface OrderxProfileConfig {
  /** Nom du profil */
  profile: OrderxProfiles;

  /** URN du profil pour le XML */
  urn: string;

  /** Champs obligatoires pour ce profil */
  requiredFields: string[];

  /** Champs optionnels supportés */
  optionalFields: string[];

  /** Champs interdits pour ce profil */
  forbiddenFields: string[];

  /** Support des remises/frais au niveau ligne */
  supportsLineAllowances: boolean;

  /** Support des remises/frais au niveau document */
  supportsDocAllowances: boolean;

  /** Support des documents additionnels */
  supportsAdditionalDocuments: boolean;

  /** Support des informations de livraison détaillées */
  supportsDeliveryDetails: boolean;
}

/**
 * Configurations des profils Order-X
 */
export const ORDERX_PROFILE_CONFIGS: Record<OrderxProfiles, OrderxProfileConfig> = {
  [OrderxProfiles.BASIC]: {
    profile: OrderxProfiles.BASIC,
    urn: "urn:order-x.eu:1p0:basic#",
    requiredFields: [
      "orderNumber",
      "orderDate",
      "seller",
      "buyer",
      "currency",
      "items"
    ],
    optionalFields: [
      "notes",
      "disclaimers"
    ],
    forbiddenFields: [
      "lineAllowances",
      "docAllowances",
      "additionalDocuments",
      "deliveryDetails"
    ],
    supportsLineAllowances: false,
    supportsDocAllowances: false,
    supportsAdditionalDocuments: false,
    supportsDeliveryDetails: false
  },

  [OrderxProfiles.COMFORT]: {
    profile: OrderxProfiles.COMFORT,
    urn: "urn:order-x.eu:1p0:comfort#",
    requiredFields: [
      "orderNumber",
      "orderDate",
      "seller",
      "buyer",
      "currency",
      "items"
    ],
    optionalFields: [
      "notes",
      "disclaimers",
      "requestedDeliveryDate",
      "shippingAddress",
      "docAllowances",
      "paymentTerms"
    ],
    forbiddenFields: [
      "lineAllowances"
    ],
    supportsLineAllowances: false,
    supportsDocAllowances: true,
    supportsAdditionalDocuments: false,
    supportsDeliveryDetails: true
  },

  [OrderxProfiles.EXTENDED]: {
    profile: OrderxProfiles.EXTENDED,
    urn: "urn:order-x.eu:1p0:extended#",
    requiredFields: [
      "orderNumber",
      "orderDate",
      "seller",
      "buyer",
      "currency",
      "items"
    ],
    optionalFields: [
      "notes",
      "disclaimers",
      "requestedDeliveryDate",
      "shippingAddress",
      "docAllowances",
      "lineAllowances",
      "additionalDocuments",
      "paymentTerms",
      "deliveryDetails",
      "references"
    ],
    forbiddenFields: [],
    supportsLineAllowances: true,
    supportsDocAllowances: true,
    supportsAdditionalDocuments: true,
    supportsDeliveryDetails: true
  }
};

/**
 * Obtenir la configuration d'un profil Order-X
 * @param profile Le profil Order-X
 * @returns La configuration du profil
 */
export function getOrderxProfileConfig(profile: OrderxProfiles): OrderxProfileConfig {
  return ORDERX_PROFILE_CONFIGS[profile];
}

/**
 * Vérifier si un profil supporte une fonctionnalité
 * @param profile Le profil Order-X
 * @param feature La fonctionnalité à vérifier
 * @returns true si la fonctionnalité est supportée
 */
export function supportsFeature(
  profile: OrderxProfiles,
  feature: keyof Pick<OrderxProfileConfig,
    'supportsLineAllowances' |
    'supportsDocAllowances' |
    'supportsAdditionalDocuments' |
    'supportsDeliveryDetails'
  >
): boolean {
  const config = getOrderxProfileConfig(profile);
  return config[feature];
}

/**
 * Codes de type de commande Order-X
 * Basés sur UNTDID 1001
 */
export enum OrderTypeCode {
  /** Commande standard */
  ORDER = "220",

  /** Commande express */
  EXPRESS_ORDER = "221",

  /** Commande cadre */
  BLANKET_ORDER = "222",

  /** Appel de livraison */
  CALL_OFF_ORDER = "226",

  /** Commande de remplacement */
  REPLACEMENT_ORDER = "227",

  /** Devis/Pro forma */
  QUOTATION = "310"
}

/**
 * Priorités de commande
 */
export enum OrderPriority {
  /** Priorité basse */
  LOW = "5",

  /** Priorité normale */
  NORMAL = "3",

  /** Priorité haute */
  HIGH = "2",

  /** Urgente */
  URGENT = "1"
}

/**
 * Statuts de commande
 */
export enum OrderStatus {
  /** Brouillon */
  DRAFT = "1",

  /** Soumise */
  SUBMITTED = "2",

  /** Acceptée */
  ACCEPTED = "3",

  /** Rejetée */
  REJECTED = "4",

  /** En cours */
  IN_PROGRESS = "5",

  /** Complétée */
  COMPLETED = "6",

  /** Annulée */
  CANCELLED = "7"
}
