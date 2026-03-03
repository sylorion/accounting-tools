# Plan de Certification ISO 27001:2022 — Système Factur-X / Order-X / Devis-X

> **Document vivant** — À mettre à jour à chaque phase de l'implémentation.
> Référentiel : ISO/IEC 27001:2022 + ISO/IEC 27002:2022 (93 contrôles, 4 domaines)

**Objectif :** Obtenir et maintenir la certification ISO 27001:2022 pour la plateforme de facturation électronique conforme Factur-X, Order-X et Devis-X, en couvrant toute la chaîne : génération XML/PDF, signature électronique qualifiée (eIDAS 2.0), stockage, transmission et archivage légal.

**Périmètre :** Système SaaS de facturation électronique B2B — génération, validation, envoi et archivage de factures électroniques au format Factur-X 1.07.2 / Order-X / Devis-X, avec conformité PDF/A-3, XSD, Schematron, DGFiP et obligation légale de conservation 6 ans (LPF art. L. 102 B).

**Standards couverts :**
- ISO/IEC 27001:2022 — SMSI (Système de Management de la Sécurité de l'Information)
- ISO/IEC 27002:2022 — Guide de bonnes pratiques
- eIDAS 2.0 (règlement UE 910/2014 révisé) — Signatures électroniques qualifiées
- NIS2 (directive UE 2022/2555) — Cybersécurité opérateurs essentiels
- RGPD (règlement UE 2016/679) — Protection des données
- DGFiP / LPF art. L. 102 B — Conservation 6 ans (factures électroniques françaises)
- PCI-DSS v4.0 — Si traitement de paiement intégré

---

## Table des Matières

1. [Vue d'ensemble de l'approche](#1-vue-densemble)
2. [Périmètre SMSI et actifs](#2-périmètre-smsi-et-actifs)
3. [Architecture de sécurité — 10 couches](#3-architecture-de-sécurité)
4. [Analyse des risques (ISO 27005)](#4-analyse-des-risques)
5. [Déclaration d'Applicabilité (SoA)](#5-déclaration-dapplicabilité)
6. [Infrastructure technique détaillée](#6-infrastructure-technique)
7. [Exigences cryptographiques (eIDAS + Factur-X)](#7-cryptographie-et-signatures)
8. [Plan d'implémentation — 12 phases](#8-plan-dimplémentation)
9. [Audit et certification](#9-audit-et-certification)
10. [Coûts et délais](#10-coûts-et-délais)
11. [Conformité réglementaire complémentaire](#11-conformité-réglementaire)
12. [Outils et stack technologique](#12-outils-et-stack)

---

## 1. Vue d'ensemble

### Cadre ISO 27001:2022

ISO 27001:2022 exige un **SMSI (Système de Management de la Sécurité de l'Information)** couvrant :

```
Clauses obligatoires (4-10) :
  4. Contexte de l'organisation       → Périmètre, parties intéressées
  5. Leadership                        → Engagement direction, politiques
  6. Planification                     → Risques, objectifs, SoA
  7. Support                           → Ressources, compétences, communication
  8. Opérations                        → Mise en œuvre des contrôles
  9. Évaluation des performances       → Audits internes, revues direction
 10. Amélioration                      → Non-conformités, amélioration continue

Annex A (93 contrôles) :
  A.5  Contrôles organisationnels      (37 contrôles)
  A.6  Contrôles liés aux personnes    (8 contrôles)
  A.7  Contrôles physiques             (14 contrôles)
  A.8  Contrôles technologiques        (34 contrôles)
```

### Approche recommandée pour Factur-X

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMSI Factur-X / Order-X                      │
│                                                                  │
│  Périmètre : Génération → Validation → Signature → Stockage    │
│              → Transmission → Archivage légal (6 ans)           │
│                                                                  │
│  Données sensibles :                                             │
│  • Données financières B2B (montants, IBAN, SIRET)             │
│  • Données personnelles (RGPD) : noms acheteurs/vendeurs        │
│  • Clés cryptographiques (certificats eIDAS)                    │
│  • XML Factur-X et PDFs signés (valeur probatoire)             │
└─────────────────────────────────────────────────────────────────┘
```

### Calendrier global (18 mois)

```
Mois 1-3   : Gap Analysis + Inventaire actifs + Analyse risques
Mois 4-6   : Politiques SMSI + Architecture sécurité + Controls
Mois 7-9   : Implémentation technique (IAM, chiffrement, SIEM)
Mois 10-12 : Tests, audits internes, remédiation
Mois 13-15 : Audit de certification (organisme accrédité COFRAC)
Mois 16-18 : Surveillance + amélioration continue
```

---

## 2. Périmètre SMSI et Actifs

### 2.1 Actifs informationnels (A.5.9 — Inventaire)

| Actif | Classification | Propriétaire | Criticité |
|-------|---------------|--------------|-----------|
| Fichiers XML Factur-X / Order-X | CONFIDENTIEL | RSSI | CRITIQUE |
| PDFs signés PDF/A-3 | CONFIDENTIEL | RSSI | CRITIQUE |
| Clés privées PKI / Certificats eIDAS | SECRET | RSSI | CRITIQUE |
| Données SIRET/SIREN/VAT acheteurs | CONFIDENTIEL | DPO | HAUTE |
| IBAN et données de paiement | CONFIDENTIEL | RSSI | HAUTE |
| Code source (`lib/factur-x-ts`, `lib/smp-factur-x-ts`) | INTERNE | CTO | HAUTE |
| Schémas XSD / Schematron officiels | PUBLIC | CTO | MOYENNE |
| Logs d'audit (génération, validation, envoi) | INTERNE | RSSI | HAUTE |
| Credentials API (tokens, clés API) | SECRET | RSSI | CRITIQUE |
| Sauvegardes chiffrées | CONFIDENTIEL | OPS | HAUTE |

### 2.2 Classification des données (A.5.12 + A.5.13)

```
┌──────────────┬──────────────────────────────────────────────────┐
│ NIVEAU       │ DONNÉES                                           │
├──────────────┼──────────────────────────────────────────────────┤
│ PUBLIC       │ Schémas XSD officiels, documentation publique    │
│ INTERNE      │ Code source, logs applicatifs non sensibles      │
│ CONFIDENTIEL │ Factures, données clients B2B, montants          │
│ SECRET       │ Clés privées, certificats, credentials HSM       │
└──────────────┴──────────────────────────────────────────────────┘
```

### 2.3 Parties intéressées (clause 4.2)

- **DGFiP** — Conformité facture électronique française (arrêté 2022)
- **AIFE / Chorus Pro** — Plateforme publique de dépôt
- **Clients B2B** — Acheteurs et vendeurs (SLA, confidentialité)
- **Organismes de certification** — COFRAC, BSI, Bureau Veritas
- **Hébergeur cloud** — AWS / GCP / Azure (sous-traitant critique)
- **ANSSI** — Qualification SecNumCloud si données sensibles françaises
- **CNIL** — Conformité RGPD (DPO déclaré)

---

## 3. Architecture de Sécurité — 10 Couches

### Vue architecturale globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET / CLIENTS B2B                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS/TLS 1.3 uniquement
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 1 — PÉRIMÈTRE & EXPOSITION                                      │
│  WAF (ModSecurity/AWS WAF) • DDoS (Cloudflare/Shield) • CDN             │
│  Rate limiting • Bot protection • IP allowlisting                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 2 — API GATEWAY & AUTHENTIFICATION                              │
│  Kong / AWS API Gateway • OAuth2 + OIDC (Keycloak) • JWT RS256         │
│  mTLS inter-services • API versioning • Schema validation               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 3 — IDENTITÉ & ACCÈS (IAM)                                      │
│  MFA obligatoire • RBAC granulaire • PAM (CyberArk/Vault) • SSO       │
│  Least privilege • Just-in-time access • Session recording              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 4 — RÉSEAU & SEGMENTATION (Zero Trust)                          │
│  VPC avec subnets privés • VLAN isolés (prod/staging/dev)              │
│  Security Groups restrictifs • IDS/IPS (Suricata) • DNS filtering      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 5 — APPLICATION & SDLC SÉCURISÉ                                │
│  SAST (Semgrep/SonarQube) • DAST (OWASP ZAP) • SCA (Snyk/OWASP DC)  │
│  Container scanning • Secrets detection • Signed commits               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 6 — CRYPTOGRAPHIE & SIGNATURES (eIDAS)                          │
│  HSM (nShield/CloudHSM) • PKI interne + externe qualifiée             │
│  Certificats qualifiés QTSP • Horodatage qualifié TSA • PKCS#11       │
│  AES-256 at rest • TLS 1.3 in transit • Key rotation automatique      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 7 — DONNÉES & STOCKAGE                                          │
│  Chiffrement AES-256 (KMS) • DLP • Backup 3-2-1 chiffré              │
│  Archivage légal 6 ans (LPF L.102 B) • Immuabilité (WORM)            │
│  Anonymisation RGPD • Cloisonnement tenant B2B                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 8 — SURVEILLANCE & SIEM                                         │
│  SIEM (Wazuh/Elastic SIEM) • Log centralisé tamper-proof              │
│  Alerting temps réel • NTP synchronisation (pour timestamps factures)  │
│  Métriques SOC • Threat intelligence (MISP/TAXII)                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 9 — RÉPONSE AUX INCIDENTS                                       │
│  CSIRT • Playbooks incidents (DRP) • Forensics capability              │
│  Notification RGPD 72h (CNIL) • War room • Communication crise        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  COUCHE 10 — CONTINUITÉ & CONFORMITÉ                                    │
│  PCA/PRA (RTO < 4h, RPO < 1h) • Multi-région • Audits internes       │
│  SoA vivant • Revues direction trimestrielles • NIS2 reporting         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Couche 1 — Périmètre et Exposition (A.8.20, A.8.21)

**Composants requis :**

```yaml
perimeter:
  waf:
    solution: AWS WAF v2 ou Cloudflare WAF (règles OWASP CRS 4.x)
    règles_critiques:
      - SQL injection (pour API queries)
      - XSS (portails web)
      - XXE (parseur XML Factur-X — CRITIQUE)
      - Path traversal
      - Rate limiting par IP/tenant
    custom_rules:
      - Bloquer requêtes avec Content-Type non text/xml ou application/json
      - Valider Content-Length (refus payloads > 10 MB)
      - Vérifier namespace xmlns Factur-X dans les requêtes XML

  ddos_protection:
    L3_L4: Cloudflare Magic Transit ou AWS Shield Advanced
    L7: WAF rules + geo-blocking si applicable
    seuil_alerte: 10x trafic nominal

  tls:
    version_minimum: TLS 1.3 (TLS 1.2 avec ciphers forts comme fallback)
    ciphers_autorisés:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
    certificats: Let's Encrypt (DV) ou DigiCert (OV/EV)
    hsts: max-age=31536000; includeSubDomains; preload
    hpkp: Déprécié — utiliser CAA DNS records à la place
    ocsp_stapling: true
    ct_logs: true
```

**Contrôles ISO 27001 couverts :** A.8.20 (sécurité réseaux), A.8.21 (services réseau), A.8.22 (cloisonnement)

---

### Couche 2 — API Gateway et Authentification (A.5.15, A.8.26)

**Architecture API pour Factur-X :**

```yaml
api_gateway:
  solution: Kong Gateway (open-source) ou AWS API Gateway
  plugins_requis:
    - rate-limiting: 100 req/min par tenant, 10 req/s par IP
    - oauth2: Authorization Code Flow + PKCE
    - jwt: RS256, expiry 15min (access), 7j (refresh)
    - request-validator: Schema JSON/XML validation à l'entrée
    - response-transformer: Supprimer headers sensibles (X-Powered-By, Server)
    - cors: Origins whitelist explicite
    - bot-detection: Bloquer User-Agents suspects
    - audit-log: Toutes les requêtes vers SIEM

  endpoints_protégés:
    POST /invoices/generate:
      auth: Bearer JWT + tenant scope
      rate_limit: 50/min
      max_payload: 1MB
      validation: XSD Factur-X avant traitement
    GET /invoices/{id}/pdf:
      auth: Bearer JWT + ownership check
      rate_limit: 200/min
    POST /invoices/{id}/sign:
      auth: Bearer JWT + MFA step-up pour signatures qualifiées
      rate_limit: 10/min
    DELETE /invoices/{id}:
      auth: Bearer JWT + admin role + confirmation token
      audit: OBLIGATOIRE — log avec userId, timestamp, IP

  versioning:
    stratégie: URI versioning (/v1/, /v2/)
    dépréciation: 12 mois de préavis documenté
```

---

### Couche 3 — Identité et Accès IAM (A.5.15, A.5.16, A.5.18, A.6.2)

**Modèle RBAC pour Factur-X :**

```yaml
roles:
  invoice_generator:
    permissions:
      - invoices:create
      - invoices:read:own
      - xml:generate
      - pdf:generate
    restrictions:
      - Ne peut pas signer
      - Ne peut pas supprimer

  invoice_validator:
    permissions:
      - invoices:read:all
      - invoices:validate
      - xml:validate_xsd
      - xml:validate_schematron
    restrictions:
      - Ne peut pas créer ni modifier

  invoice_signer:
    permissions:
      - invoices:sign
      - certificates:use (scope limité au HSM)
    restrictions:
      - MFA step-up obligatoire à chaque signature
      - Quota journalier : 500 signatures max
      - Horaires autorisés : 06h-22h (configurable)

  invoice_auditor:
    permissions:
      - invoices:read:all
      - logs:read
      - reports:generate
    restrictions:
      - READ ONLY total — aucune action

  admin:
    permissions:
      - users:manage
      - roles:assign
      - config:update
    restrictions:
      - Jamais sur données de production directement
      - PAM obligatoire avec session enregistrée

politique_mots_de_passe:
  longueur_minimum: 16 caractères
  complexité: true
  renouvellement: Interdit de forcer — basé sur compromission (NIST SP 800-63B)
  historique: 12 derniers mots de passe
  lockout: 5 tentatives → 30 min lockout

mfa:
  obligatoire: TOUS les utilisateurs humains
  méthodes_acceptées:
    - TOTP (Google Authenticator, Authy)
    - FIDO2/WebAuthn (YubiKey — recommandé pour admins)
    - SMS: INTERDIT pour comptes admin (SIM swapping)
  step_up:
    - Signature de factures
    - Export en masse (> 100 factures)
    - Modification de configuration critique
    - Accès aux clés cryptographiques

pam:
  solution: HashiCorp Vault + CyberArk (ou Teleport pour SSH/K8s)
  règles:
    - Credentials d'admin jamais en clair dans un terminal
    - Session recording pour tout accès privilégié
    - Just-in-time access : durée max 4h, auto-révocation
    - Dual authorization pour actions destructives en prod
```

**Contrôles ISO 27001 couverts :** A.5.15, A.5.16, A.5.17, A.5.18, A.6.2, A.8.3, A.8.4, A.8.5

---

### Couche 4 — Réseau et Segmentation Zero Trust (A.8.20–A.8.22)

**Architecture réseau :**

```
┌─────────────────────────────────────────────────────────┐
│  ACCOUNT AWS / PROJECT GCP                              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  VPC PRODUCTION (10.0.0.0/16)                   │   │
│  │                                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │ Public Subnet│  │Public Subnet│               │   │
│  │  │ (ALB, WAF)  │  │ (ALB, WAF) │               │   │
│  │  │ 10.0.1.0/24 │  │10.0.2.0/24 │               │   │
│  │  └──────┬──────┘  └──────┬──────┘               │   │
│  │         │                │                        │   │
│  │  ┌──────▼────────────────▼──────┐                │   │
│  │  │   Private Subnet — App        │                │   │
│  │  │   (Factur-X API, Generator)  │                │   │
│  │  │   10.0.10.0/24               │                │   │
│  │  └──────────────────┬───────────┘                │   │
│  │                     │                             │   │
│  │  ┌──────────────────▼───────────┐                │   │
│  │  │   Private Subnet — Data       │                │   │
│  │  │   (PostgreSQL, S3/GCS, HSM)  │                │   │
│  │  │   10.0.20.0/24               │                │   │
│  │  └──────────────────────────────┘                │   │
│  │                                                   │   │
│  │  ┌──────────────────────────────┐                │   │
│  │  │   Isolated Subnet — Security  │                │   │
│  │  │   (SIEM, Vault, Bastion)     │                │   │
│  │  │   10.0.30.0/24               │                │   │
│  │  └──────────────────────────────┘                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  VPC STAGING (10.1.0.0/16) — Isolé prod         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  VPC DEV (10.2.0.0/16) — Jamais de données réelles│  │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

Règles Zero Trust :
  • Aucun accès inter-VPC par défaut
  • Transit Gateway avec peering explicite et whitelisting
  • VPN / AWS PrivateLink pour accès opérateur
  • Pas d'IP publique sur les serveurs applicatifs
  • Bastion éphémère (SSM Session Manager ou Teleport)
  • IDS/IPS : Suricata sur tous les flux entre subnets
  • DNS interne privé — résolution externe filtrée
```

**Security Groups critiques :**

```yaml
sg_api_servers:
  inbound:
    - port: 443, source: sg_alb (ALB uniquement)
    - port: 8080, source: sg_api (inter-services uniquement)
  outbound:
    - port: 5432, destination: sg_database
    - port: 443, destination: sg_hsm
    - port: 443, destination: 0.0.0.0/0 (APIs externes — via NAT)

sg_database:
  inbound:
    - port: 5432, source: sg_api_servers (UNIQUEMENT)
  outbound: AUCUN

sg_hsm:
  inbound:
    - port: 2223, source: sg_api_servers (PKCS#11)
  outbound: AUCUN

sg_siem:
  inbound:
    - port: 514, source: ALL VPC (syslog)
    - port: 9200, source: sg_security_subnet
  outbound:
    - port: 443, destination: threat_intelligence_feeds
```

---

### Couche 5 — Sécurité Applicative et SDLC (A.8.25–A.8.34)

**Pipeline CI/CD sécurisé :**

```yaml
pipeline_sécurité:
  pre_commit:
    - detect-secrets (Yelp) : Détection de secrets dans le code
    - gitleaks : Scan historique Git
    - commitlint : Format et signature commits (GPG obligatoire)

  pull_request:
    - SAST: Semgrep (règles OWASP, TypeScript, Node.js)
    - SCA: Snyk OSS ou OWASP Dependency-Check
      - Refus si vulnérabilité CVSS ≥ 7.0 non justifiée
    - License check: Refus licences GPL/AGPL en production
    - Code review: 2 reviewers minimum pour `lib/factur-x-ts/`

  build:
    - Docker image scanning: Trivy (CRITICAL/HIGH → build fail)
    - SBOM generation: Syft (Software Bill of Materials)
    - Image signing: Cosign (Sigstore) — vérification à deploy
    - Base images: Distroless ou Alpine minimal

  staging:
    - DAST: OWASP ZAP automated scan
    - Penetration test: Trimestriel (interne) + Annuel (externe)
    - Contract testing: Pact pour APIs inter-services
    - XSD/Schematron validation automatique sur fixtures

  production:
    - Blue/Green deployment — rollback < 5 min
    - Feature flags (LaunchDarkly/Unleash)
    - Canary releases pour changements cryptographiques
    - Signed container images uniquement (admission controller K8s)

règles_codage_sécurisé:
  xml_parsing:
    # CRITIQUE pour Factur-X — Prévention XXE
    - Désactiver DOCTYPE processing
    - Désactiver external entities
    - Limiter la taille des documents XML à 10 MB
    - Valider contre XSD AVANT tout traitement métier

  données_sensibles:
    - Jamais de logs contenant IBAN, SIRET complet, montants
    - Masquage : IBAN → FR76****1234, montants → [MONTANT]
    - Pas de données de production en dev/staging

  dépendances:
    - Audit npm hebdomadaire automatisé
    - Mise à jour des dépendances en < 30 jours (High/Critical)
    - Pinning des versions (package-lock.json committé)
    - npm audit dans CI — refus si vuln critique
```

**Contrôles ISO 27001 couverts :** A.8.25, A.8.26, A.8.27, A.8.28, A.8.29, A.8.31, A.8.32

---

### Couche 6 — Cryptographie et Signatures Qualifiées eIDAS (A.8.24)

**Architecture PKI pour Factur-X :**

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIÉRARCHIE PKI                                │
│                                                                  │
│  QTSP (Qualified Trust Service Provider)                        │
│  Ex: Certinomis, Universign, DocuSign EU, GlobalSign QTS        │
│  → Certificats qualifiés eIDAS 2.0 (QES/QSeal)                │
│                                                                  │
│  ┌───────────────────────────────────────────────────┐         │
│  │  HSM CLOUD (AWS CloudHSM / nShield Connect)       │         │
│  │  FIPS 140-2 Level 3 ou CC EAL4+                  │         │
│  │                                                    │         │
│  │  Stocke :                                          │         │
│  │  • Clés privées RSA 3072 ou ECDSA P-256           │         │
│  │  • Clés de chiffrement AES-256 (KEK)             │         │
│  │  • Clés de signature TSA                          │         │
│  │                                                    │         │
│  │  Interface : PKCS#11 (lib/factur-x-ts → HSM)     │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
│  Flux de signature Factur-X :                                   │
│                                                                  │
│  1. Génération XML → 2. Validation XSD+Schematron              │
│  3. Hash SHA-256 du XML → 4. Signature via HSM (PKCS#11)      │
│  5. Horodatage qualifié (TSA RFC 3161) → 6. Embed dans PDF/A-3│
│  7. Archivage avec preuve de signature → 8. Vérification       │
└─────────────────────────────────────────────────────────────────┘
```

**Paramètres cryptographiques requis :**

```yaml
algorithmes:
  signature_xml:
    algorithme: RSA-PSS SHA-256 ou ECDSA P-256
    standard: XAdES-B-LTA (Baseline Long-Term Archival)
    norme: ETSI EN 319 132

  signature_pdf:
    algorithme: RSA 3072 ou ECDSA P-384
    format: PAdES-LTA
    norme: ETSI EN 319 142

  chiffrement_repos:
    algorithme: AES-256-GCM
    gestion_clés: AWS KMS / HashiCorp Vault Transit
    rotation: Trimestrielle automatique

  chiffrement_transit:
    protocole: TLS 1.3
    ciphers: TLS_AES_256_GCM_SHA384
    perfect_forward_secrecy: true

  hachage:
    algorithme: SHA-256 minimum (SHA-384 pour certificats long terme)
    interdit: MD5, SHA-1 (formellement prohibés — A.8.24)

  horodatage:
    service: TSA qualifiée (ex: Universign TSA, Sectigo)
    format: RFC 3161
    fréquence: À chaque signature + Périodique pour archivage long terme

gestion_clés:
  cycle_vie:
    génération: Dans HSM uniquement — jamais export de clé privée
    activation: Dual control (2 personnes minimum)
    rotation: RSA/EC → 2 ans max; AES → 1 an max
    révocation: < 24h en cas de compromission suspectée
    destruction: Zéroisation HSM + destruction documentée

  audit_cryptographique:
    inventaire_clés: Mis à jour en temps réel
    utilisation_clés: Loggée dans SIEM (chaque signature)
    test_intégrité: Mensuel
```

**Contrôles ISO 27001 couverts :** A.8.24 (cryptographie), A.5.14 (transfert information)

---

### Couche 7 — Données et Stockage (A.5.12, A.8.10)

**Modèle de stockage pour factures électroniques :**

```yaml
stockage_primaire:
  type: Objet (S3/GCS/Azure Blob) + Base relationnelle (PostgreSQL)
  chiffrement:
    at_rest: AES-256, clés gérées par KMS client-managed
    at_transit: TLS 1.3 uniquement
  accès:
    authentification: IAM roles (pas de credentials statiques)
    accès_humain: Via Vault dynamic secrets (durée max 1h)
    accès_service: ServiceAccount avec permissions minimales
  versioning: Activé sur S3 (historique complet des factures)
  immuabilité: S3 Object Lock (WORM) — Compliance mode 6 ans + 1 mois

archivage_légal:
  durée: 6 ans (LPF art. L. 102 B — factures France)
  format: PDF/A-3 signé + XML Factur-X + preuve de signature
  intégrité: Hash SHA-256 archivé séparément (journal notarié)
  accès_DGFiP: Procédure documentée pour réponse aux contrôles fiscaux
  destruction: Procédure formelle après 6 ans + 6 mois (buffer légal)

backup_3_2_1:
  règle:
    - 3 copies des données
    - 2 supports différents (ex: disque + objet cloud)
    - 1 copie hors site (région géographique différente)
  chiffrement: AES-256 avec clé différente des données primaires
  test_restauration: Mensuel (objectif : RPO < 1h)
  rétention_backup: 30 jours (journalier), 12 mois (mensuel), 6 ans (annuel)

dlp:
  solution: AWS Macie ou Google DLP
  règles:
    - Détection IBAN dans les logs → alerte SIEM + masquage
    - Détection SIRET/SIREN → classification automatique CONFIDENTIEL
    - Détection données personnelles → notification DPO
  actions:
    logging_sensible: Masquage automatique avant persistence
    export: Watermarking invisible sur PDFs exportés en masse
```

---

### Couche 8 — Surveillance et SIEM (A.8.15, A.8.16, A.8.17)

**Architecture de surveillance :**

```yaml
siem:
  solution: Wazuh (open-source) ou Elastic Security ou Splunk
  sources_logs:
    - API Gateway: Toutes les requêtes (méthode, path, status, tenant, durée)
    - Application: Génération/validation/signature de factures (sans données sensibles)
    - HSM: Toutes les opérations cryptographiques
    - Base de données: DDL + DML sur tables factures (via pgAudit)
    - Infrastructure: CloudTrail/Stackdriver, VPC Flow Logs
    - WAF: Toutes les requêtes bloquées
    - IDS/IPS: Alertes Suricata

  rétention_logs:
    hot: 90 jours (recherche rapide)
    warm: 1 an (archivage indexé)
    cold: 6 ans (conformité légale — logs d'audit = document légal)
    format: JSON structuré + signature HMAC pour intégrité

  alertes_critiques:
    - Échec d'authentification > 5 en < 60s → Lockout + SIEM alert
    - Accès en dehors des horaires → Alert + notification SOC
    - Volume de génération de factures anormal (> 3σ) → Alert
    - Accès aux clés HSM hors du processus de signature → CRITIQUE
    - Tentative d'accès au subnet HSM depuis subnet non autorisé → CRITIQUE
    - Export de plus de 100 factures sans MFA step-up → CRITIQUE
    - Modification des fichiers XSD/Schematron de référence → CRITIQUE
    - Changement de configuration IAM non approuvé → HAUTE

ntp_synchronisation:
  # CRITIQUE pour l'horodatage légal des factures
  serveurs: pool.ntp.org (stratum 2) + serveur NTP interne stratum 1
  précision_requise: < 1 seconde (légal) / < 100ms (opérationnel)
  surveillance: Dérive > 500ms → alerte (factures avec timestamp erroné)
  documentation: ISO 27001 A.8.17 — Clock synchronization

audit_trail_factures:
  événements_loggés:
    - creation: userId, tenantId, invoiceId, timestamp, IP, hash XML
    - validation_xsd: invoiceId, result, timestamp, xsd_version
    - validation_schematron: invoiceId, result, timestamp, sch_version
    - signature: invoiceId, certificateId, timestamp, signature_value
    - transmission: invoiceId, destination, protocol, timestamp, ack
    - archivage: invoiceId, storage_location, hash, timestamp
    - accès: userId, invoiceId, action, timestamp, IP
    - suppression: userId, invoiceId, timestamp, justification, approval
  intégrité:
    - Logs signés avec clé HSM dédiée (non modifiables)
    - Hash chaîné (type blockchain simplifiée)
    - Vérification intégrité quotidienne automatique
```

---

### Couche 9 — Réponse aux Incidents (A.5.24–A.5.26)

**Procédures CSIRT :**

```yaml
classification_incidents:
  P1_critique:
    exemples:
      - Compromission clé privée HSM
      - Fuite de données factures (RGPD → notif CNIL 72h)
      - Ransomware sur infrastructure prod
      - Signature falsifiée de factures
    sla:
      détection: < 15 min
      confinement: < 1h
      notification_direction: < 2h
      notification_cnil_si_applicable: < 72h
      rétablissement: < 4h (RTO)

  P2_haute:
    exemples:
      - DDoS impactant la disponibilité
      - Compromission compte admin
      - Vulnérabilité critique dans librairie (factur-x-ts)
      - Erreur de signature sur factures en production
    sla:
      détection: < 1h
      confinement: < 4h
      rétablissement: < 8h

  P3_moyenne:
    exemples:
      - Tentatives d'intrusion bloquées par WAF
      - Dépendance vulnérable (CVSS 7.0-8.9)
      - Erreur de validation XSD non critique
    sla:
      traitement: < 48h

playbooks_critiques:
  compromission_cle_hsm:
    étapes:
      1. Isoler immédiatement le HSM (coupure réseau)
      2. Activer le HSM de secours (HSM backup)
      3. Révoquer tous les certificats émis avec la clé compromise
      4. Notifier tous les clients (factures concernées invalides)
      5. Notifier le QTSP (révocation liste CRL)
      6. Analyse forensique (snapshot HSM avant action)
      7. Régénération des clés dans nouveau HSM
      8. Re-signature des factures si légalement possible
      9. Rapport d'incident complet (RCA — Root Cause Analysis)

  fuite_données_factures:
    étapes:
      1. Identifier le périmètre (quelles factures, quels clients)
      2. Couper l'accès à la source de fuite
      3. Préserver les preuves forensiques
      4. Évaluation RGPD : données personnelles impliquées ?
      5. Si oui → notification CNIL dans 72h (art. 33 RGPD)
      6. Notification des clients B2B concernés (art. 34 RGPD)
      7. Blocage des accès compromis
      8. Rapport DPO + rapport direction
```

---

### Couche 10 — Continuité et Conformité (A.5.29, A.5.30)

**Plan de Continuité d'Activité :**

```yaml
objectifs_rétablissement:
  RTO: 4 heures (Recovery Time Objective) — Service de génération factures
  RPO: 1 heure (Recovery Point Objective) — Perte de données max acceptable
  MTTR: 2 heures (Mean Time To Recover)

stratégie_multi_région:
  région_primaire: eu-west-1 (Irlande) ou europe-west1 (Belgique)
  région_secondaire: eu-central-1 (Frankfurt) ou europe-west3 (Francfort)
  réplication:
    base_données: Réplication synchrone (< 500ms latence)
    objets_factures: Réplication asynchrone < 15 min
    certificats_hsm: HSM actif-actif ou warm standby < 30 min
  bascule:
    automatique: Sur indisponibilité > 5 min (health checks)
    manuelle: Procédure documentée, testé trimestriellement

tests_continuité:
  test_bascule: Trimestriel (région secondaire pendant 1h minimum)
  test_restauration_backup: Mensuel (restoration complète en environnement isolé)
  exercice_incident: Semestriel (simulation fuite données / ransomware)
  revue_PCA: Annuelle ou après tout incident P1/P2
```

---

## 4. Analyse des Risques (ISO 27005)

### Méthodologie d'évaluation

```
Score Risque = Vraisemblance (1-5) × Impact (1-5)
Criticité :
  1-5   : FAIBLE — Accepté
  6-12  : MODÉRÉ — Traitement planifié
  13-19 : ÉLEVÉ — Traitement prioritaire
  20-25 : CRITIQUE — Traitement immédiat
```

### Registre des risques critiques (exemples)

| # | Risque | Vrais. | Impact | Score | Traitement |
|---|--------|--------|--------|-------|------------|
| R01 | Compromission clé privée HSM → Fausses factures signées | 2 | 5 | **10** | HSM FIPS 140-3 + dual control |
| R02 | Injection XXE dans parser XML Factur-X → RCE | 3 | 5 | **15** | Désactiver entités externes + WAF |
| R03 | Fuite IBAN/données financières → RGPD + réputation | 2 | 5 | **10** | Chiffrement + DLP + pseudonymisation |
| R04 | Factures modifiées en transit → Fraude | 2 | 5 | **10** | Signature XAdES-LTA + TLS 1.3 |
| R05 | Timestamps erronés → Invalidité légale factures | 3 | 4 | **12** | NTP synchronisé + TSA qualifiée |
| R06 | Perte données 6 ans → Non-conformité LPF | 2 | 5 | **10** | WORM + backup 3-2-1 + test mensuel |
| R07 | Supply chain (npm) → Code malveillant dans lib | 3 | 4 | **12** | SCA Snyk + pinning + SBOM |
| R08 | Admin compromis → Accès total données factures | 2 | 5 | **10** | PAM + MFA + least privilege |
| R09 | DDoS → Indisponibilité service (impact SLA clients) | 4 | 3 | **12** | Shield Advanced + multi-région |
| R10 | XSD/Schematron altérés → Factures invalides générées | 1 | 5 | **5** | Signature + monitoring intégrité |

---

## 5. Déclaration d'Applicabilité (SoA)

### Contrôles les plus critiques pour Factur-X

La SoA complète doit lister les 93 contrôles avec statut (Applicable/Non applicable + justification). Ci-dessous les contrôles **prioritaires** :

| Contrôle | Titre | Statut | Justification |
|----------|-------|--------|---------------|
| A.5.9 | Inventaire actifs | ✅ Applicable | Factures, clés, code source |
| A.5.12 | Classification information | ✅ Applicable | 4 niveaux dont SECRET pour clés |
| A.5.14 | Transfert information | ✅ Applicable | API B2B, Chorus Pro, AIFE |
| A.5.15 | Contrôle d'accès | ✅ Applicable | RBAC, MFA, PAM |
| A.5.23 | Sécurité services cloud | ✅ Applicable | AWS/GCP utilisé |
| A.5.24 | Gestion incidents sécurité | ✅ Applicable | CSIRT, playbooks |
| A.5.29 | Sécurité continuité activité | ✅ Applicable | RTO 4h, RPO 1h |
| A.5.30 | Préparation TIC continuité | ✅ Applicable | Multi-région |
| A.8.8 | Gestion vulnérabilités techniques | ✅ Applicable | CVE scan, patch < 30j |
| A.8.15 | Journalisation | ✅ Applicable | Audit trail factures (légal) |
| A.8.16 | Activités de surveillance | ✅ Applicable | SIEM, alertes SOC |
| A.8.17 | Synchronisation horloges | ✅ **CRITIQUE** | Validité légale horodatage factures |
| A.8.24 | Utilisation cryptographie | ✅ **CRITIQUE** | Signatures eIDAS, AES-256, TLS 1.3 |
| A.8.25 | Cycle de vie développement sécurisé | ✅ Applicable | SAST, DAST, SCA dans CI |
| A.8.28 | Codage sécurisé | ✅ **CRITIQUE** | Parser XXE, injection, secrets |
| A.8.34 | Protection SI en audit | ✅ Applicable | Env. test isolé, pas de données réelles |

---

## 6. Infrastructure Technique

### Stack Infrastructure Recommandée (Cloud-Native)

```
┌─────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE AS CODE (IaC)                                   │
│  Terraform + Terragrunt • Modules vérifiés + signed            │
│  GitOps (ArgoCD) • OPA Gatekeeper (policy as code)            │
│  Vault pour secrets IaC (jamais de secrets dans Terraform state)│
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  ORCHESTRATION                                                   │
│  Kubernetes (EKS/GKE) • Namespaces isolés par tenant          │
│  Network Policies (Calico) • Pod Security Standards (Restricted)│
│  Image scanning admission controller (Kyverno)                  │
│  mTLS inter-pods (Istio/Linkerd Service Mesh)                  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  SERVICES MANAGÉS (moins de surface d'attaque)                 │
│  Base de données: RDS Aurora PostgreSQL (Multi-AZ)             │
│  Stockage factures: S3 avec Object Lock (WORM 6 ans+)         │
│  Secrets: AWS Secrets Manager + HashiCorp Vault               │
│  HSM: AWS CloudHSM (FIPS 140-2 Level 3)                       │
│  Monitoring: CloudWatch + Wazuh + Grafana                      │
│  CI/CD: GitHub Actions avec OIDC (pas de tokens long-lived)   │
└─────────────────────────────────────────────────────────────────┘
```

### Conformité SecNumCloud (Option française)

Pour les données de facturation française sensibles, considérer :
- **SecNumCloud** (qualification ANSSI) — Obligatoire pour certains OIV/OSE
- **HDS** (Hébergeur Données de Santé) — Si données médicales impliquées
- Fournisseurs qualifiés : OVHcloud, Outscale (Dassault), Scaleway
- Référentiel complémentaire à ISO 27001 (exigences supplémentaires)

---

## 7. Cryptographie et Signatures (eIDAS 2.0)

### Types de signatures selon le cas d'usage

```
┌────────────────────────────────────────────────────────────────┐
│  NIVEAU SIGNATURE    │ CAS D'USAGE FACTUR-X                   │
├────────────────────────────────────────────────────────────────┤
│ SES (Simple)         │ Accusé de réception interne            │
│ AdES (Advanced)      │ Factures standard B2B                  │
│ QES (Qualified)      │ Factures valeur probatoire maximale    │
│                      │ Devis avec engagement contractuel      │
│ QSeal (Qualified     │ Cachet serveur automatisé — RECOMMANDÉ │
│ Electronic Seal)     │ pour génération en masse Factur-X      │
└────────────────────────────────────────────────────────────────┘
```

### Formats de signature pour Factur-X

```
XML Factur-X → XAdES-B-LTA (ETSI EN 319 132)
PDF/A-3      → PAdES-B-LTA (ETSI EN 319 142)
Order-X      → XAdES-B-LTA
Devis-X      → XAdES-B-LTA

Format LTA (Long-Term Archival) :
  • Inclut la preuve de validation au moment de la signature
  • Résistant à l'expiration des certificats
  • Horodatage qualifié RFC 3161 intégré
  • Permet validation 6 ans+ après signature
```

### QTSP (Qualified Trust Service Providers) recommandés (France/UE)

| QTSP | Services | Conformité |
|------|----------|------------|
| **Certinomis** (filiale La Poste) | QES, QSeal, TSA | eIDAS + RGS |
| **Universign** | QES, QSeal, TSA | eIDAS |
| **DocuSign EU** | QES | eIDAS |
| **GlobalSign** | QSeal, TSA | eIDAS |
| **Entrust** | QES, QSeal, HSM | eIDAS + FIPS |

---

## 8. Plan d'Implémentation — 12 Phases

### Phase 1 — Gap Analysis et Scoping (Mois 1-2)

**Objectif :** Mesurer l'écart entre la situation actuelle et ISO 27001:2022.

**Actions :**
1. Désigner le RSSI (Responsable Sécurité des Systèmes d'Information)
2. Désigner le DPO (Délégué à la Protection des Données) — RGPD
3. Cartographier tous les actifs du système Factur-X
4. Conduire une Gap Analysis sur les 93 contrôles Annex A
5. Identifier les risques critiques (registre de risques initial)
6. Définir formellement le périmètre SMSI
7. Obtenir l'engagement de la direction (clause 5.1)

**Livrables :**
- Rapport de Gap Analysis (% conformité actuelle)
- Inventaire des actifs
- Périmètre SMSI documenté
- Lettre d'engagement direction

---

### Phase 2 — Politiques et Procédures SMSI (Mois 2-3)

**Politiques à rédiger (A.5.1) :**

```
docs/security/policies/
├── politique-securite-information.md       # Politique SMSI chapeau
├── politique-controle-acces.md             # IAM, RBAC, MFA
├── politique-cryptographie.md              # Algorithmes, HSM, rotation clés
├── politique-gestion-incidents.md          # CSIRT, classification, SLA
├── politique-sauvegarde.md                 # 3-2-1, test restauration
├── politique-developpement-securise.md     # SDLC, SAST, revue code
├── politique-gestion-fournisseurs.md       # Due diligence tiers (A.5.19-22)
├── politique-classification-information.md # 4 niveaux classification
├── politique-teletra vail.md              # Accès distant sécurisé
├── politique-retention-donnees.md          # RGPD + LPF 6 ans
└── politique-gestion-vulnerabilites.md     # CVE, patch management
```

---

### Phase 3 — IAM et Contrôle d'Accès (Mois 3-4)

**Implémentation :**

```bash
# Déploiement Keycloak (IAM open-source)
helm install keycloak bitnami/keycloak \
  --set auth.adminPassword="${KEYCLOAK_ADMIN_PASS}" \
  --set postgresql.enabled=true \
  --set tls.enabled=true

# Configuration realms Factur-X
# - Realm: facturx-prod
# - Clients: api-gateway, facturx-core, invoice-portal
# - Flows MFA: Obligatoire pour tous les rôles
# - Protocole: OIDC avec PKCE

# HashiCorp Vault pour secrets et PAM
helm install vault hashicorp/vault \
  --set server.ha.enabled=true \
  --set server.ha.raft.enabled=true
```

---

### Phase 4 — Infrastructure Sécurisée (Mois 4-6)

**Terraform modules à créer :**

```hcl
# modules/network/main.tf
# VPC avec 3 tiers de subnets
# Security Groups restrictifs
# VPC Flow Logs → SIEM
# WAF + Shield Advanced

# modules/hsm/main.tf
# AWS CloudHSM cluster (2 HSMs min pour HA)
# PKCS#11 client configuration
# IAM roles pour accès applicatif

# modules/storage/main.tf
# S3 buckets chiffrés + WORM (Object Lock)
# Lifecycle policies (6 ans + 1 mois)
# Cross-region replication
# Access logging

# modules/monitoring/main.tf
# CloudWatch Logs → Kinesis → Wazuh SIEM
# CloudTrail (management + data events)
# Config Rules (conformité continue)
# GuardDuty (détection menaces)
```

---

### Phase 5 — Cryptographie et HSM (Mois 5-7)

**Intégration HSM dans `lib/factur-x-ts` :**

```typescript
// lib/factur-x-ts/src/crypto/HsmSigner.ts
import { PKCS11 } from 'pkcs11js';

export class HsmSigner {
  async signXml(xmlContent: string, certId: string): Promise<string> {
    // 1. Se connecter au HSM via PKCS#11
    // 2. Localiser le certificat par certId
    // 3. Calculer le hash SHA-256 du contenu canonicalisé (C14N)
    // 4. Signer dans le HSM (clé privée ne quitte JAMAIS le HSM)
    // 5. Intégrer la signature XAdES-B-LTA
    // 6. Horodater via TSA qualifiée (RFC 3161)
    // 7. Retourner le XML signé avec preuve
  }

  async signPdf(pdfBytes: Buffer, certId: string): Promise<Buffer> {
    // Signature PAdES-LTA via HSM
    // Intégration dans PDF/A-3
  }
}
```

---

### Phase 6 — SIEM et Monitoring (Mois 6-8)

**Déploiement Wazuh SIEM :**

```yaml
# wazuh-docker-compose.yml
# Wazuh Manager + Elasticsearch + Kibana
# Agents sur tous les serveurs
# Règles personnalisées pour événements Factur-X :
#   - Génération/signature facture
#   - Accès HSM
#   - Erreurs validation XSD
#   - Tentatives accès non autorisé
```

---

### Phase 7 — Pipeline CI/CD Sécurisé (Mois 7-8)

**GitHub Actions sécurisé :**

```yaml
# .github/workflows/security.yml
name: Security Pipeline
on: [push, pull_request]

jobs:
  secrets-detection:
    uses: ./.github/workflows/gitleaks.yml

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/typescript
            p/nodejs

  sca:
    runs-on: ubuntu-latest
    steps:
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: aquasecurity/trivy-action@master
        with:
          severity: CRITICAL,HIGH
          exit-code: 1

  sign-image:
    needs: [sast, sca, container-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: sigstore/cosign-installer@main
      - run: cosign sign --key env://COSIGN_KEY $IMAGE
```

---

### Phase 8 — Tests de Sécurité (Mois 8-10)

**Plan de tests :**

```
Test d'intrusion externe (pentest) :
  Périmètre : APIs publiques Factur-X, portail web
  Durée : 5 jours
  Prestataire : PASSI (Prestataire Audit SSI — liste ANSSI)
  Rapport : Remis sous 10 jours après tests
  Remédiation : < 30 jours pour vulnérabilités critiques

Test d'intrusion interne :
  Périmètre : Réseau interne, mouvements latéraux
  Simulation : Attaquant avec accès physique ou compte compromis
  Focus : Accès au HSM, exfiltration factures

Red Team Exercise (Annuel) :
  Simulation APT complète
  Objectif : Atteindre le HSM sans détection SIEM
  Durée : 2-3 semaines

Tests de chargement (Disponibilité) :
  Scénario : 10000 factures/heure
  Objectif : Valider RTO/RPO et limites de scalabilité
```

---

### Phase 9 — Formation et Sensibilisation (Mois 8-10)

**Programme de sensibilisation (A.6.3) :**

```
Formation obligatoire annuelle :
  • Phishing et ingénierie sociale (simulation de phishing)
  • Gestion sécurisée des mots de passe et MFA
  • Classification des données (comment traiter une facture confidentielle)
  • Procédures de signalement d'incidents

Formation spécialisée (par rôle) :
  Développeurs :
    • OWASP Top 10 pour APIs
    • Secure coding TypeScript/Node.js
    • Manipulation sécurisée des XML (prévention XXE)
    • Utilisation du HSM et des certificats eIDAS

  Ops/Infrastructure :
    • Durcissement cloud (CIS Benchmarks)
    • Réponse aux incidents (exercices pratiques)
    • Gestion des secrets avec Vault

  Management :
    • Responsabilités RSSI et obligations légales
    • RGPD : droits des personnes, obligation de notification
```

---

### Phase 10 — Audit Interne (Mois 10-12)

**Plan d'audit interne (A.9.2) :**

```
Audit 1 — Contrôles techniques (Mois 10) :
  Auditeurs internes : 2 personnes formées ISO 27001 Lead Auditor
  Périmètre : IAM, cryptographie, SIEM, backup
  Durée : 1 semaine
  Rapport + plan de remédiation

Audit 2 — Processus et procédures (Mois 11) :
  Périmètre : Politiques documentées, formation, gestion incidents
  Méthode : Interviews + vérification preuves documentaires

Revue de direction (Mois 12) :
  Ordre du jour :
    • Résultats audits internes
    • Statut des risques (registre)
    • Non-conformités et actions correctives
    • Objectifs sécurité atteints / non atteints
    • Ressources nécessaires pour la certification
    • Décision sur la portée de l'audit de certification
```

---

### Phase 11 — Audit de Certification (Mois 13-15)

**Processus de certification ISO 27001 :**

```
Organismes certificateurs accrédités COFRAC (France) :
  • Bureau Veritas Certification
  • LRQA (Lloyd's Register)
  • BSI Group France
  • Apave Certification
  • AFNOR Certification

Étapes de l'audit de certification :
  Étape 1 — Revue documentaire (2-3 jours) :
    • L'auditeur examine la documentation SMSI
    • Politiques, SoA, analyse de risques, procédures
    • Rapport : points à corriger avant Étape 2
    • Délai entre Étape 1 et 2 : 1-3 mois

  Étape 2 — Audit sur site (3-5 jours pour PME) :
    • Vérification de l'implémentation réelle des contrôles
    • Interviews du RSSI, DPO, développeurs, ops
    • Tests techniques (accès, logs, chiffrement)
    • Non-conformités majeures → rejet (re-audit requis)
    • Non-conformités mineures → plan d'action < 90 jours

  Décision de certification :
    • Validité : 3 ans
    • Surveillance : Audit annuel (1-2 jours)
    • Renouvellement : Audit complet à 3 ans
```

---

### Phase 12 — Amélioration Continue (Mois 16+)

```
Cycle PDCA (Plan-Do-Check-Act) :
  Plan   : Revue risques + objectifs annuels
  Do     : Implémentation des contrôles
  Check  : Audits internes + métriques SMSI
  Act    : Amélioration + traitement non-conformités

Métriques SMSI mensuelles :
  • Nombre d'incidents de sécurité (P1/P2/P3)
  • Temps moyen de détection (MTTD)
  • Temps moyen de remédiation (MTTR)
  • Taux de vulnérabilités corrigées dans les SLA
  • Disponibilité service (objectif : 99.9%)
  • Couverture formation sécurité (objectif : 100%)
  • Tests de restauration backup réussis
```

---

## 9. Audit et Certification

### Documents obligatoires pour l'audit (ISO 27001:2022)

```
Documents et enregistrements requis :
  ✅ Périmètre SMSI (clause 4.3)
  ✅ Politique de sécurité de l'information (clause 5.2)
  ✅ Processus d'évaluation et traitement des risques (clause 6.1.2)
  ✅ Déclaration d'Applicabilité / SoA (clause 6.1.3)
  ✅ Plan de traitement des risques (clause 6.1.3)
  ✅ Objectifs de sécurité (clause 6.2)
  ✅ Preuves de compétence (clause 7.2)
  ✅ Programme d'audit interne (clause 9.2)
  ✅ Résultats des audits internes (clause 9.2)
  ✅ Résultats des revues de direction (clause 9.3)
  ✅ Non-conformités et actions correctives (clause 10.1)
  ✅ Résultats des mesures de sécurité (clause 9.1)
```

---

## 10. Coûts et Délais

### Estimation pour une PME SaaS (10-50 personnes)

| Poste | Coût estimé | Récurrence |
|-------|-------------|------------|
| RSSI (interne ou RSSI externalisé) | 50-100k€/an | Annuel |
| Formation ISO 27001 Lead Implementer (équipe) | 3-5k€/pers | Unique |
| Gap Analysis (cabinet conseil) | 15-30k€ | Unique |
| Rédaction documentation + politiques | 20-40k€ | Unique |
| Infrastructure sécurité (WAF, SIEM, HSM) | 30-80k€/an | Annuel |
| HSM AWS CloudHSM | ~18k€/an | Annuel |
| QTSP (certificats qualifiés eIDAS) | 1-5k€/an | Annuel |
| Pentest externe (PASSI) | 10-20k€ | Annuel |
| Audit de certification (Étape 1 + 2) | 8-15k€ | 3 ans |
| Audits de surveillance | 4-8k€ | Annuel |
| Formation équipe (sensibilisation) | 2-5k€/an | Annuel |
| **TOTAL investissement initial** | **~150-300k€** | Unique |
| **TOTAL coût récurrent** | **~80-150k€/an** | Annuel |

### Délais réalistes

```
Délai minimum réaliste pour une PME sans SMSI existant :
  Gap Analysis + Plan : 2-3 mois
  Implémentation      : 6-9 mois
  Audits internes     : 2-3 mois
  Audit certification : 2-3 mois
  ──────────────────────────────
  TOTAL               : 12-18 mois

Facteurs accélérateurs :
  ✅ ISO 27001 Lead Implementer en interne
  ✅ Consultant externe dédié
  ✅ Infrastructure cloud déjà en place
  ✅ Politiques de sécurité existantes (même informelles)
  ✅ Équipe sensibilisée à la sécurité

Facteurs ralentisseurs :
  ❌ Aucune pratique sécurité existante
  ❌ Résistance au changement organisationnel
  ❌ Périmètre SMSI trop large (démarrer petit)
  ❌ Pas de budget RSSI dédié
```

---

## 11. Conformité Réglementaire Complémentaire

### Articulation ISO 27001 avec les autres référentiels

```
ISO 27001 ─────────────────────────────────────────────────────────┐
  │                                                                  │
  ├── RGPD (UE 2016/679)                                           │
  │   • DPO désigné + registre traitements                        │
  │   • PIA (Privacy Impact Assessment) sur traitement factures    │
  │   • Droits personnes (accès, rectification, effacement)        │
  │   • Notification violation < 72h (CNIL)                       │
  │   • Conservation limitée (sauf obligation légale 6 ans)        │
  │                                                                  │
  ├── eIDAS 2.0 (UE 910/2014 révisé)                             │
  │   • Signatures qualifiées (QES/QSeal) via QTSP                │
  │   • Reconnaissance transfrontalière UE                         │
  │   • EUDI Wallet (identité numérique — optionnel)              │
  │                                                                  │
  ├── NIS2 (UE 2022/2555)                                         │
  │   • Si prestataire de services numériques ou OSE              │
  │   • Déclaration ANSSI                                          │
  │   • Notification incidents < 24h (alerte) / 72h (rapport)    │
  │   • Mesures sécurité minimales (overlap avec ISO 27001)        │
  │                                                                  │
  ├── LPF art. L. 102 B (Droit fiscal français)                  │
  │   • Conservation factures 6 ans                                │
  │   • Lisibilité, intégrité, authenticité (3 garanties)         │
  │   • Accès DGFiP en cas de contrôle fiscal                     │
  │   • Format : PDF/A-3 signé + XML Factur-X = conformité        │
  │                                                                  │
  └── Arrêté du 7 octobre 2022 (France — facture électronique)    │
      • Obligation B2B progressive : 2026-2027                     │
      • Plateformes de dématérialisation partenaires (PDP)        │
      • Annuaire AIFE / Chorus Pro                                 │
      • Formats acceptés : Factur-X, UBL 2.1, CII D22B
```

### Checklist conformité DGFiP pour l'archivage des factures

```
✅ Format : PDF/A-3 (ISO 19005-3) avec XML Factur-X embarqué
✅ Intégrité : Signature électronique qualifiée (XAdES-LTA ou PAdES-LTA)
✅ Authenticité : Certificat qualifié QTSP identifiant l'émetteur
✅ Lisibilité : PDF lisible sans logiciel propriétaire
✅ Conservation : 6 ans minimum (10 ans recommandé pour sécurité)
✅ Immuabilité : Stockage WORM (Object Lock S3)
✅ Accès DGFiP : Procédure documentée de communication en cas de contrôle
✅ Horodatage : TSA qualifiée RFC 3161 sur chaque facture
✅ Journalisation : Logs d'audit tamper-proof (qui a créé/modifié quand)
```

---

## 12. Outils et Stack Technologique

### Stack recommandée par couche

```
COUCHE 1 — PÉRIMÈTRE
  WAF          : AWS WAF v2 + Règles managées (OWASP) | Cloudflare Enterprise
  DDoS         : AWS Shield Advanced | Cloudflare Magic Transit
  CDN          : CloudFront | Cloudflare

COUCHE 2 — API GATEWAY
  Gateway      : Kong Gateway (OS) | AWS API Gateway | Traefik
  Rate Limit   : Kong rate-limiting plugin | Redis-based
  Schema valid.: Ajv (JSON Schema) + xmllint (XSD)

COUCHE 3 — IAM
  IdP          : Keycloak (OS, self-hosted) | Auth0 | Okta
  PAM          : HashiCorp Vault + Teleport (OS) | CyberArk
  MFA          : TOTP (Keycloak built-in) + FIDO2/WebAuthn (YubiKey)
  SSO          : OIDC/OAuth2 via Keycloak

COUCHE 4 — RÉSEAU
  IaC          : Terraform + Terragrunt
  IDS/IPS      : Suricata (OS) | AWS GuardDuty
  Service Mesh : Istio (mTLS) | Linkerd
  Policy       : OPA (Open Policy Agent) + Kyverno

COUCHE 5 — SDLC SÉCURISÉ
  SAST         : Semgrep (OS) | SonarQube
  SCA          : Snyk | OWASP Dependency-Check (OS)
  Secrets      : Gitleaks (OS) | detect-secrets (Yelp)
  DAST         : OWASP ZAP (OS) | Burp Suite Pro
  Container    : Trivy (OS) | Grype
  Signing      : Cosign (Sigstore) — gratuit

COUCHE 6 — CRYPTOGRAPHIE
  HSM          : AWS CloudHSM | nShield Connect (Entrust)
  PKI          : EJBCA (OS) | cert-manager (K8s)
  Secrets Mgmt : HashiCorp Vault (OS) | AWS Secrets Manager
  TSA          : Universign | Sectigo | DigiCert

COUCHE 7 — DONNÉES
  DB           : PostgreSQL (RDS Aurora Multi-AZ)
  Stockage     : S3 + Object Lock | GCS + Retention Policy
  DLP          : AWS Macie | Google Cloud DLP
  Backup       : AWS Backup | Velero (K8s)
  Chiffrement  : AWS KMS (CMK) | Google Cloud KMS

COUCHE 8 — SIEM & MONITORING
  SIEM         : Wazuh (OS) | Elastic Security | Splunk
  Logs         : Fluent Bit → Kinesis → OpenSearch
  Alerting     : PagerDuty | OpsGenie
  Dashboards   : Grafana
  Threat Intel : MISP (OS) | VirusTotal API
  Vuln Mgmt    : Tenable.io | OpenVAS (OS)

COUCHE 9 — INCIDENT RESPONSE
  SOAR         : TheHive (OS) + Cortex | Splunk SOAR
  Forensics    : Velociraptor (OS) | DFIR-ORC
  Communication: Mattermost (OS) | Slack (war room dédié)

COUCHE 10 — CONTINUITÉ & CONFORMITÉ
  Backup test  : Runbooks automatisés (Ansible)
  Conformité   : Prowler (OS — AWS security) | ScoutSuite
  GRC          : Eramba (OS) | ISMS.online
  NTP          : chrony (Linux) + serveurs Stratum 1 (pool.ntp.org)
```

### Coût infrastructure sécurité mensuel (estimation AWS, production)

```
AWS CloudHSM (2 HSMs) :         ~1 500 €/mois
AWS WAF + Shield Advanced :      ~500 €/mois
RDS Aurora PostgreSQL (Multi-AZ): ~400 €/mois
S3 + Object Lock (1 TB/mois) :  ~50 €/mois
AWS KMS (CMK + requêtes) :       ~50 €/mois
EKS (3 nœuds) :                 ~300 €/mois
GuardDuty + Security Hub :       ~200 €/mois
CloudTrail + CloudWatch :        ~100 €/mois
Secrets Manager :                ~50 €/mois
──────────────────────────────────────────
TOTAL infra sécurité estimé :   ~3 150 €/mois
```

---

## 13. Feuille de Route Prioritaire (Actions Concrètes)

### Priorité 1 — Immédiat (J0-J90) : Sécurité de Base et Conformité Légale

| # | Action | Contrôle ISO 27001 | Durée |
|---|--------|--------------------|-------|
| 1 | Activer MFA sur tous les accès (admin, dev, comptable) | A.8.5 | 1 semaine |
| 2 | Inventaire des actifs : flux de factures, clés, archives | A.5.9 | 2 semaines |
| 3 | Chiffrement AES-256 archives + TLS 1.3 en transit | A.8.24 | 2 semaines |
| 4 | Journalisation centralisée des accès aux factures | A.8.15 | 3 semaines |
| 5 | Signer DPAs RGPD avec tous les sous-traitants cloud | A.5.19 | 1 mois |
| 6 | Documenter politique de conservation 6 ans (LPF L.102 B) | A.5.33 | 2 semaines |
| 7 | Protéger parseurs XML/CII contre XXE/injection XML | A.8.28 | 3 semaines |

**Parseur XML sécurisé (exemple Node.js/TypeScript) :**

```typescript
import { XMLParser } from 'fast-xml-parser';

function parseCiiSecure(xmlContent: string): object {
  if (xmlContent.length > 10 * 1024 * 1024) {
    throw new Error('XML trop volumineux — attaque potentielle');
  }
  const parser = new XMLParser({
    allowBooleanAttributes: false,
    processEntities: false,   // Désactiver les entités externes (protection XXE)
    ignoreDeclaration: true,
    parseAttributeValue: false,
  });
  return parser.parse(xmlContent);
}
```

### Priorité 2 — Court Terme (M3-M6) : SMSI et Certification

1. Lancer la gap analysis ISO 27001:2022 formelle (outil : Vanta, Sprinto, ou tableau Excel structuré)
2. Constituer le registre des risques avec ISO 27005 ou EBIOS Risk Manager (contexte ANSSI)
3. Rédiger le Statement of Applicability (SoA) avec justifications d'exclusion
4. Déployer SIEM Wazuh avec règles spécifiques facturation (voir règles ci-dessous)
5. Contractualiser avec un SAE certifié NF Z42-013 / NF 461 pour l'archivage probatoire
6. Première sensibilisation du personnel : fraude à la facture (BEC), non-altération obligatoire

### Priorité 3 — Moyen Terme (M6-M18) : Certification et Conformité Avancée

1. Obtenir la certification ISO 27001:2022 (audit Stage 1 + Stage 2 par organisme accrédité COFRAC)
2. Intégrer signatures XAdES-LTA / PAdES-LTA sur les flux Factur-X (horodatage TSA qualifié)
3. Déployer PKI avec HSM certifié eIDAS QSCD pour les sceaux électroniques
4. Préparer la conformité PDP pour la facturation obligatoire France 2026/2027
5. Conduire le premier pentest annuel par un PASSI référencé ANSSI

---

## 14. Règles SIEM Spécifiques Facturation (Wazuh)

Règles à déployer dans Wazuh pour détecter les menaces spécifiques à la facturation électronique :

```yaml
# Règle 1 : Tentative de modification d'une facture archivée (fraude)
- rule:
    id: 100001
    level: 15
    description: "Tentative de modification d'une facture archivée (fraude potentielle)"
    match:
      - field: action
        value: "INVOICE_MODIFY"
      - field: invoice.status
        value: "ARCHIVED"
    group: invoice-fraud

# Règle 2 : Export massif de factures (exfiltration de données)
- rule:
    id: 100002
    level: 12
    description: "Export massif de factures — exfiltration potentielle"
    frequency: 50      # plus de 50 exports
    timeframe: 300     # en 5 minutes
    filter:
      - field: action
        value: "INVOICE_EXPORT"
    group: data-exfiltration

# Règle 3 : Accès aux archives hors heures ouvrables
- rule:
    id: 100003
    level: 8
    description: "Accès aux archives de factures hors heures ouvrables"
    match:
      - field: action
        value: ["INVOICE_READ", "INVOICE_EXPORT"]
    time_restriction:
      not_between: "08:00-19:00"
      days: "1-5"
    group: suspicious-access

# Règle 4 : Injection XML malformée (attaque sur parseur Factur-X)
- rule:
    id: 100004
    level: 14
    description: "Tentative d'injection XML / XXE dans un flux Factur-X"
    match:
      - field: error.type
        value: ["XXE_DETECTED", "XML_ENTITY_EXPANSION", "XML_PARSE_ERROR"]
    group: application-attack

# Règle 5 : Changement de RIB dans une facture récurrente (BEC)
- rule:
    id: 100005
    level: 13
    description: "Changement d'IBAN dans une facture récurrente — signal fraude BEC"
    match:
      - field: action
        value: "IBAN_CHANGE"
      - field: invoice.is_recurring
        value: "true"
    group: invoice-fraud
```

### Sources de Logs à Ingérer dans le SIEM

| Source | Événements clés | Rétention légale |
|--------|-----------------|-----------------|
| API Gateway | Toutes requêtes, 401/403, rate limits | 6 ans |
| Service de facturation | Création, modification, envoi, réception, archivage | 6 ans |
| Service de signature | Signatures, validations XAdES/PAdES, échecs | 6 ans |
| Connecteur PDP | Acquittements AS4, rejets, timeouts | 6 ans |
| SAE/Archive | Dépôts, recherches, consultations, exports | 6 ans |
| HSM | Opérations cryptographiques (audit HSM natif) | 6 ans |
| IAM/Keycloak | Connexions, MFA, escalade de privilèges | 6 ans |
| Infrastructure | Changements de configuration, déploiements | 3 ans min. |

---

## 15. Coûts PME SaaS — Estimation Réaliste

Pour une PME SaaS de 10-50 employés (CA < 5M EUR) :

| Poste | Coût minimum | Coût maximum | Commentaire |
|-------|-------------|-------------|-------------|
| Conseil/RSSI fractionné (3-6 mois) | 15 000 € | 40 000 € | Accompagnement gap analysis + SMSI |
| Outils GRC SaaS (Vanta/Sprinto/Drata) | 3 000 €/an | 15 000 €/an | Automatisation des preuves |
| Audit de certification (organisme COFRAC) | 5 000 € | 15 000 € | LRQA, BSI, Bureau Veritas, AFNOR |
| Formation du personnel | 2 000 € | 8 000 € | Sensibilisation + formation RSSI |
| Infrastructure sécurisée (delta annuel) | 10 000 €/an | 30 000 €/an | HSM cloud, SIEM, WAF |
| Pentest PASSI annuel | 8 000 € | 25 000 € | Obligatoire annuellement |
| **TOTAL Année 1** | **43 000 €** | **133 000 €** | Moyenne : ~70 000 € |
| **Renouvellement annuel (Années 2-3)** | **15 000 €** | **45 000 €** | Surveillance + audit de suivi |

**Organismes de certification accrédités COFRAC (France) :**
- **AFNOR Certification** — référence française
- **Bureau Veritas** — présence internationale forte
- **BSI Group** — très crédible pour l'export (UK/Europe)
- **LRQA** (ex-Lloyd's) — fort secteur tech
- **TÜV Rheinland** — référence DACH + France

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **SMSI** | Système de Management de la Sécurité de l'Information |
| **SoA** | Statement of Applicability — Liste des 93 contrôles avec applicabilité justifiée |
| **RSSI** | Responsable de la Sécurité des Systèmes d'Information |
| **DPO** | Data Protection Officer — obligatoire si traitement à grande échelle de données personnelles |
| **HSM** | Hardware Security Module — coffre-fort physique pour clés cryptographiques |
| **QTSP** | Qualified Trust Service Provider — prestataire de confiance qualifié eIDAS |
| **QES** | Qualified Electronic Signature — signature électronique qualifiée (valeur légale maximale) |
| **QSeal** | Qualified Electronic Seal — cachet serveur qualifié pour signature automatisée |
| **XAdES-LTA** | XML Advanced Electronic Signature — Long Term Archival |
| **PAdES-LTA** | PDF Advanced Electronic Signature — Long Term Archival |
| **PKCS#11** | Interface standard pour HSM |
| **TSA** | Timestamp Authority — autorité d'horodatage qualifiée |
| **RTO** | Recovery Time Objective — temps max pour rétablir le service |
| **RPO** | Recovery Point Objective — perte de données max acceptable |
| **PASSI** | Prestataire d'Audit de Sécurité des Systèmes d'Information (qualification ANSSI) |
| **WORM** | Write Once Read Many — stockage immuable |
| **Zero Trust** | Modèle de sécurité : ne jamais faire confiance, toujours vérifier |
| **SIEM** | Security Information and Event Management |
| **SOAR** | Security Orchestration, Automation and Response |
| **PAM** | Privileged Access Management |
| **PDP** | Plateforme de Dématérialisation Partenaire (réforme facture électronique France 2026) |

---

*Document créé le 2026-03-04 — Révision prévue : 2026-09-04*
*Propriétaire : RSSI — Approbation : Direction Générale*
*Classification : INTERNE — Ne pas diffuser sans autorisation*
