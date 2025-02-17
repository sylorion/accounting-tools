// src/core/AdditionalDocument.ts

// Classe Document additionnel (références supplémentaires, pièces jointes)
export class AdditionalDocument {
  constructor(
    public documentTypeCode: string,   // ex: "130" (order), "916" (supporting document)
    public id?: string,                // identifiant du document (e.g., numéro de commande)
    public name?: string,              // nom du document
    public attachmentPath?: string     // chemin ou référence de la pièce jointe si applicable
  ) {}

  public getDocumentDetails(): string {
    return `Type: ${this.documentTypeCode}, ID: ${this.id || 'N/A'}, Name: ${this.name || 'N/A'}, Attachment: ${this.attachmentPath || 'None'}`;
  }

  public isAttachmentPresent(): boolean {
    return !!this.attachmentPath;
  }
  
  public getAttachmentPath(): string | null {
    return this.attachmentPath || null;
  }
}
