# Check Script Documentation

## Purpose

The `check-libs.sh` script provides automated non-regression testing for the Factur-X libraries. It builds and tests all libraries to ensure code quality and compliance with coverage thresholds.

## Usage

### Basic Usage

```bash
# Run all checks with default settings (95% coverage threshold)
npm run check

# OR directly
./check-libs.sh
```

### Options

```bash
# Skip build step (faster for repeated test runs)
npm run check:quick
# OR
./check-libs.sh --skip-build

# Use stricter coverage threshold (99%)
npm run check:strict
# OR
./check-libs.sh --coverage-threshold=99

# Custom coverage threshold
./check-libs.sh --coverage-threshold=97

# Show help
./check-libs.sh --help
```

## What It Does

The check script performs the following operations:

### 1. **lib/factur-x-ts** (Core Library)
   - ✅ Installs dependencies if needed
   - ✅ Builds TypeScript to JavaScript
   - ✅ Runs all 507 unit tests
   - ✅ Generates coverage report
   - ✅ Validates coverage meets threshold (default: 95%)

### 2. **lib/smp-factur-x-ts** (Template Library)
   - ⚠️  Currently has minimal test coverage
   - 🔄 Will be enhanced in future updates

## Current Coverage Status

**lib/factur-x-ts**: 96.58% (507 tests) ✅

| Module | Coverage | Status |
|--------|----------|--------|
| I18n.ts | 100% | ✅ |
| CurrencyFormatter.ts | 100% | ✅ |
| entities.ts | 99.04% | ✅ |
| ProfileValidator.ts | 98.97% | ✅ |
| TaxCalculator.ts | 97.1% | ✅ |
| InputSanitizer.ts | 96.77% | ✅ |
| FacturXInvoice.ts | 95.1% | ✅ |
| XsdValidator.ts | 93.63% | ⚠️ |
| constants.ts | 84.84% | ⚠️ |

## Exit Codes

- **0**: All checks passed ✅
- **1**: Build failed, tests failed, or coverage below threshold ❌

## CI/CD Integration

The check script is designed for use in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run non-regression checks
  run: ./check-libs.sh --coverage-threshold=95

# Example GitLab CI
test:
  script:
    - chmod +x ./check-libs.sh
    - ./check-libs.sh
```

## Output

The script provides clear, colorized output:

- 🔵 **Blue**: Informational messages
- 🟢 **Green**: Success messages
- 🟡 **Yellow**: Warnings
- 🔴 **Red**: Errors

Example output:
```
========================================
Checking lib/factur-x-ts
========================================

ℹ️  Building factur-x-ts...
✅ Build successful
ℹ️  Running tests with coverage...
✅ All tests passed
ℹ️  Coverage: 96.58%
✅ Coverage meets threshold (96.58% >= 95%)

========================================
Summary
========================================

✅ All critical checks passed!

╔══════════════════════════════════════╗
║   ✅ READY FOR PRODUCTION            ║
╚══════════════════════════════════════╝
```

## NPM Scripts

The following npm scripts are available in the root `package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `npm run check` | `./check-libs.sh` | Full check with 95% threshold |
| `npm run check:quick` | `./check-libs.sh --skip-build` | Skip build, tests only |
| `npm run check:strict` | `./check-libs.sh --coverage-threshold=99` | Strict 99% coverage |
| `npm run check:libs` | `cd lib/factur-x-ts && npm run build && npm test:coverage` | Direct lib check |

## Troubleshooting

### Script Permission Denied

```bash
chmod +x ./check-libs.sh
```

### Dependencies Missing

The script automatically runs `npm install` if `node_modules` is missing.

### Build Failures

Check TypeScript compilation errors:
```bash
cd lib/factur-x-ts
npm run build
```

### Test Failures

Run tests individually to see detailed errors:
```bash
cd lib/factur-x-ts
npm test
```

### Coverage Below Threshold

View detailed coverage report:
```bash
cd lib/factur-x-ts
npm run test:coverage
```

## Best Practices

1. **Run before commits**: Always run `npm run check` before committing changes
2. **CI/CD integration**: Include in your CI/CD pipeline to prevent regressions
3. **Coverage threshold**: Maintain at least 95% coverage for production code
4. **Quick iterations**: Use `npm run check:quick` during active development
5. **Strict mode**: Use `npm run check:strict` before releases

## EN16931 Compliance

All tests validate EN16931 compliance for electronic invoicing:

- ✅ Profile validation (MINIMUM, BASICWL, BASIC, EN16931, EXTENDED)
- ✅ Mandatory field checks (BT-* Business Terms)
- ✅ XSD validation for XML structure
- ✅ Tax calculation accuracy
- ✅ Multi-currency support (30 currencies)
- ✅ i18n compliance (en, fr, de)

## Next Steps

To achieve 100% coverage:

1. **constants.ts**: Add tests for regional config functions (~5 tests)
2. **XsdValidator.ts**: Add error handling tests (~6 tests)
3. **FacturXInvoice.ts**: Add XML private method tests (~3 tests)
4. **lib/smp-factur-x-ts**: Create comprehensive test suite (~100+ tests)

Estimated time: 6-9 hours

## Version History

- **v1.0.0** (2025-11-15): Initial check script with 96.58% coverage
- Coverage increased from 88.53% to 96.58% (+8.05%)
- All 507 tests passing
- EN16931 compliant
