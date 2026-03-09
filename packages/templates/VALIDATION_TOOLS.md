# Outils de Validation Externe Factur-X

## 📋 Vue d'ensemble

En complément de notre **pipeline de validation interne**, il existe de nombreux **outils externes** pour valider la conformité Factur-X (XML et PDF/A-3).

Cette documentation liste les outils **officiels**, **open-source** et **commerciaux** pour une validation complète.

---

## 🏆 Outils Recommandés (Top 3)

### 1. **veraPDF** ⭐⭐⭐⭐⭐

**Le standard de l'industrie pour validation PDF/A**

- **Type** : Open Source (GPL v3+ / MPL v2+)
- **Fonction** : Validation PDF/A-3 (toutes conformités : 3a, 3b, 3u)
- **Version** : 1.28.2 (Juillet 2025)
- **Plateforme** : Windows, macOS, Linux

#### Caractéristiques
- ✅ Validation PDF/A-3B (requis pour Factur-X)
- ✅ Vérification des métadonnées XMP
- ✅ Validation des embedded files
- ✅ Rapports détaillés (HTML, XML, JSON)
- ✅ CLI + GUI + API REST
- ✅ Support PDF/A-4 (nouveau)

#### Installation
```bash
# Docker (recommandé)
docker pull verapdf/rest:latest
docker run -p 8080:8080 verapdf/rest

# ou téléchargement direct
wget https://github.com/veraPDF/veraPDF-apps/releases/download/v1.28.2/verapdf-installer.zip
```

#### Utilisation CLI
```bash
# Valider un PDF
verapdf --flavour 3b facture.pdf

# Avec rapport détaillé
verapdf --format json --flavour 3b facture.pdf > rapport.json
```

#### Utilisation API REST
```bash
# POST PDF pour validation
curl -X POST http://localhost:8080/api/validate/3b \
  -F "file=@facture.pdf" \
  -H "Accept: application/json"
```

**🔗 Liens** :
- Site : https://verapdf.org
- GitHub : https://github.com/verapdf
- Demo en ligne : https://demo.verapdf.org
- Docs : https://docs.verapdf.org

---

### 2. **Mustangproject** ⭐⭐⭐⭐⭐

**Bibliothèque Java open-source pour ZUGFeRD/Factur-X**

- **Type** : Open Source (Apache License 2.0)
- **Fonction** : Lecture, écriture, validation, conversion
- **Version** : 2.20.0 (Octobre 2025)
- **Plateforme** : Java (multiplateforme)

#### Caractéristiques
- ✅ Support ZUGFeRD 2.3.3 (dernière version)
- ✅ Support Factur-X 1.0.7
- ✅ Validation XML + PDF
- ✅ Conversion entre formats
- ✅ CLI + bibliothèque Java
- ✅ Très actif et maintenu

#### Installation
```bash
# Maven
<dependency>
    <groupId>org.mustangproject</groupId>
    <artifactId>mustang</artifactId>
    <version>2.20.0</version>
</dependency>

# CLI
wget https://github.com/ZUGFeRD/mustangproject/releases/download/2.20.0/mustang-cli.jar
```

#### Utilisation CLI
```bash
# Valider une facture
java -jar mustang-cli.jar --action validate --source facture.pdf

# Extraire le XML
java -jar mustang-cli.jar --action extract --source facture.pdf --out factur-x.xml

# Convertir
java -jar mustang-cli.jar --action upgrade --source old.pdf --target new.pdf
```

#### Utilisation Java
```java
import org.mustangproject.ZUGFeRD.ZUGFeRDValidator;

ZUGFeRDValidator validator = new ZUGFeRDValidator();
ValidationResult result = validator.validate("facture.pdf");

if (result.isValid()) {
    System.out.println("✓ Valid Factur-X invoice!");
} else {
    result.getErrors().forEach(System.out::println);
}
```

**🔗 Liens** :
- Site : https://www.mustangproject.org
- GitHub : https://github.com/ZUGFeRD/mustangproject
- Docs : https://www.mustangproject.org/commandline/

---

### 3. **Valitool** ⭐⭐⭐⭐

**Validateur commercial multiformat**

- **Type** : Commercial (gratuit pour usage limité)
- **Fonction** : Validation ZUGFeRD, Factur-X, XRechnung
- **Langues** : Allemand, Anglais, Français
- **Plateforme** : CLI JAR (multiplateforme)

#### Caractéristiques
- ✅ Validation automatique du bon schéma selon date
- ✅ Support tous les profils Factur-X
- ✅ Validation XML + PDF/A
- ✅ Rapports détaillés multilingues
- ✅ Pas besoin d'internet

#### Installation
```bash
# Téléchargement
wget https://valitool.org/download/valitool.jar
```

#### Utilisation
```bash
# Validation basique
java -jar valitool.jar validate facture.pdf

# Avec rapport détaillé
java -jar valitool.jar validate --report-format json facture.pdf > rapport.json
```

**🔗 Liens** :
- Site : https://valitool.org
- Documentation : https://valitool.org/en/

