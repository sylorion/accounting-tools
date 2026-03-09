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
13. [Feuille de Route Prioritaire](#13-feuille-de-route-prioritaire)
14. [Règles SIEM Spécifiques Facturation](#14-règles-siem-spécifiques-facturation)
15. [Coûts PME SaaS — Estimation Réaliste](#15-coûts-pme-saas)
16. [Plateforme Agréée (PA) — Certification DGFiP](#16-plateforme-agréée-pa)
17. [SoA Complète — 93 Contrôles ISO 27001:2022](#17-soa-complète--93-contrôles)
18. [Procédure de Key Ceremony HSM](#18-procédure-de-key-ceremony-hsm)
19. [Contrôles Physiques A.7 — Délégation Cloud](#19-contrôles-physiques-a7--délégation-cloud)
20. [DPIA — Analyse d'Impact sur la Protection des Données](#20-dpia--analyse-dimpact)
21. [Architecture Multi-Tenant — Isolation des Données](#21-architecture-multi-tenant)
22. [PAF — Piste d'Audit Fiable (Implémentation Technique)](#22-paf--piste-daudit-fiable)
23. [Matrice de Compétences et Certifications](#23-matrice-de-compétences)
24. [Modèle de Menaces STRIDE (Pipeline Factur-X PA)](#24-modèle-de-menaces-stride)

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
| Code source (`packages/core`, `packages/templates`) | INTERNE | CTO | HAUTE |
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
    - Code review: 2 reviewers minimum pour `packages/core/`

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
│  │  Interface : PKCS#11 (packages/core → HSM)     │         │
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

**Intégration HSM dans `packages/core` :**

```typescript
// packages/core/src/crypto/HsmSigner.ts
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

## 16. Plateforme Agréée (PA) — Certification DGFiP

### 16.1 Contexte Réglementaire

**Base légale :**

```
Loi de Finances Rectificative 2022 (n°2022-1157) — Art. 26
Ordonnance n°2021-1190 du 15 septembre 2021
Arrêté du 7 octobre 2022 (spécifications techniques)
Décret n°2022-1299 du 7 octobre 2022 (conditions d'agrément PDP/PA)
```

**Calendrier de l'obligation d'émission (mars 2026) :**

```
Phase 1 — Sep 2026 : Grandes entreprises (CA > 50M€ ou > 250 salariés)
Phase 2 — Jan 2027 : ETI (CA > 10M€ ou > 50 salariés)
Phase 3 — Jan 2027 : PME / TPE / micro-entreprises

⚠️  L'OBLIGATION DE RÉCEPTION est effective dès Sep 2026 pour TOUTES les entreprises.
⚠️  L'inscription dans l'annuaire est ouverte DÈS MAINTENANT — s'inscrire sans attendre.
```

**Nouvelle nomenclature (depuis 2024) :**

```
PDP (Plateforme de Dématérialisation Partenaire) → PA (Plateforme Agréée)
PPF (Portail Public de Facturation)              → maintenu sous AIFE/Chorus Pro

Statut mars 2026 :
  ✅ Annuaire des PA ouvert aux candidatures — inscription possible maintenant
  ✅ Sandbox PPF disponible pour tests d'interopérabilité
  ✅ Plusieurs PA déjà référencées dans l'annuaire officiel
  ✅ Cahier des charges technique publié par DGFiP/AIFE
  ⚠️  Obtenir son agrément prend 6-12 mois — commencer IMMÉDIATEMENT
```

**Architecture globale du système PA :**

```
[Emetteur ERP/Comptabilité]
    │ Facture (Factur-X, UBL ou CII)
    ▼
[PA Emetteur] ←── Notre plateforme (objet de cette certification)
    │
    ├──→ [PPF / AIFE]  ← E-reporting TVA (transaction + paiement)
    │                  ← Annuaire lookup (quel PA pour quel destinataire)
    │
    ├──→ [PA Destinataire]  ← AS4/PEPPOL ou API directe inter-PA
    │
    └──→ [PPF / Chorus Pro] ← Fallback si destinataire sur PPF
              │
              ▼
    [PA Destinataire]
              │ Statuts cycle de vie remontés
              ▼
    [Destinataire ERP/Comptabilité]
```

---

### 16.2 Processus de Candidature PA (DGFiP / AIFE)

```
PHASE 0 — Préparation du dossier (Mois 1-2)
  □ Constituer la personne morale déclarante (SIREN, représentant légal)
  □ Désigner le Responsable Technique PA (point de contact DGFiP permanent)
  □ Préparer les documents de conformité sécurité (ISO 27001 ou attestation)
  □ Ouvrir un compte sur le portail AIFE (portail-dgfip.finances.gouv.fr)
  □ Commencer les tests en sandbox (environnement disponible dès maintenant)

PHASE 1 — Dépôt du dossier de candidature
  Canal : formulaire DGFiP en ligne via portail AIFE
  Documents requis :
    □ Formulaire de demande d'agrément PA (formulaire officiel AIFE)
    □ Description des services proposés (émission / réception / e-reporting)
    □ Architecture technique (schéma détaillé + description)
    □ Référentiel de sécurité (ISO 27001 en cours ou attestation PASSI)
    □ Plan de Continuité d'Activité PA (RTO ≤ 4h, RPO ≤ 1h)
    □ Engagements SLA signés (99.5% minimum exigé par DGFiP)
    □ Preuves de capacité financière (bilan + garantie bancaire si requis)
    □ Assurance Responsabilité Professionnelle (RC Pro IT + RC exploitation)
    □ Politique de confidentialité des données fiscales
    □ Procédure de portabilité et exit plan client

PHASE 2 — Tests d'interopérabilité avec le Sandbox PPF (4-8 semaines)
  Environnement : sandbox.aife.economie.gouv.fr
  Tests obligatoires :
    □ Connexion API PPF authentifiée (OAuth 2.0 + certificat RGS**)
    □ Emission dans les 3 formats (Factur-X 1.07.2, UBL 2.1 BIS3, CII D22B)
    □ Réception et mise à disposition au destinataire
    □ Gestion complète du cycle de vie (7 statuts réglementaires)
    □ E-reporting TVA — données de transaction
    □ E-reporting TVA — données de paiement
    □ Consultation et mise à jour de l'annuaire
    □ Cas négatifs (factures rejetées, timeouts, erreurs format)
  Rapport de tests : délivré par AIFE — requis pour Phase 3

PHASE 3 — Instruction du dossier par DGFiP/AIFE (2-4 mois)
  Vérifications :
    □ Conformité technique (résultats des tests d'interopérabilité)
    □ Conformité sécurité (audit ou attestation valide)
    □ Conformité juridique (SIREN, statuts, représentant légal)
    □ Viabilité financière et opérationnelle
  Décision : Agrément accordé OU refus motivé avec possibilité de recours

PHASE 4 — Inscription dans l'Annuaire National
  URL officielle : https://annuaire-pa.aife.economie.gouv.fr
  Informations publiées :
    □ Dénomination de la PA + SIREN
    □ Services proposés (émission, réception, e-reporting)
    □ Formats supportés (Factur-X, UBL, CII)
    □ Endpoint technique de contact inter-PA
    □ Modalités d'inscription pour les entreprises clientes

PHASE 5 — Maintien de l'agrément
  □ Audit de surveillance annuel (AIFE peut demander preuves à tout moment)
  □ Mise à jour des informations dans l'annuaire (délai < 72h pour tout changement)
  □ Notification obligatoire des incidents majeurs à l'AIFE (< 24h)
  □ Renouvellement de l'agrément tous les 3 ans
  □ Pentest annuel (PASSI) — rapport transmissible à l'AIFE sur demande
```

**Arborescence des documents candidature à créer :**

```
docs/pa-certification/
├── dossier-candidature-pa.md           # Formulaire DGFiP complété
├── architecture-technique-pa.md        # Schéma + description services
├── plan-continuite-activite-pa.md      # PCA spécifique PA (RTO 4h)
├── politique-securite-pa.md            # Sécurité des flux de facturation
├── sla-engagements-pa.md               # Engagements disponibilité
├── rapport-tests-interoperabilite.md   # Résultats tests PPF sandbox
├── assurance-rc-pro.pdf                # Police d'assurance RC Pro
└── exit-plan-client.md                 # Portabilité des données client
```

---

### 16.3 Cahier des Charges Technique PA

**Formats obligatoirement supportés :**

| Format | Spécification | Profil |
|--------|--------------|--------|
| Factur-X 1.07.2 | EN 16931 + FNFE-MPE | MINIMUM → EXTENDED |
| UBL 2.1 (PEPPOL BIS 3.0) | ISO/IEC 19845 | Invoice + Credit Note |
| CII D22B (UN/CEFACT) | ISO 19005 | CrossIndustryInvoice |

**Capacités fonctionnelles obligatoires :**

```yaml
services_pa_obligatoires:

  emission:
    description: Recevoir d'un émetteur et transmettre au destinataire
    formats_entrée: Tous les 3 formats + formats natifs ERP (via traduction)
    traduction_obligatoire: Oui — entre tous les formats supportés
    validation_avant_transmission: XSD + EN 16931 Schematron + règles métier
    délai_transmission: < 4h en J ouvrable

  réception:
    description: Recevoir des factures et les mettre à disposition du destinataire
    formats_sortie: Format demandé par le destinataire
    notification: Temps réel (webhook) ou quasi-temps réel (polling < 15 min)

  cycle_de_vie:
    statuts_obligatoires:
      DEPOSEE:           "Facture reçue et acceptée par la PA"
      MISE_A_DISPOSITION: "Facture disponible pour le destinataire"
      RECUE:             "Confirmation de réception par le destinataire"
      REJETEE:           "Rejet technique (format) ou fonctionnel (refus client)"
      APPROUVEE:         "Facture acceptée pour paiement"
      PAYEE:             "Paiement confirmé (optionnel selon accord bilatéral)"
      LITIGE:            "Contestation ouverte par le destinataire"
    transmission_PPF: Chaque statut transmis au PPF dans les 24h

  e_reporting:
    données_transaction:
      description: Données TVA de toutes les factures hors périmètre PA-PA
      champs: siren_emetteur, siren_destinataire, date, montant_ht, montant_tva,
              taux_tva, nature_operation, devise
      délai: J+3 après émission
      fréquence: Mensuel (régime général) ou trimestriel (micro-entreprises)
    données_paiement:
      description: Données d'encaissement pour suivi TVA encaissements
      champs: ref_facture, date_paiement, montant_paye, mode_paiement
      délai: J+3 après encaissement
    format: JSON structuré (schéma DGFiP — cahier des charges AIFE)
    endpoint: POST /e-reporting/transaction et /e-reporting/paiement (PPF API)

  annuaire:
    lookup_siren: Trouver la PA d'un destinataire par SIREN
    enregistrement_client: Inscrire/mettre à jour un assujetti sur notre PA
    délai_mise_à_jour: < 72h pour tout changement d'information
```

**API PPF — Connectivité technique :**

```yaml
api_ppf:
  authentification:
    méthode: OAuth 2.0 (Client Credentials Grant)
    certificat: RGS** ou certificat qualifié eIDAS (QSeal)
    token_expiry: 3600s
    renouvellement: Automatique avant expiration

  endpoints_critiques_PPF:
    # E-reporting
    POST /e-reporting/transaction: "Données TVA transaction"
    POST /e-reporting/paiement:    "Données TVA paiement"

    # Annuaire
    GET  /annuaire/assujetti/{siren}: "Lookup PA d'un destinataire"
    POST /annuaire/assujetti:         "Inscription client sur notre PA"

    # Cycle de vie
    POST /cycle-de-vie/statut: "Transmission statut (DEPOSEE, RECUE, etc.)"

    # Interopérabilité inter-PA
    POST /flux/facture/{pa_dest_id}: "Envoi facture vers autre PA via PPF"

  sla_ppf:
    disponibilité_sandbox: 99% (tests)
    disponibilité_production: 99.9% (exigence PA)
    timeout_api: 30s maximum
    retry_policy: Exponentiel backoff — 3 tentatives espacées

  sandbox: https://sandbox.aife.economie.gouv.fr/api/v1
  production: https://api.aife.economie.gouv.fr/api/v1
```

---

### 16.4 Architecture des Services PA (Implémentation)

**Arborescence à créer dans le projet :**

```
legacy/pa/
├── services/
│   ├── InvoiceRouter.ts          # Routing émetteur → PA dest. via annuaire
│   ├── FormatConverter.ts        # Factur-X ↔ UBL ↔ CII (libération)
│   ├── LifecycleManager.ts       # Gestion + transmission des 7 statuts
│   ├── EReportingService.ts      # E-reporting TVA vers PPF
│   └── AnnuaireService.ts        # Lookup SIREN + inscription clients
├── connectors/
│   ├── PPFConnector.ts           # API REST PPF (AIFE) — OAuth2 + RGS
│   ├── AS4Connector.ts           # Protocole AS4 inter-PA (optionnel)
│   └── PEPPOLConnector.ts        # Réseau PEPPOL (si Access Point certifié)
├── validators/
│   ├── InvoiceValidator.ts       # XSD + EN 16931 Schematron
│   └── EReportingValidator.ts    # Validation données TVA avant envoi PPF
├── archive/
│   ├── LegalArchive.ts           # Archivage WORM 10 ans (S3 Object Lock)
│   └── PAFAuditTrail.ts          # Journal immuable cycle de vie PA
└── api/
    └── PAGateway.ts              # Point d'entrée clients (auth + routing)
```

**Diagramme de séquence — Emission facture via PA :**

```
Emetteur      PA (Notre)     PPF/AIFE     PA Destinataire   Destinataire
   │               │              │               │               │
   │─POST facture─▶│              │               │               │
   │               │─Valider XSD──▶               │               │
   │               │◀─────OK──────│               │               │
   │               │─Lookup SIREN─▶               │               │
   │               │◀─PA dest.ID──│               │               │
   │               │──Transmettre───────────────────▶              │
   │◀─DEPOSEE──────│              │               │─Notifier──────▶
   │               │              │               │◀──RECUE────────│
   │               │─Statut RECUE─▶               │               │
   │◀─RECUE────────│              │               │               │
   │               │─E-reporting──▶               │               │
   │               │◀──Ack────────│               │               │
   │               │              │               │◀──APPROUVEE────│
   │               │─Statut APPR.─▶               │               │
   │◀─APPROUVEE────│              │               │               │
```

---

### 16.5 PEPPOL — Devenir Access Point (Optionnel mais Recommandé)

Pour les échanges transfrontaliers UE et l'interopérabilité avec les PA utilisant PEPPOL :

```
Certification OpenPEPPOL Access Point :

Étape 1 — Rejoindre OpenPEPPOL (openpeppol.org/get-involved)
  Coût : 2 000-5 000 EUR/an selon taille
  Prérequis : Personne morale établie dans un pays membre

Étape 2 — Certification Access Point
  Tests d'interopérabilité avec PEPPOL TestBed
  Format supporté obligatoire : PEPPOL BIS 3.0 (UBL 2.1)
  Durée : 3-6 mois, coût ~10 000 EUR

Étape 3 — Enregistrement SML/SMP
  SML (Service Metadata Locator) : Discovery DNS-based
  SMP (Service Metadata Publisher) : Déclaration des capabilities
  Identifiant PEPPOL : ISO 6523 + SIREN (0002:SIREN)

Avantages PA :
  ✅ Échanges transfrontaliers UE automatiques (Italie, Espagne, etc.)
  ✅ Interopérabilité native avec PA étrangères
  ✅ Crédibilité technique + différenciateur commercial
  ✅ Format UBL/PEPPOL déjà supporté → investissement marginal
```

---

### 16.6 SLA et Obligations Contractuelles de la PA

```yaml
sla_pa_obligatoires_DGFiP:
  disponibilité:
    minimum_réglementaire: 99.5%
    objectif_recommandé: 99.9% (3 nines)
    calcul: (temps_total - indisponibilité) / temps_total × 100
    exclusions: Maintenance programmée avec préavis 72h minimum

  délais_de_traitement:
    émission_vers_destinataire: < 4h (J ouvrable)
    statuts_cycle_de_vie: Répercussion < 24h
    e_reporting_TVA: Transmission < J+3 après événement
    lookup_annuaire: Réponse < 1s (SLA technique)

  rétention_données:
    factures: 10 ans minimum (recommandation DGFiP pour PA)
    logs_audit: 6 ans (conformité fiscale LPF)
    données_e_reporting: Jusqu'à confirmation DGFiP de réception

  incidents:
    notification_AIFE: < 24h pour tout incident impactant la transmission de factures
    notification_clients: < 2h pour indisponibilité > 30 min
    plan_communication: Template message client à préparer à l'avance

obligations_contractuelles_clients_PA:
  contrat_PA_à_rédiger:
    - Périmètre des services (émission seule / réception seule / les deux)
    - SLA garantis et pénalités contractuelles en cas de manquement
    - Durée de conservation des données (10 ans)
    - Procédure de portabilité des données (export format standard)
    - Exit plan : délai de préavis 3 mois, assistance à la migration
    - Responsabilité en cas d'erreur de routage (facture mal acheminée)
    - Clause de confidentialité des données financières B2B
    - DPA RGPD Art. 28 (PA est sous-traitant de données personnelles)
```

---

### 16.7 Sécurité Spécifique PA (Exigences DGFiP)

```yaml
exigences_securite_PA:
  certification_sécurité:
    attendu: ISO 27001:2022 ou SOC2 Type II (de facto standard pour agrément PA)
    alternative_acceptable: Attestation PASSI (pentest complet) + politique sécurité formalisée
    délai: Fournir preuve ou plan d'obtention dans le dossier de candidature

  pentest_obligatoire:
    fréquence: Annuel minimum
    prestataire: PASSI référencé ANSSI (liste sur anssi.gouv.fr)
    périmètre: APIs publiques PA + connectivité PPF + interface annuaire + archivage
    rapport: Transmissible à l'AIFE sur demande dans les 5 jours

  droit_de_communication_DGFiP:
    délai_réponse: 72h pour toute demande de consultation (contrôle fiscal)
    format_export: XML (Factur-X) ou CSV structuré selon format DGFiP
    interface_dédiée: Portail lecture seule pour inspecteurs DGFiP authentifiés
    journalisation: Toute consultation DGFiP loggée dans SIEM (WORM)

  traçabilité_obligatoire:
    journal_immuable: Toutes les opérations sur chaque facture (WORM)
    horodatage: TSA qualifiée RFC 3161 sur chaque événement de cycle de vie
    identification: UserID + IP + timestamp pour chaque action

  chiffrement:
    transit: TLS 1.3 minimum — TLS 1.2 obsolète interdit pour les échanges PA
    repos: AES-256 pour toutes les factures stockées
    inter_PA: mTLS (mutual TLS) pour les échanges directs PA-PA

  ségrégation_données:
    isolation_tenants: Chiffrement et accès par client B2B (§21)
    accès_dev_prod: ZÉRO accès aux données de production sans PAM + double approbation
    accès_support: Lecture seule, durée limitée, loggé + approuvé par client
```

---

## 17. SoA Complète — 93 Contrôles ISO 27001:2022

> Statuts : ✅ Implémenté | 🔄 En cours | 📋 Planifié | ❌ Non applicable (justification)

**Objectif :** Atteindre 100% "Implémenté ou Justifié" avant l'audit Stage 2 (Phase 11).

### A.5 — Contrôles Organisationnels (37 contrôles)

| ID | Contrôle | Statut | Notes / Actions |
|----|----------|--------|-----------------|
| A.5.1 | Politiques de sécurité de l'information | 📋 Planifié | Politique SMSI chapeau + politiques thématiques (Phase 2) |
| A.5.2 | Rôles et responsabilités | 📋 Planifié | RSSI + DPO à désigner formellement — lettres de mission |
| A.5.3 | Séparation des tâches | 🔄 En cours | RBAC défini §Couche 3 — à implémenter Keycloak |
| A.5.4 | Responsabilités de la direction | 📋 Planifié | Lettre d'engagement direction + budget RSSI |
| A.5.5 | Contacts avec les autorités | 📋 Planifié | Registre : ANSSI, CNIL, DGFiP, AIFE, CERT-FR |
| A.5.6 | Contacts groupes d'intérêt spéciaux | 📋 Planifié | CLUSIF, CESIN, FNFE-MPE (groupes facturation électronique) |
| A.5.7 | Renseignement sur les menaces *(2022)* | 📋 Planifié | Flux MISP + abonnement CERT-FR + alertes ANSSI |
| A.5.8 | Sécurité dans la gestion de projet | 🔄 En cours | Checklist sécurité dans tickets GitHub — à formaliser |
| A.5.9 | Inventaire des actifs | 🔄 En cours | Inventaire §2.1 — compléter avec postes et licences |
| A.5.10 | Usage acceptable des actifs | 📋 Planifié | Charte informatique signée par tous les employés |
| A.5.11 | Restitution des actifs | 📋 Planifié | Procédure offboarding sécurisé (badge, accès, postes) |
| A.5.12 | Classification de l'information | ✅ Implémenté | 4 niveaux définis §2.2 |
| A.5.13 | Marquage de l'information | 📋 Planifié | Headers de classification sur tous les documents SMSI |
| A.5.14 | Transfert de l'information | 🔄 En cours | TLS 1.3 en transit — protocoles inter-PA en cours |
| A.5.15 | Contrôle d'accès | 🔄 En cours | RBAC §Couche 3 défini — Keycloak à déployer Phase 3 |
| A.5.16 | Gestion des identités | 📋 Planifié | Keycloak (Phase 3) — cycle de vie complet |
| A.5.17 | Informations d'authentification | 📋 Planifié | Politique MFA + rotation + gestionnaire de mots de passe |
| A.5.18 | Droits d'accès | 📋 Planifié | Revue trimestrielle des droits — processus à créer |
| A.5.19 | Sécurité relations fournisseurs | 📋 Planifié | DPA RGPD avec AWS, QTSP, AIFE + évaluation annuelle |
| A.5.20 | Sécurité accords fournisseurs | 📋 Planifié | Clauses sécurité dans tous les contrats fournisseurs |
| A.5.21 | Sécurité chaîne d'appro. TIC *(2022)* | 📋 Planifié | SBOM + audit npm + pinning dépendances (Phase 7) |
| A.5.22 | Surveillance des fournisseurs | 📋 Planifié | Revue annuelle certifications AWS, QTSP, AIFE |
| A.5.23 | Sécurité services cloud *(2022)* | 📋 Planifié | DPA AWS + AWS ISO 27001 + SOC2 vérifiés annuellement |
| A.5.24 | Planification gestion incidents | 📋 Planifié | CSIRT + playbooks §Couche 9 + notification AIFE |
| A.5.25 | Évaluation des événements de sécurité | 📋 Planifié | Processus triage SIEM P1/P2/P3 |
| A.5.26 | Réponse aux incidents | 📋 Planifié | Playbooks §Couche 9 — exercice semestriel |
| A.5.27 | Apprentissage des incidents | 📋 Planifié | Post-mortem systématique après tout incident P1/P2 |
| A.5.28 | Collecte de preuves | 📋 Planifié | Logs WORM + forensics Velociraptor + chaîne de custody |
| A.5.29 | Continuité de l'activité | 📋 Planifié | PCA §Couche 10 — test semestriel |
| A.5.30 | Préparation TIC continuité *(2022)* | 📋 Planifié | Multi-région RTO 4h, RPO 1h — test trimestriel |
| A.5.31 | Exigences légales et réglementaires | ✅ Implémenté | LPF, RGPD, eIDAS, NIS2, DGFiP/PA couverts §11 et §16 |
| A.5.32 | Droits de propriété intellectuelle | 📋 Planifié | Audit licences open-source (Phase 7) — interdire GPL en prod |
| A.5.33 | Protection des enregistrements | 📋 Planifié | SAE NF 461 + WORM 10 ans §Couche 7 |
| A.5.34 | Confidentialité et vie privée | 🔄 En cours | RGPD + DPIA §20 — DPO à désigner |
| A.5.35 | Revue indépendante de la sécurité | 📋 Planifié | Pentest PASSI annuel (Phase 8) + audit interne Phase 10 |
| A.5.36 | Conformité politiques et normes | 📋 Planifié | Contrôle conformité trimestriel automatisé (Prowler) |
| A.5.37 | Procédures d'exploitation documentées | 📋 Planifié | Runbooks Ansible pour opérations critiques |

### A.6 — Contrôles liés aux Personnes (8 contrôles)

| ID | Contrôle | Statut | Notes / Actions |
|----|----------|--------|-----------------|
| A.6.1 | Vérification des antécédents | 📋 Planifié | Casier B3 pour accès aux données financières (PA) |
| A.6.2 | Conditions d'emploi | 📋 Planifié | Clause confidentialité + obligation sécurité dans contrats |
| A.6.3 | Sensibilisation et formation | 📋 Planifié | Programme annuel §23 — obligatoire avant mise en prod PA |
| A.6.4 | Processus disciplinaire | ❌ Référencé RH | Renvoi règlement intérieur + code du travail — non inclus SMSI |
| A.6.5 | Fin/changement d'emploi | 📋 Planifié | Checklist offboarding : révocation accès < 24h, restitution postes |
| A.6.6 | Accords de confidentialité | 📋 Planifié | NDA systématique pour tout accès aux factures / clés PA |
| A.6.7 | Télétravail *(2022)* | 📋 Planifié | ZTNA + MFA + charte télétravail + chiffrement postes |
| A.6.8 | Signalement d'événements *(2022)* | 📋 Planifié | Canal signalement interne : email dédié + hotline RSSI |

### A.7 — Contrôles Physiques (14 contrôles)

> **Note :** Infrastructure 100% cloud AWS (eu-west-1 + eu-central-1). Les contrôles physiques sont délégués à AWS. Preuves : **AWS ISO 27001:2022 Certificate** + **AWS SOC2 Type II Report** (téléchargeables depuis AWS Artifact, à actualiser annuellement).

| ID | Contrôle | Statut | Notes / Actions |
|----|----------|--------|-----------------|
| A.7.1 | Périmètres de sécurité physique | ✅ Délégué AWS | AWS ISO 27001 A.7 + accès data center restreint |
| A.7.2 | Contrôles d'accès physiques | ✅ Délégué AWS | Biométrique + badge + accès dual-person AWS |
| A.7.3 | Sécurisation des bureaux | 📋 Planifié | Politique clean desk + locaux verrouillés + badges |
| A.7.4 | Surveillance physique *(2022)* | ✅ Délégué AWS | CCTV + surveillance 24/7 data centers AWS |
| A.7.5 | Protection menaces environnementales | ✅ Délégué AWS | Plans risques AWS (incendie, inondation, séisme) |
| A.7.6 | Travail en zone sécurisée | 📋 Planifié | PAM obligatoire pour tout accès infra production |
| A.7.7 | Bureau propre et écran vide | 📋 Planifié | Verrouillage auto < 5 min + politique clean desk signée |
| A.7.8 | Emplacement et protection équipements | ✅ Délégué AWS | HSM CloudHSM en cage sécurisée AWS (FIPS 140-2 L3) |
| A.7.9 | Actifs hors site | 📋 Planifié | Chiffrement full-disk obligatoire (BitLocker/FileVault) |
| A.7.10 | Supports de stockage | 📋 Planifié | Inventaire + destruction certifiée DIN 66399 niveau H-5 |
| A.7.11 | Utilités de support | ✅ Délégué AWS | Alimentation redondante + groupe électrogène AWS |
| A.7.12 | Sécurité câblage | ✅ Délégué AWS | Infrastructure réseau sécurisée AWS |
| A.7.13 | Maintenance des équipements | ✅ Délégué AWS | Contrats SLA maintenance AWS |
| A.7.14 | Mise au rebut et réutilisation | 📋 Planifié | Procédure destruction postes (DIN 66399 H-3 min) |

### A.8 — Contrôles Technologiques (34 contrôles)

| ID | Contrôle | Statut | Notes / Actions |
|----|----------|--------|-----------------|
| A.8.1 | Appareils des utilisateurs | 📋 Planifié | MDM + chiffrement full-disk + inventaire postes |
| A.8.2 | Droits d'accès privilégiés | 📋 Planifié | PAM HashiCorp Vault + session recording |
| A.8.3 | Restriction accès information | 🔄 En cours | RBAC défini — implémentation Keycloak en cours |
| A.8.4 | Accès au code source | 🔄 En cours | GitHub CODEOWNERS + branch protection + GPG signing |
| A.8.5 | Authentification sécurisée | 📋 Planifié | MFA TOTP + FIDO2 (admins) via Keycloak |
| A.8.6 | Gestion de la capacité | 📋 Planifié | Auto-scaling Kubernetes + alertes CloudWatch |
| A.8.7 | Protection contre les maliciels | 🔄 En cours | Scanning XML/PDF reçus + Trivy containers |
| A.8.8 | Gestion des vulnérabilités techniques | 🔄 En cours | Snyk SCA + Dependabot actif dans CI |
| A.8.9 | Gestion de la configuration *(2022)* | 🔄 En cours | Terraform + GitOps ArgoCD — drift detection |
| A.8.10 | Suppression de l'information *(2022)* | 📋 Planifié | Procédure RGPD art.17 + re-wrapping clés KMS |
| A.8.11 | Masquage des données *(2022)* | 📋 Planifié | Pseudonymisation en staging — données synthétiques |
| A.8.12 | Prévention des fuites DLP *(2022)* | 📋 Planifié | AWS Macie + alertes SIEM export IBAN/montants |
| A.8.13 | Sauvegarde des informations | 📋 Planifié | Règle 3-2-1-1 + tests mensuels §Couche 7 |
| A.8.14 | Redondance | 📋 Planifié | Multi-AZ + multi-région (eu-west-1 + eu-central-1) |
| A.8.15 | Journalisation | 🔄 En cours | CloudTrail + logs applicatifs — Wazuh en déploiement |
| A.8.16 | Activités de surveillance *(2022)* | 📋 Planifié | Wazuh SIEM + alertes SOC §14 |
| A.8.17 | Synchronisation des horloges | 📋 Planifié | NTP chrony + stratum 1 — CRITIQUE pour TSA horodatage |
| A.8.18 | Programmes utilitaires privilégiés | 📋 Planifié | Politique sudo + PAM avec enregistrement session |
| A.8.19 | Installation de logiciels | 📋 Planifié | Uniquement images signées Cosign admises en K8s |
| A.8.20 | Sécurité des réseaux | 🔄 En cours | VPC + Security Groups §Couche 4 |
| A.8.21 | Sécurité des services réseau | 🔄 En cours | TLS 1.3 + mTLS inter-services (Istio) |
| A.8.22 | Ségrégation des réseaux | 🔄 En cours | 3 VPCs isolés prod/staging/dev |
| A.8.23 | Filtrage web *(2022)* | 📋 Planifié | Whitelist URLs autorisées (PPF, TSA, OCSP, PEPPOL) |
| A.8.24 | Utilisation de la cryptographie | 🔄 En cours | AES-256 + TLS 1.3 — HSM en cours d'intégration |
| A.8.25 | Cycle de vie développement sécurisé | 🔄 En cours | SAST Semgrep + SCA Snyk dans CI/CD |
| A.8.26 | Exigences sécurité des applications | 🔄 En cours | Validation XSD/Schematron + API security |
| A.8.27 | Architecture sécurité *(2022)* | 📋 Planifié | Zero Trust + Defense in Depth documentés §3 |
| A.8.28 | Codage sécurisé *(2022)* | 🔄 En cours | Parseurs XML anti-XXE + secrets detection |
| A.8.29 | Tests de sécurité | 📋 Planifié | DAST ZAP + pentest PASSI annuel §Phase 8 |
| A.8.30 | Développement externalisé | ❌ Non applicable | Aucun développement externalisé actuellement |
| A.8.31 | Séparation dev/test/prod | ✅ Implémenté | 3 VPCs isolés + aucune donnée réelle en test/dev |
| A.8.32 | Gestion des changements | 🔄 En cours | GitFlow + PR reviews + CHANGELOG + déploiements signés |
| A.8.33 | Informations de test | ✅ Implémenté | Données synthétiques uniquement — Faker + XSD valides |
| A.8.34 | Protection SI en audit | 📋 Planifié | Interface lecture seule dédiée auditeurs DGFiP/COFRAC |

**Récapitulatif SoA :**

| Statut | Nombre | % |
|--------|--------|----|
| ✅ Implémenté | 10 | 11% |
| 🔄 En cours | 22 | 24% |
| 📋 Planifié | 59 | 63% |
| ❌ Non applicable | 2 | 2% |
| **TOTAL** | **93** | **100%** |

> **Objectif pré-audit :** Passer à ≥ 85% "Implémenté" + 100% "Justifié" avant le Stage 2.

---

## 18. Procédure de Key Ceremony HSM

La Key Ceremony est le processus formel de génération des clés maîtresses dans le HSM. C'est un document **systématiquement demandé** par les auditeurs ISO 27001 et les QTSP. Pour une PA, c'est obligatoire avant toute mise en production des signatures de factures.

### 18.1 Rôles et Participants

| Rôle | Titulaire | Responsabilité |
|------|-----------|----------------|
| **Ceremony Master** | RSSI | Conduit la cérémonie, rédige le PV |
| **Key Custodian 1** | CTO | Détient 1/N des cartes de récupération |
| **Key Custodian 2** | DG ou mandataire | Détient 1/N des cartes de récupération |
| **Key Custodian 3** | Responsable Juridique | Détient 1/N — carte de réserve |
| **Témoin externe** | Notaire ou représentant QTSP | Atteste l'opération (obligatoire pour QES/QSeal) |
| **Auditeur observateur** | RSSI adjoint ou consultant | Observe et valide — ne participe pas aux manipulations |

**Schéma M-of-N recommandé :** 2-of-3 (deux custodians sur trois requis pour activer le HSM).

### 18.2 Procédure Step-by-Step

```
PRÉ-CÉRÉMONIE (J-7)
  □ Notifier tous les participants (réunion physique — pas de visio)
  □ Réserver salle sécurisée (pas de fenêtres, pas d'appareils photo, Faraday si possible)
  □ Vérifier l'intégrité physique du HSM (scellés constructeur intacts)
  □ Préparer le matériel : Smart Cards vierges (N+1 exemplaires), lecteurs dédiés
  □ Préparer l'ordinateur air-gap (jamais connecté à internet)
  □ Vérifier le firmware HSM : hash SHA-256 comparé au hash officiel constructeur
  □ Préparer le formulaire de Procès-Verbal (§18.3)

CÉRÉMONIE — JOUR J (tous présents physiquement)

  ÉTAPE 1 — Vérification identités (09h00)
    □ Vérifier pièces d'identité de chaque participant (CNI ou passeport)
    □ Signer la feuille de présence (photographies interdites)
    □ Remise physique des Smart Cards vierges aux Key Custodians

  ÉTAPE 2 — Initialisation HSM (09h30)
    □ Mettre le HSM en mode Factory Reset (l'audit log interne démarre ici)
    □ Vérifier la version firmware (hash SHA-256 comparé officiel constructeur)
    □ Configurer le scheme M-of-N : 2-of-3 pour activation HSM

  ÉTAPE 3 — Génération des clés (10h00)
    □ Root CA Key : RSA-4096 ou ECDSA P-521
         → Générée DANS le HSM (jamais exportée en clair — jamais)
         → Backup chiffré sur 2 Smart Cards distinctes (Custodians 1 et 2)
         → Vérification : signer un message test + vérifier avec clé publique
    □ Signing Key PA (signatures Factur-X batch) : ECDSA P-384
         → Générée dans HSM, exportable uniquement chiffrée par KEK
    □ KEK (Key Encryption Key pour chiffrement archives) : AES-256
         → Générée dans HSM, stockée uniquement dans HSM

  ÉTAPE 4 — Distribution et test Smart Cards (11h00)
    □ Chaque Key Custodian reçoit sa Smart Card (1/N)
    □ Test de déverrouillage HSM : 2-of-3 custodians testent ensemble
    □ Les Smart Cards sont immédiatement placées dans des coffres-forts séparés
    □ Aucune copie numérique de la clé privée root n'existe hors HSM

  ÉTAPE 5 — Archivage et clôture (12h00)
    □ Le Ceremony Master signe le Procès-Verbal
    □ Tous les participants signent le Procès-Verbal
    □ Le témoin externe contre-signe et appose son cachet
    □ Export de l'audit log HSM → archivage WORM (hash + horodatage TSA)
    □ Le PV original est placé sous enveloppe scellée dans un coffre-fort
    □ Scan du PV → archivage numérique chiffré

POST-CÉRÉMONIE (J+1)
  □ Notification au QTSP (si clés pour certificats qualifiés)
  □ Mise à jour du Registre de Gestion des Clés
  □ Test complet du flux de signature Factur-X avec la nouvelle clé
  □ Validation XAdES-LTA sur une facture de test via TSA qualifiée
```

### 18.3 Documents à créer

```
docs/security/key-ceremony/
├── key-ceremony-procedure.md          # Ce document (procédure)
├── key-ceremony-pv-template.md        # Template PV (à compléter le jour J)
├── key-ceremony-pv-YYYY-MM-DD.pdf     # PV signé — scellé + archivé WORM
├── hsm-audit-log-YYYY-MM-DD.json      # Export audit log HSM — archivé WORM
└── key-registry.md                    # Registre de gestion des clés (vivant)
```

### 18.4 Politique de Rotation des Clés

```yaml
politique_rotation:
  root_ca_key:
    fréquence: "Jamais (clé root = vie du HSM) — renouvellement certificat à 20 ans"
    exception: "Si compromission → nouvelle Key Ceremony complète sous 72h"

  signing_key_pa:
    fréquence: Annuelle (avant expiration du certificat)
    procédure: Key Ceremony simplifiée (Ceremony Master + 1 Custodian minimum)
    notification_QTSP: Obligatoire avant rotation

  kek_archives:
    fréquence: Semestrielle
    procédure: Re-wrapping automatique des clés de données (pas de Key Ceremony)
    test_post_rotation: Vérifier accès à 10 factures archivées après chaque rotation

  en_cas_de_compromission_suspectée:
    réaction_immédiate: "< 2h — isolation HSM + alerte RSSI + incident P1"
    révocation: "Notification QTSP + AIFE si clé PA compromise + révocation CRL"
    nouvelle_cérémonie: "Sous 72h"
    re_signature_factures: "Si légalement possible et nécessaire — avis juridique requis"
```

---

## 19. Contrôles Physiques A.7 — Délégation Cloud et Preuves

### 19.1 Principe de délégation

Pour un SaaS 100% cloud, l'essentiel des contrôles A.7 est délégué au fournisseur cloud. L'auditeur ISO 27001 accepte cette délégation **à condition qu'elle soit documentée et que les preuves de conformité du CSP soient produites**.

```yaml
délégation_cloud:
  fournisseur: Amazon Web Services (AWS)
  régions: eu-west-1 (Irlande) + eu-central-1 (Frankfurt)
  périmètre_délégué: Infrastructure physique — data centers, alimentation, câblage, accès

  preuves_à_maintenir:
    source: AWS Artifact (console AWS → Security → Artifact)
    documents_annuels:
      - nom: "ISO/IEC 27001:2022 Certificate"
        scope: "eu-west-1, eu-central-1 inclus"
        renouvellement: Annuel
      - nom: "ISO/IEC 27017:2015 Certificate"
        scope: "Sécurité spécifique services cloud"
      - nom: "SOC 2 Type II Report"
        scope: "12 mois glissants"
      - nom: "PCI DSS Attestation of Compliance"
        scope: "Si applicable"
    stockage_local: docs/security/compliance/aws-certifications/
    revue_validité: RSSI — vérification trimestrielle des dates d'expiration
```

### 19.2 Contrôles physiques locaux (locaux de l'entreprise)

Les postes de travail et les espaces de bureau font partie du périmètre SMSI.

```yaml
controles_locaux:
  A7.3_bureaux_sécurisés:
    mesures:
      - Portes à badge ou à clé pour zones techniques
      - Visiteurs systématiquement accompagnés dans zones informatiques
      - Armoires verrouillées pour documents classifiés CONFIDENTIEL+
    preuve: Politique écrite + photos + registre d'accès visiteurs

  A7.7_clear_desk:
    mesures:
      - Politique "clean desk" signée par chaque employé
      - Verrouillage écran automatique après 5 minutes d'inactivité (GPO/MDM)
      - Interdiction d'imprimer des factures (données CONFIDENTIEL)
      - Destruction des documents papier contenant données clients (destructeur J-5)
    preuve: Politique signée + contrôles aléatoires documentés trimestriellement

  A7.9_actifs_hors_site:
    mesures:
      - Chiffrement full-disk obligatoire (BitLocker Windows / FileVault macOS)
      - MDM (Mobile Device Management) avec capacité de remote wipe
      - VPN obligatoire sur Wi-Fi public (ZTNA recommandé)
      - Interdiction de stocker des factures en local — uniquement via PA
    preuve: Inventaire MDM + politique télétravail signée + attestation chiffrement

  A7.10_supports_stockage:
    mesures:
      - Inventaire de tous les supports amovibles (USB, disques externes)
      - Interdiction USB non autorisés (blocage par MDM)
      - Destruction certifiée DIN 66399 niveau H-5 pour supports ayant contenu des factures
    preuve: Inventaire + certificats de destruction (conservation 6 ans)
```

---

## 20. DPIA — Analyse d'Impact sur la Protection des Données (RGPD Art. 35)

### 20.1 Obligation et Périmètre

La DPIA est **obligatoire** pour le traitement de facturation B2B car :
- Traitement à grande échelle de données financières (Art. 35.3.b RGPD)
- Données personnelles : noms, adresses, SIREN nominatifs, coordonnées bancaires (IBAN)
- Interconnexion de données : factures ↔ clients ↔ fournisseurs ↔ DGFiP

### 20.2 Fiche de Traitement (Registre Art. 30 RGPD)

```yaml
traitement:
  nom: "Génération, transmission et archivage de factures électroniques B2B"
  finalité: "Emission et archivage légal de factures (obligation LPF art. L.102 B)"
  base_légale: "Art. 6(1)(c) RGPD — Obligation légale fiscale française"
  responsable_traitement: "[Raison sociale PA]"
  DPO: "[Nom + email du DPO désigné]"

  données_traitées:
    identification: "Nom, prénom, SIRET/SIREN, adresse, email, téléphone"
    financières: "Montants, TVA, IBAN (si mentions légales), RIB fournisseur"
    transaction: "Désignation produits/services, quantités, prix unitaires"
    métadonnées: "Timestamps, IP, certificats eIDAS des signataires"

  personnes_concernées:
    - Représentants légaux des entreprises clientes
    - Contacts comptables et financiers (émetteurs/récepteurs)
    - Personnes physiques mentionnées sur les factures

  durées_de_conservation:
    factures_intégrales: "10 ans (droit commercial L.110-4 Code de Commerce)"
    données_fiscales: "6 ans minimum (LPF art. L.102 B) — sur support original 3 ans"
    logs_accès: "6 ans (prescription fiscale)"
    données_test: "0 — données synthétiques uniquement en dev/staging"

  destinataires:
    - DGFiP / AIFE (e-reporting TVA, contrôles fiscaux)
    - PA destinataire (transmission inter-PA)
    - QTSP (pour les signatures qualifiées)
    - Hébergeur cloud (AWS — sous-traitant RGPD art. 28)
```

### 20.3 Analyse des Risques et Mesures

| # | Risque | Prob. | Gravité | Score | Mesures de mitigation |
|---|--------|-------|---------|-------|----------------------|
| D1 | Accès non autorisé aux données financières | M | H | **12** | RBAC + MFA + AES-256 + SIEM |
| D2 | Fuite de données → notification CNIL 72h | F | H | **10** | DLP + chiffrement + isolation tenants |
| D3 | Conservation au-delà des durées légales | F | M | **6** | Politique rétention auto + destruction |
| D4 | Traitement par sous-traitant non autorisé | F | H | **10** | DPA Art. 28 RGPD + audit annuel |
| D5 | Accès illégitime par développeurs en prod | F | H | **10** | PAM + zéro accès direct + logs immuables |
| D6 | Transmission à mauvais destinataire (erreur routage) | F | H | **10** | Tests isolation tenant + vérification SIREN |

### 20.4 Droits des Personnes (Art. 12-22 RGPD)

```yaml
droits_personnes:
  droit_accès_art15:
    délai: 30 jours
    procédure: "Email DPO → vérification identité → export des données en PDF"
    restriction: "Données fiscales conservées pour obligation légale — effacement différé"

  droit_rectification_art16:
    applicabilité: "Coordonnées uniquement — montants factures immuables (valeur probatoire)"
    procédure: "Rectification dans le système + conservation de l'historique"

  droit_effacement_art17:
    limite: "Non applicable pendant durée légale (6-10 ans) — obligation légale prime sur RGPD"
    après_délai: "Pseudonymisation des données personnelles non fiscalement nécessaires"

  droit_portabilité_art20:
    format: "Export XML Factur-X ou CSV structuré"
    délai: "30 jours"

  notification_violation_art33:
    délai: "72h après prise de connaissance → CNIL"
    contenu: "Nature, données concernées, nombre personnes, mesures prises"
    délai_art34: "Sans délai si risque élevé → notification des personnes concernées"
```

### 20.5 Conclusion DPIA

```
Niveau de risque résiduel après mesures : MODÉRÉ (acceptable)

Consultation CNIL (Art. 36) : Non requise si risques résiduels maîtrisés.
Révision DPIA obligatoire si : changement majeur de traitement, incident RGPD, évolution réglementaire.
Prochaine révision prévue : 2027-03-04 (annuelle).

Avis DPO : [À compléter et signer par le DPO avant mise en production PA]
```

---

## 21. Architecture Multi-Tenant — Isolation des Données B2B

La ségrégation stricte entre tenants est une exigence critique pour une PA (A.8.22, A.5.12) et une obligation contractuelle envers les clients B2B dont les données commerciales sont hautement confidentielles.

### 21.1 Stratégie d'isolation

```yaml
stratégie_isolation_multicouche:

  base_de_données:
    approche: "Schema PostgreSQL dédié par tenant"
    nom_schema: "tenant_{hash_siren}"
    avantages:
      - Isolation logique totale (aucun risque de jointure inter-tenant)
      - Chiffrement par schéma avec clé KMS différente par tenant
      - Backup et restauration indépendants par tenant
    sécurité_complémentaire:
      - Row Level Security (RLS) PostgreSQL comme filet de sécurité
      - Connection pooling PgBouncer avec pools isolés par tenant
      - Audit pgAudit : toute requête SQL loggée avec tenant_id

  stockage_s3:
    structure: "s3://invoices-{env}/{tenant_hash}/invoices/{year}/{month}/{invoice_id}"
    chiffrement:
      méthode: "SSE-KMS avec CMK distinct par tenant"
      rotation: "Automatique annuellement par tenant (AWS KMS key rotation)"
    politique_accès:
      - IAM policy : accès uniquement aux objets avec préfixe {tenant_hash}
      - ListBucket interdit sauf pour le compte admin
      - Pre-signed URLs avec expiration courte (15 min) pour téléchargement

  application:
    tenant_context:
      - tenant_id injecté dans chaque JWT (claim "tid")
      - Middleware de validation tenant au niveau API Gateway (avant tout handler)
      - Aucune opération SQL sans WHERE tenant_id = $current_tenant
    défense_en_profondeur:
      - RBAC : vérification tenant_id avant toute lecture/écriture
      - RLS PostgreSQL : filtre automatique au niveau base de données
      - Logs SIEM : alerte si requête SQL sans filtre tenant détectée

  kubernetes:
    namespaces: "Namespace K8s dédié par tenant (workloads isolés si applicable)"
    network_policy: "NetworkPolicy Calico — isolation entre namespaces"
    secrets: "Secret K8s par tenant — chiffrement etcd avec KMS"
```

### 21.2 Tests d'isolation obligatoires (CI/CD)

```typescript
// tests/security/tenant-isolation.test.ts
describe('Isolation Multi-Tenant', () => {

  it('Tenant A ne peut PAS accéder aux factures du Tenant B', async () => {
    const tokenA = await getJWT('tenant-A');
    const invoiceB = await createInvoice('tenant-B', testInvoiceData);

    const response = await api.get(`/invoices/${invoiceB.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    // 403 FORBIDDEN (pas 404 — qui révèlerait l'existence de la ressource)
    expect(response.status).toBe(403);
  });

  it('RLS PostgreSQL bloque les requêtes cross-tenant', async () => {
    // Connexion avec le rôle applicatif tenant-A
    await db.query("SET app.tenant_id = 'tenant-A'");
    const result = await db.query(
      "SELECT count(*) FROM invoices WHERE tenant_id != current_setting('app.tenant_id')"
    );
    // RLS filtre automatiquement — résultat doit être 0
    expect(parseInt(result.rows[0].count)).toBe(0);
  });

  it('Clés KMS S3 sont distinctes par tenant', async () => {
    const keyA = await getS3ObjectEncryptionKey('tenant-A', 'invoice-001.xml');
    const keyB = await getS3ObjectEncryptionKey('tenant-B', 'invoice-001.xml');
    expect(keyA.KeyId).not.toBe(keyB.KeyId); // CMKs différents
  });

});
```

### 21.3 Procédure en cas d'erreur de routage

```yaml
incident_routage_inter_tenant:
  détection:
    - Alerte SIEM : accès à facture avec tenant_id ≠ tenant JWT
    - Monitoring applicatif : métriques cross-tenant access (doit être = 0)

  réponse_immédiate:
    - Identifier la facture concernée et les deux tenants impliqués
    - Révoquer immédiatement les accès anormaux
    - Notifier les deux clients (délai < 2h)

  qualification_RGPD:
    - Si données personnelles exposées → violation RGPD
    - Notification CNIL sous 72h (Art. 33)
    - Notification des personnes concernées (Art. 34) si risque élevé

  analyse_post_mortem:
    - Identifier la cause racine (bug, mauvais JWT, RLS contourné ?)
    - Patch correctif + test de non-régression ajouté au CI
    - Rapport d'incident pour le client affecté
```

---

## 22. PAF — Piste d'Audit Fiable (Implémentation Technique)

La PAF (Piste d'Audit Fiable) est une alternative légale à la signature électronique pour prouver l'authenticité et l'intégrité des factures (Art. 289 VII CGI + BOFiP BOI-TVA-DECLA-30-70-20). Elle exige une chaîne documentaire ininterrompue.

### 22.1 Chaîne documentaire requise

```
[Bon de commande / Contrat]
    ↓ référencé dans la facture (BuyerOrderReferencedDocument)
[Bon de livraison / PV de réception]
    ↓ référencé dans la facture (DeliveryNoteReferencedDocument)
[Facture Factur-X / XML CII]
    ↓ référencée dans le règlement
[Avis de paiement / Relevé bancaire]

→ Chaque document est conservé et les liens entre eux sont tracables.
→ En cas de contrôle DGFiP : présenter la chaîne complète en < 72h.
```

### 22.2 Implémentation Factur-X (Références croisées)

```typescript
// Champs CII obligatoires pour PAF — à intégrer dans FacturXInvoice.ts
const invoiceWithPAF = {
  // Référence au bon de commande (lien BC → Facture)
  buyerOrderReference: {
    issuerAssignedID: "BC-2026-001234",  // N° bon de commande acheteur
    formattedIssueDateTime: "2026-01-15"
  },

  // Référence au bon de livraison (lien BL → Facture)
  despatchAdviceReference: {
    issuerAssignedID: "BL-2026-005678", // N° bon de livraison
    formattedIssueDateTime: "2026-02-01"
  },

  // Référence au contrat cadre (si applicable)
  contractReference: {
    issuerAssignedID: "CONTRAT-2025-042"
  },

  // Référence au bon de réception (PV de réception de prestation)
  receivingAdviceReference: {
    issuerAssignedID: "PV-2026-0089",
    formattedIssueDateTime: "2026-02-03"
  }
};
```

### 22.3 Base de données PAF

```sql
-- Table des liens documentaires (Piste d'Audit Fiable)
CREATE TABLE invoice_paf_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       VARCHAR NOT NULL,
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  document_type   VARCHAR NOT NULL CHECK (
                    document_type IN (
                      'purchase_order', 'delivery_note',
                      'contract', 'receiving_advice', 'payment'
                    )
                  ),
  document_id     VARCHAR NOT NULL,    -- Numéro du document lié
  document_date   DATE NOT NULL,
  document_hash   CHAR(64),            -- SHA-256 du document lié (si disponible)
  document_url    TEXT,                -- Lien vers le document archivé
  linked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_by       UUID NOT NULL,       -- UserID qui a créé le lien

  CONSTRAINT unique_invoice_document UNIQUE (invoice_id, document_type, document_id)
);

-- Index pour accès DGFiP rapide (contrôle fiscal)
CREATE INDEX idx_paf_invoice_id ON invoice_paf_links(invoice_id);
CREATE INDEX idx_paf_tenant_invoice ON invoice_paf_links(tenant_id, invoice_id);
```

### 22.4 Interface d'accès pour contrôle DGFiP

```typescript
// GET /audit/invoice/:id/trail — accès en lecture seule pour contrôle fiscal
async function getInvoiceAuditTrail(invoiceId: string): Promise<PAFResponse> {
  return {
    invoice: await getInvoice(invoiceId),
    linkedDocuments: await getPAFLinks(invoiceId),
    auditLog: await getImmutableAuditLog(invoiceId),
    signature: await getSignatureProof(invoiceId),
    timestamps: await getTSATimestamps(invoiceId),
    // Toute consultation DGFiP est loggée dans le SIEM
    accessLogged: true
  };
}
```

---

## 23. Matrice de Compétences et Certifications (Clause 7.2)

ISO 27001 clause 7.2 exige que la compétence de chaque personne dont le travail affecte la sécurité soit déterminée, maintenue et prouvée par des enregistrements.

### 23.1 Certifications requises par rôle

| Rôle | Certification **requise** | Délai d'obtention | Certifications recommandées |
|------|--------------------------|-------------------|-----------------------------|
| **RSSI** | ISO 27001 Lead Implementer (PECB, BSI ou LRQA) | Avant Phase 4 | CISSP, CISM |
| **DPO** | CIPP/E (IAPP) ou attestation DPO CNIL | Avant Phase 2 | CIPM |
| **Auditeur interne** | ISO 27001 Lead Auditor (PECB) | Avant Phase 10 | — |
| **Responsable PKI/HSM** | Formation constructeur HSM (Thales ou nCipher) | Avant Phase 5 | CompTIA Security+ |
| **Développeurs** | Formation OWASP Top 10 (annuelle) | Avant prod PA | CEH, OSCP |
| **Ops/Infrastructure** | AWS Security Specialty | Avant Phase 4 | CIS Controls |
| **Support PA** | Formation réforme facturation électronique DGFiP | Avant mise en prod | — |
| **Direction** | Sensibilisation ISO 27001 (demi-journée) | Avant Phase 1 | — |

### 23.2 Programme de Formation Annuel (A.6.3)

```yaml
plan_formation_annuel:

  formation_tous_employés:
    fréquence: Annuelle — obligatoire (pas d'exception)
    contenu:
      - Phishing et ingénierie sociale (simulation + e-learning)
      - Classification des données (comment traiter une facture CONFIDENTIEL)
      - Procédure de signalement des incidents (A.6.8)
      - RGPD : droits des personnes + obligations employé
      - Fraude à la facture (BEC) — spécifique PA
    durée: 4h minimum
    validation: Quiz en ligne (score ≥ 80%) + signature attestation de formation
    preuve: Certificat de complétion nominatif — conservation 6 ans

  formation_développeurs:
    fréquence: Annuelle + à chaque nouvelle technologie critique
    contenu:
      - OWASP API Security Top 10 (2023)
      - Secure coding TypeScript/Node.js (parseurs XML, secrets)
      - Manipulation sécurisée des flux XML (XXE, injection, validation XSD)
      - Utilisation des secrets avec Vault (jamais de credentials en dur)
      - Revue des incidents de l'année (apprentissage A.5.27)
    durée: 8h/an
    preuve: Attestation de formation + résultats quiz technique

  formation_ops:
    fréquence: Annuelle
    contenu:
      - CIS Benchmarks AWS (dernière version)
      - Réponse aux incidents PA (tabletop exercise)
      - Gestion HSM + rotation des clés (procédure Key Ceremony)
      - Procédures de sauvegarde et restauration
    durée: 8h/an

  exercice_incident_PA:
    fréquence: Semestrielle
    type: Tabletop exercise (sur paper) + simulation partielle
    scénarios_obligatoires:
      - "Compromission clé HSM PA — factures non signables"
      - "Fuite de données factures (notification CNIL + AIFE)"
      - "Erreur de routage inter-tenant"
      - "Indisponibilité PA > 4h (notification AIFE + clients)"
      - "Ransomware sur infrastructure PA"
    durée: 4h par exercice
    compte_rendu: Obligatoire — actions correctives trackées
```

### 23.3 Registre des Compétences

```
docs/security/competencies/
├── competency-matrix.xlsx               # Tableau employé × certification × date
├── training-records/
│   ├── 2026-phishing-simulation.pdf     # Résultats + taux de clic
│   ├── 2026-owasp-training-devs.pdf     # Attestations
│   ├── 2026-iso27001-awareness-all.pdf  # Tous employés
│   └── 2026-incident-exercise-PA.pdf    # Compte-rendu exercice
└── certifications/
    ├── rssi-iso27001-lead-implementer-PECB.pdf
    ├── dpo-cipp-e-iapp.pdf
    └── auditor-lead-auditor-PECB.pdf
```

---

## 24. Modèle de Menaces STRIDE (Pipeline Factur-X PA)

STRIDE (Microsoft) : **S**poofing — **T**ampering — **R**epudiation — **I**nformation Disclosure — **D**enial of Service — **E**levation of Privilege.

### 24.1 Périmètre analysé

```
[Client ERP] ─→ [API PA Gateway] ─→ [Invoice Processor] ─→ [HSM Signer]
                                              │                    │
                                      [Format Converter]   [TSA Timestamp]
                                              │
               [Archive WORM] ←─ [Lifecycle Manager] ←─→ [PPF Connector] ─→ [PPF/AIFE]
                                              │
                                    [PA Destinataire]
```

### 24.2 Analyse STRIDE Détaillée

| Composant | Menace | Type STRIDE | Mitigation | Priorité |
|-----------|--------|-------------|------------|----------|
| API PA Gateway | Usurpation d'identité client (fausse facture) | **S** | OAuth2 + JWT RS256 + MFA | 🔴 CRITIQUE |
| API PA Gateway | DDoS — indisponibilité PA | **D** | WAF + Rate limiting + Shield Advanced | 🔴 CRITIQUE |
| API PA Gateway | Injection dans headers (SSRF, header injection) | **T** | Validation stricte + WAF rules | 🟠 HAUTE |
| Invoice Processor | Injection XXE dans XML Factur-X reçu (RCE) | **T** | Parseur sécurisé + XSD strict + sandbox | 🔴 CRITIQUE |
| Invoice Processor | Facture modifiée en transit | **T** | Signature XAdES + TLS 1.3 + hashing | 🔴 CRITIQUE |
| Invoice Processor | Traitement sans validation complète | **T** | Validation EN 16931 obligatoire avant tout routage | 🟠 HAUTE |
| HSM Signer | Extraction de clé privée | **I** | HSM FIPS 140-3 + clé non exportable | 🔴 CRITIQUE |
| HSM Signer | Signature de factures frauduleuses (sans autorisation) | **E** | MFA step-up + quota + alertes SIEM | 🔴 CRITIQUE |
| HSM Signer | Déni de service sur le HSM (blocage signatures) | **D** | HSM HA (actif-actif) + monitoring | 🟠 HAUTE |
| PPF Connector | Répudiation e-reporting TVA (DGFiP conteste) | **R** | Horodatage TSA + audit log WORM + ack PPF | 🔴 CRITIQUE |
| PPF Connector | Impersonation du PPF (MITM — faux acks) | **S** | Certificate pinning PPF | 🟠 HAUTE |
| PPF Connector | E-reporting falsifié avant envoi DGFiP | **T** | Signature des données + hash avant/après | 🔴 CRITIQUE |
| Lifecycle Manager | Manipulation des statuts de cycle de vie | **T** | Signature des événements + WORM | 🟠 HAUTE |
| Lifecycle Manager | Rejeu de statuts (double APPROUVEE) | **R** | Identifiants uniques + idempotence | 🟡 MOYENNE |
| Archive WORM | Suppression d'archives (destruction preuves fiscales) | **T** | S3 Object Lock — Compliance mode 10 ans | 🔴 CRITIQUE |
| Archive WORM | Accès non autorisé aux archives (exfiltration) | **I** | KMS CMK par tenant + RBAC + DLP | 🔴 CRITIQUE |
| Multi-tenant | Cross-tenant access (Tenant A voit factures B) | **E** | RLS PostgreSQL + tests isolation CI/CD | 🔴 CRITIQUE |
| Admin console | Compromission compte administrateur | **E** | PAM + MFA FIDO2 + session recording | 🔴 CRITIQUE |
| Annuaire | Empoisonnement — SIREN redirigé vers mauvaise PA | **S** | Validation SIREN DGFiP + intégrité annuaire | 🟠 HAUTE |

### 24.3 TOP 5 Scénarios d'Attaque (Traitement Prioritaire)

```
SCÉNARIO 1 — Fraude BEC (Business Email Compromise)
  Vecteur : Credential stuffing → génération de fausses factures
  Impact  : Fraude financière + responsabilité PA + reputationnel
  Mitigations :
    → MFA obligatoire (rend le credential stuffing inefficace)
    → Quotas de génération + alertes si volume anormal (> 3σ)
    → Notification client pour chaque nouvelle facture générée
    → Vérification SIREN destinataire dans annuaire DGFiP

SCÉNARIO 2 — Injection XXE dans flux XML Factur-X reçu
  Vecteur : POST /invoices/receive avec payload XML malformé (XXE, billion laughs)
  Impact  : RCE sur serveur de traitement → compromission totale PA
  Mitigations :
    → Désactivation entités externes XML (obligatoire — A.8.28)
    → Limite de taille : 10 MB max par requête
    → Sandbox d'analyse (worker isolé sans accès réseau) avant traitement
    → WAF avec règles XML + alertes SIEM sur erreurs parse

SCÉNARIO 3 — Compromission clé HSM (factures frauduleuses signées)
  Vecteur : Escalade de privilèges admin → accès PKCS#11 HSM
  Impact  : Toutes les factures peuvent être signées au nom des clients
  Mitigations :
    → HSM FIPS 140-2 Level 3 (clé physiquement non exportable)
    → Dual control pour accès HSM (2 personnes simultanées)
    → Alertes SIEM sur toute opération HSM hors process normal
    → Key Ceremony (clé générée dans HSM — ne quitte jamais le HSM)

SCÉNARIO 4 — Erreur de routage inter-tenant (RGPD + confidentiel)
  Vecteur : JWT forgé ou bug filtrage tenant_id → accès cross-tenant
  Impact  : Violation RGPD + exposition données commerciales concurrentes
  Mitigations :
    → RLS PostgreSQL (filtre au niveau base de données)
    → Tests d'isolation automatisés dans CI/CD (bloquant si échec)
    → Alerte SIEM sur requête SQL sans filtre tenant_id
    → 403 (pas 404) pour toute ressource d'un autre tenant

SCÉNARIO 5 — E-reporting TVA falsifié vers DGFiP
  Vecteur : MITM sur connexion PPF ou compromission du service e-reporting
  Impact  : Fraude fiscale → responsabilité pénale PA + dirigeants
  Mitigations :
    → TLS 1.3 + certificate pinning vers endpoints PPF/AIFE
    → Signature HMAC des données avant envoi (preuve d'intégrité)
    → Log WORM de chaque transmission e-reporting avec ack PPF
    → Rapprochement automatique : données envoyées vs ack reçu
```

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
