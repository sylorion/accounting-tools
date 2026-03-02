# External Validation Tools Scripts

This directory contains scripts for installing and using external validation tools to verify Factur-X PDF/A-3 compliance.

## Scripts

### 1. setup-validation-tools.sh

Installs external validation tools:
- **veraPDF v1.28.2**: Industry-standard PDF/A-3 validator
- **Mustangproject v2.13.1**: Factur-X/ZUGFeRD validator (optional)

**Usage:**
```bash
./scripts/setup-validation-tools.sh
```

**Features:**
- Automated installation with fallback handling
- Detects existing installations
- Creates symlinks in `/usr/local/bin`
- Shows warnings if Mustangproject installation fails
- Requires Java 8 or higher

**Installation locations:**
- veraPDF: `/usr/local/verapdf/`
- Mustangproject: `/usr/local/mustangproject/`

### 2. validate-facturx.sh

Validates Factur-X PDFs using external validation tools.

**Usage:**
```bash
# Validate single PDF
./scripts/validate-facturx.sh path/to/invoice.pdf

# Validate all test PDFs
./scripts/validate-facturx.sh
```

**Features:**
- Validates PDF/A-3 compliance using veraPDF
- Validates Factur-X compliance using Mustangproject (if available)
- Graceful fallback if one tool fails
- Detailed error reporting
- Machine-readable output saved to `.verapdf.xml` files

**Validation checks:**
- ✅ PDF/A-3B compliance (ISO 19005-3:2012)
- ✅ Embedded fonts
- ✅ ICC color profiles (OutputIntent)
- ✅ XMP metadata
- ✅ File ID generation
- ⚠️ AFRelationship (pdf-lib limitation)

## Quick Start

1. **Install validation tools:**
   ```bash
   ./scripts/setup-validation-tools.sh
   ```

2. **Generate test PDFs:**
   ```bash
   node test-validation.js
   ```

3. **Validate generated PDFs:**
   ```bash
   ./scripts/validate-facturx.sh
   ```

## NPM Scripts

Convenient npm shortcuts are available:

```bash
# Install validation tools
npm run setup:validation

# Validate all test PDFs
npm run validate:external

# Generate PDFs and validate
npm run test:validation
```

## Current Validation Status

As of the latest implementation:

| Aspect | Status | Details |
|--------|--------|---------|
| PDF/A-3 Compliance | 98.6% | 145/146 rules passing |
| Fonts Embedded | ✅ | Chillax OTF fonts |
| ICC Profile | ✅ | sRGB 2014 (v2.0) |
| XMP Metadata | ✅ | Factur-X extensions |
| File ID | ✅ | MD5-based permanent ID |
| AFRelationship | ⚠️ | pdf-lib API limitation |

**Remaining issue:**
- AFRelationship: 2 failures (ISO 19005-3:6.8)
- Cause: pdf-lib doesn't expose file spec dictionary for AFRelationship
- Impact: Non-critical but prevents 100% PDF/A-3 compliance

## Troubleshooting

### veraPDF installation fails
- Ensure Java 8+ is installed: `java -version`
- Check internet connection (downloads from verapdf.org)
- Run with sudo if permission errors occur

### Mustangproject installation fails
- GitHub releases may be unavailable (404 errors)
- This is optional - validation will continue with veraPDF only
- Manually download from: https://github.com/ZUGFeRD/mustangproject/releases

### Validation shows warnings
- Check the specific ISO clause in the error message
- Review EXTERNAL_VALIDATION_FINDINGS.md for known issues
- AFRelationship warnings are expected (known limitation)

## External Validation Reports

Validation results are saved to:
- `test-results/VALIDATION_REPORT.md` - Human-readable summary
- `test-results/validation-results.json` - Machine-readable data
- `test-results/pdfs/*.verapdf.xml` - veraPDF detailed reports

## References

- [veraPDF Documentation](https://docs.verapdf.org/)
- [Mustangproject GitHub](https://github.com/ZUGFeRD/mustangproject)
- [PDF/A-3 Specification (ISO 19005-3:2012)](https://www.iso.org/standard/57229.html)
- [Factur-X Standard](https://fnfe-mpe.org/factur-x/)
