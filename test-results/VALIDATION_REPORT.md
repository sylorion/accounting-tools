# Factur-X Validation Test Results

**Test Date:** 2026-03-03T14:07:03.590Z
**External Tools:** veraPDF: ✗, Mustangproject: ✗

## Summary Table

| Test | Template | Profile | PDF | Valid | Score | Errors | Warnings | External |
|------|----------|---------|-----|-------|-------|--------|----------|----------|
| modern-basic | Modern | BASICWL | ✗ | ✗ | 0% | 0 | 0 | N/A |
| fancy-en16931 | Fancy | EN16931 | ✓ | ⚠ | 57% | 7 | 1 | N/A |
| brand-en16931 | Brand | EN16931 | ✓ | ⚠ | 57% | 7 | 1 | N/A |
| corporate-basic | Corporate | BASICWL | ✗ | ✗ | 0% | 0 | 0 | N/A |
| minimal-basic | Minimal | BASICWL | ✗ | ✗ | 0% | 0 | 0 | N/A |

## Detailed Results

### modern-basic

- **Template:** Modern
- **Profile:** BASICWL
- **PDF Generated:** No (0 bytes)
- **Errors:**
  - Test failed: [Factur-X] Profile BASICWL forbids field 'lines', but it is set.

### fancy-en16931

- **Template:** Fancy
- **Profile:** EN16931
- **PDF Generated:** Yes (70054 bytes)
- **Internal Validation:**
  - Valid: No ✗
  - Score: 57%
  - Compliance: PARTIAL
  - Errors: 7
  - Warnings: 1

### brand-en16931

- **Template:** Brand
- **Profile:** EN16931
- **PDF Generated:** Yes (70073 bytes)
- **Internal Validation:**
  - Valid: No ✗
  - Score: 57%
  - Compliance: PARTIAL
  - Errors: 7
  - Warnings: 1

### corporate-basic

- **Template:** Corporate
- **Profile:** BASICWL
- **PDF Generated:** No (0 bytes)
- **Errors:**
  - Test failed: [Factur-X] Profile BASICWL forbids field 'lines', but it is set.

### minimal-basic

- **Template:** Minimal
- **Profile:** BASICWL
- **PDF Generated:** No (0 bytes)
- **Errors:**
  - Test failed: [Factur-X] Profile BASICWL forbids field 'lines', but it is set.

## Statistics

- **Total Tests:** 5
- **PDFs Generated:** 2/5
- **Internal Validation Pass:** 0/5
- **Average Score:** 22.8%