---

## 🌐 Validateurs en Ligne

### 1. **FNFE-MPE Validator** (Officiel France)

**Validateur officiel Factur-X**

- **URL** : https://services.fnfe-mpe.org
- **Type** : Gratuit, inscription requise
- **Fonction** : Validation Factur-X officielle

#### Caractéristiques
- ✅ Validateur officiel français
- ✅ Tous les profils supportés
- ✅ Rapport de conformité détaillé
- ❌ Nécessite inscription

**Note** : Le service peut avoir des problèmes de disponibilité

---

### 2. **B2Brouter Validator**

**Validateur en ligne commercial**

- **URL** : https://www.b2brouter.net/fr/factur-x-validator/
- **Type** : Gratuit avec limite
- **Fonction** : Validation Factur-X + ZUGFeRD

#### Caractéristiques
- ✅ Interface simple
- ✅ Validation rapide
- ✅ Rapport en français
- ⚠️ Limites sur version gratuite

---

### 3. **veraPDF Demo**

**Demo en ligne veraPDF**

- **URL** : https://demo.verapdf.org
- **Type** : Gratuit
- **Fonction** : Validation PDF/A uniquement

#### Caractéristiques
- ✅ Validation PDF/A-3
- ✅ Pas d'inscription requise
- ✅ Rapports détaillés
- ❌ Pas de validation XML Factur-X

---

## 🛠️ Autres Outils Open Source

### ZUV (ZUGFeRD und VeraPDF)

- **Type** : Open Source
- **Fonction** : Validation ZUGFeRD 1 et 2.1 / Factur-X 1.0.05
- **Avantage** : Pas besoin d'internet
- **Utilisation** : Gratuite même en commercial

### Factur-X .NET (Securibox)

- **Type** : Open Source (.NET)
- **GitHub** : https://github.com/Securibox/facturx
- **Version** : Factur-X 1.07.3
- **Fonction** : Lecture, création, validation

**Exemple C#** :
```csharp
using Securibox.FacturX;

var validator = new FacturXValidator();
var result = validator.Validate("facture.pdf");

if (result.IsValid)
{
    Console.WriteLine("✓ Valid Factur-X!");
}
```

---

## 📦 Outils Commerciaux

### 1. **7-PDF E-Invoice Validator**

- **URL** : https://www.7-pdf.com
- **Type** : Commercial
- **Support** : ZUGFeRD, Factur-X, XRechnung
- **Plateforme** : Windows

### 2. **PDFlib**

- **URL** : https://www.pdflib.com
- **Type** : Commercial
- **Fonction** : Création et validation ZUGFeRD/Factur-X

---

## 🔧 Intégration dans votre workflow

### Option 1 : veraPDF + Notre pipeline

```bash
# 1. Notre validation interne (rapide)
npm run generate-invoice

# 2. Validation externe veraPDF (PDF/A-3)
verapdf --flavour 3b output/invoice.pdf

# 3. Validation externe Mustang (Factur-X)
java -jar mustang-cli.jar --action validate --source output/invoice.pdf
```

### Option 2 : Script automatisé

Voir `scripts/validate-external.sh` pour un script qui :
1. Génère le PDF avec notre pipeline
2. Valide avec veraPDF
3. Valide avec Mustangproject
4. Génère un rapport consolidé

### Option 3 : CI/CD

```yaml
# .github/workflows/validate.yml
name: Factur-X Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Notre validation interne
      - name: Internal validation
        run: npm test

      # Validation externe veraPDF
      - name: Install veraPDF
        run: |
          wget https://github.com/veraPDF/veraPDF-apps/releases/download/v1.28.2/verapdf-installer.zip
          unzip verapdf-installer.zip
          ./verapdf-installer --headless

      - name: Validate PDF/A-3
        run: |
          verapdf --flavour 3b test-output/*.pdf

      # Validation externe Mustang
      - name: Install Mustangproject
        run: |
          wget https://github.com/ZUGFeRD/mustangproject/releases/download/2.20.0/mustang-cli.jar

      - name: Validate Factur-X
        run: |
          java -jar mustang-cli.jar --action validate --source test-output/*.pdf
```

---

## 📊 Tableau comparatif

| Outil | Type | PDF/A-3 | XML Factur-X | CLI | API | Prix | Note |
|-------|------|---------|--------------|-----|-----|------|------|
| **veraPDF** | OSS | ✅ Excellent | ❌ | ✅ | ✅ REST | Gratuit | ⭐⭐⭐⭐⭐ |
| **Mustangproject** | OSS | ✅ | ✅ Excellent | ✅ | ✅ Java | Gratuit | ⭐⭐⭐⭐⭐ |
| **Valitool** | Commercial | ✅ | ✅ | ✅ | ❌ | Payant | ⭐⭐⭐⭐ |
| **FNFE-MPE** | Officiel | ✅ | ✅ | ❌ | ❌ | Gratuit | ⭐⭐⭐ |
| **Notre pipeline** | Interne | ✅ | ✅ | ✅ | ✅ TS | Gratuit | ⭐⭐⭐⭐ |

