// Test script pour InvoiceTemplateFancy avec gestion multi-pages
import { InvoiceTemplateFancy } from './src/templates/InvoiceTemplateFancy';
import { InvoiceData } from './src/models/InvoiceData';
import { BaseInvoiceItem } from './src/models/BaseInvoiceItem';
import fs from 'fs';

// Créer une facture de test avec beaucoup d'items pour tester les pages multiples
const createTestInvoiceData = (): InvoiceData => {
  const items: BaseInvoiceItem[] = [];
  
  // Créer beaucoup d'items pour tester les pages multiples
  for (let i = 1; i <= 50; i++) {
    items.push({
      description: `Produit de test numéro ${i} - Description longue avec détails techniques et spécifications détaillées`,
      quantity: Math.floor(Math.random() * 10) + 1,
      unitPrice: Math.random() * 100 + 10,
      vatRate: 0.20
    });
  }
  
  return {
    invoiceNumber: 'FACT-2025-001',
    invoiceDate: new Date(),
    seller: {
      name: 'Ma Société SARL',
      street: '123 Rue de la Test',
      city: '75001 Paris',
      countryCode: 'FR',
      vatNumber: 'FR12345678901'
    },
    buyer: {
      name: 'Client Test SAS',
      street: '456 Avenue du Client',
      city: '69002 Lyon',
      countryCode: 'FR',
      vatNumber: 'FR98765432100'
    },
    items: items,
    currency: 'EUR',
    disclaimers: [
      'Paiement à 30 jours fin de mois.',
      'En cas de retard de paiement, des pénalités seront appliquées.',
      'Aucun escompte pour paiement anticipé.',
      'Réclamations à adresser dans les 8 jours.'
    ],
    notes: [
      'Merci de votre confiance !',
      'Facture générée automatiquement.'
    ]
  };
};

// Test de génération
async function testMultiPageGeneration() {
  console.log('🚀 Test de génération PDF multi-pages...');
  
  try {
    const invoiceData = createTestInvoiceData();
    console.log(`📄 Génération d'une facture avec ${invoiceData.items.length} lignes...`);
    
    // Utiliser directement le template fancy
    const template = new InvoiceTemplateFancy();
    
    // Valider les données
    if (!template.validate(invoiceData)) {
      throw new Error('Données de facture invalides');
    }
    
    const pdfBytes = await template.render(invoiceData);
    
    // Sauvegarder le PDF
    const outputPath = './test-multipage-invoice.pdf';
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ PDF généré avec succès : ${outputPath}`);
    console.log(`📊 Taille du fichier : ${Math.round(pdfBytes.length / 1024)} KB`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testMultiPageGeneration();
}
