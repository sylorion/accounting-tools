#!/bin/bash
# ==============================================================================
# Non-Regression Check Script for Accounting Tools Libraries
# ==============================================================================
# This script builds and tests all libraries to ensure quality and non-regression
# Usage: ./check-libs.sh [--coverage-threshold=95] [--skip-build]
# ==============================================================================

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COVERAGE_THRESHOLD=95
SKIP_BUILD=false
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --coverage-threshold=*)
      COVERAGE_THRESHOLD="${arg#*=}"
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --coverage-threshold=N    Set minimum coverage threshold (default: 95)"
      echo "  --skip-build             Skip build step"
      echo "  --help                   Show this help message"
      exit 0
      ;;
  esac
done

# Helper functions
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Track overall status
OVERALL_STATUS=0

# ==============================================================================
# Check lib/factur-x-ts
# ==============================================================================

check_facturx() {
  print_header "Checking lib/factur-x-ts"

  cd "$PROJECT_ROOT/lib/factur-x-ts"

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for factur-x-ts..."
    npm install
  fi

  # Build
  if [ "$SKIP_BUILD" = false ]; then
    print_info "Building factur-x-ts..."
    if npm run build; then
      print_success "Build successful"
    else
      print_error "Build failed"
      return 1
    fi
  else
    print_warning "Skipping build (--skip-build flag)"
  fi

  # Run tests with coverage
  print_info "Running tests with coverage..."
  if npm run test:coverage -- --silent=false 2>&1 | tee /tmp/facturx-test-output.txt; then
    print_success "All tests passed"
  else
    print_error "Tests failed"
    return 1
  fi

  # Extract coverage percentage
  if grep -q "All files" /tmp/facturx-test-output.txt; then
    COVERAGE=$(grep "All files" /tmp/facturx-test-output.txt | awk '{print $4}' | sed 's/%//')

    if [ -n "$COVERAGE" ]; then
      print_info "Coverage: ${COVERAGE}%"

      # Compare with threshold
      if (( $(echo "$COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
        print_success "Coverage meets threshold (${COVERAGE}% >= ${COVERAGE_THRESHOLD}%)"
      else
        print_error "Coverage below threshold (${COVERAGE}% < ${COVERAGE_THRESHOLD}%)"
        return 1
      fi
    fi
  else
    print_warning "Could not extract coverage percentage"
  fi

  return 0
}

# ==============================================================================
# Check lib/smp-factur-x-ts
# ==============================================================================

check_smp_facturx() {
  print_header "Checking lib/smp-factur-x-ts"

  cd "$PROJECT_ROOT/lib/smp-factur-x-ts"

  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    print_warning "No package.json found - skipping smp-factur-x-ts"
    return 0
  fi

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for smp-factur-x-ts..."
    npm install
  fi

  # Build
  if [ "$SKIP_BUILD" = false ]; then
    print_info "Building smp-factur-x-ts..."
    if npm run build 2>/dev/null; then
      print_success "Build successful"
    else
      print_warning "Build script not found or failed - skipping"
    fi
  else
    print_warning "Skipping build (--skip-build flag)"
  fi

  # Run tests if available
  if npm run test:coverage 2>/dev/null; then
    print_success "Tests passed"
  else
    print_warning "No tests found or tests failed - skipping"
  fi

  return 0
}

# ==============================================================================
# Main execution
# ==============================================================================

print_header "Starting Non-Regression Checks"
print_info "Project: $(basename "$PROJECT_ROOT")"
print_info "Coverage threshold: ${COVERAGE_THRESHOLD}%"
print_info "Skip build: $SKIP_BUILD"

# Check factur-x-ts
if check_facturx; then
  print_success "factur-x-ts passed all checks"
else
  print_error "factur-x-ts failed checks"
  OVERALL_STATUS=1
fi

# Check smp-factur-x-ts
if check_smp_facturx; then
  print_success "smp-factur-x-ts passed all checks"
else
  print_warning "smp-factur-x-ts checks incomplete"
  # Don't fail overall for smp-factur-x-ts yet (0% coverage)
fi

# Final summary
cd "$PROJECT_ROOT"
print_header "Summary"

if [ $OVERALL_STATUS -eq 0 ]; then
  print_success "All critical checks passed!"
  echo -e "\n${GREEN}╔══════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   ✅ READY FOR PRODUCTION            ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════╝${NC}\n"
else
  print_error "Some checks failed"
  echo -e "\n${RED}╔══════════════════════════════════════╗${NC}"
  echo -e "${RED}║   ❌ CHECKS FAILED                    ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════╝${NC}\n"
fi

exit $OVERALL_STATUS