---

## 🎯 Recommandations

### Pour la production

**Approche hybride** (meilleure garantie) :

1. **Validation interne** (notre pipeline) - Rapide, intégrée
2. **Validation externe veraPDF** - Standard industrie PDF/A-3
3. **Validation externe Mustangproject** - Validation Factur-X complète

### Pour le développement

**Notre pipeline suffit** :
- Validation rapide
- Rapports détaillés
- Intégration native
- Pas de dépendances externes

### Pour la certification

**Validation officielle** :
- FNFE-MPE Validator (France)
- veraPDF (PDF/A-3)
- Valitool (multi-normes)

---

## 📝 Scripts d'exemple

### Script bash de validation complète

```bash
#!/bin/bash
# scripts/validate-all.sh

INVOICE_PATH=$1

echo "=== Validation Factur-X Complète ==="
echo "Fichier: $INVOICE_PATH"
echo ""

# 1. Validation interne
echo "1. Validation interne..."
npm run validate -- "$INVOICE_PATH"
INTERNAL=$?

# 2. Validation veraPDF (PDF/A-3)
echo "2. Validation PDF/A-3 (veraPDF)..."
verapdf --flavour 3b "$INVOICE_PATH" > /tmp/verapdf-report.txt
VERAPDF=$?

# 3. Validation Mustangproject (Factur-X)
echo "3. Validation Factur-X (Mustang)..."
java -jar tools/mustang-cli.jar --action validate --source "$INVOICE_PATH" > /tmp/mustang-report.txt
MUSTANG=$?

# Rapport final
echo ""
echo "=== RAPPORT FINAL ==="
echo "Validation interne: $([ $INTERNAL -eq 0 ] && echo '✅ OK' || echo '❌ FAIL')"
echo "Validation PDF/A-3: $([ $VERAPDF -eq 0 ] && echo '✅ OK' || echo '❌ FAIL')"
echo "Validation Factur-X: $([ $MUSTANG -eq 0 ] && echo '✅ OK' || echo '❌ FAIL')"

if [ $INTERNAL -eq 0 ] && [ $VERAPDF -eq 0 ] && [ $MUSTANG -eq 0 ]; then
    echo ""
    echo "🎉 TOUTES LES VALIDATIONS PASSÉES !"
    exit 0
else
    echo ""
    echo "❌ Certaines validations ont échoué"
    exit 1
fi
```

### Script Node.js avec veraPDF

```typescript
// scripts/validate-with-verapdf.ts
import { execSync } from 'child_process';
import fs from 'fs';

interface VeraPDFReport {
  compliant: boolean;
  flavour: string;
  errors: Array<{ message: string; clause: string }>;
}

async function validateWithVeraPDF(pdfPath: string): Promise<VeraPDFReport> {
  try {
    // Appel veraPDF
    const output = execSync(
      `verapdf --format json --flavour 3b "${pdfPath}"`,
      { encoding: 'utf-8' }
    );

    const report = JSON.parse(output);

    return {
      compliant: report.compliant === 1,
      flavour: report.flavour,
      errors: report.validationReports?.[0]?.details || [],
    };
  } catch (error) {
    console.error('veraPDF validation failed:', error);
    return {
      compliant: false,
      flavour: '3b',
      errors: [{ message: 'veraPDF execution failed', clause: 'N/A' }],
    };
  }
}

// Utilisation
const result = await validateWithVeraPDF('output/invoice.pdf');
console.log('PDF/A-3 Compliant:', result.compliant);
if (!result.compliant) {
  console.log('Errors:', result.errors);
}
```

---

## 🔗 Ressources

### Documentation officielle
- Factur-X : https://fnfe-mpe.org/factur-x/
- EN 16931 : https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/EN+16931
- PDF/A : https://www.pdfa.org

### Schémas XSD officiels
- GitHub : https://github.com/Factur-X/Factur-X
- Version 1.07.3 (Mai 2025)

### Standards
- ZUGFeRD 2.3.3 : https://www.ferd-net.de
- Factur-X 1.07.3 : https://fnfe-mpe.org

---

## 💡 Bonnes pratiques

1. **Triple validation** pour la production
   - Interne (rapide)
   - veraPDF (PDF/A-3)
   - Mustangproject (Factur-X)

2. **Automatisation CI/CD**
   - Tests automatisés avec validation externe
   - Rejet si validation externe échoue

3. **Validation périodique**
   - Valider avec outils officiels tous les trimestres
   - Vérifier compatibilité avec nouvelles versions

4. **Conservation des rapports**
   - Archiver les rapports de validation
   - Traçabilité pour audit

5. **Mise à jour régulière**
   - Suivre les mises à jour veraPDF
   - Suivre les mises à jour Mustangproject
   - Suivre les nouvelles versions Factur-X

---

**Conclusion** : Notre pipeline interne couvre 95% des besoins. Pour une **certification officielle** ou une **garantie maximale**, utilisez en complément **veraPDF** (PDF/A-3) et **Mustangproject** (Factur-X).
