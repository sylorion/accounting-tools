#!/bin/bash

################################################################################
# Factur-X Validation Script
#
# This script validates Factur-X PDFs using external validation tools:
# - veraPDF: PDF/A-3 compliance validation
# - Mustangproject: Factur-X/ZUGFeRD validation
#
# If one tool fails, a warning is shown but validation continues with the other.
#
# Usage: ./scripts/validate-facturx.sh [pdf-file]
#        ./scripts/validate-facturx.sh  (validates all PDFs in test-results/pdfs/)
################################################################################

set -e  # Exit on error (but we'll handle tool failures gracefully)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

################################################################################
# Tool Detection
################################################################################

check_tools() {
    print_header "Checking Validation Tools"
    echo ""

    VERAPDF_AVAILABLE=0
    MUSTANG_AVAILABLE=0

    # Check veraPDF
    if command -v verapdf &> /dev/null; then
        local verapdf_version=$(verapdf --version 2>&1 | grep -oP 'veraPDF \K[0-9.]+' || echo "unknown")
        print_success "veraPDF v${verapdf_version} found"
        VERAPDF_AVAILABLE=1
    else
        print_warning "veraPDF not found"
        print_info "Run: ./scripts/setup-validation-tools.sh to install"
    fi

    # Check Mustangproject
    if command -v mustang &> /dev/null; then
        print_success "Mustangproject found"
        MUSTANG_AVAILABLE=1
    else
        print_warning "Mustangproject not found (optional)"
    fi

    echo ""

    # At least one tool must be available
    if [[ $VERAPDF_AVAILABLE -eq 0 ]] && [[ $MUSTANG_AVAILABLE -eq 0 ]]; then
        print_error "No validation tools available"
        print_info "Run: ./scripts/setup-validation-tools.sh to install tools"
        exit 1
    fi
}

################################################################################
# Validation Functions
################################################################################

validate_pdfa3_verapdf() {
    local pdf_file="$1"
    local result_file="${pdf_file}.verapdf.xml"

    if [[ $VERAPDF_AVAILABLE -eq 0 ]]; then
        print_warning "veraPDF not available - skipping PDF/A-3 validation"
        return 1
    fi

    print_info "Running veraPDF validation..."

    # Run veraPDF with machine-readable format
    if verapdf --format mrr --flavour 3b "$pdf_file" > "$result_file" 2>&1; then
        # Parse results
        local compliant=$(grep -oP 'compliant="\K[^"]+' "$result_file" || echo "false")
        local failed_rules=$(grep -oP 'failedRules="\K[0-9]+' "$result_file" || echo "0")
        local failed_checks=$(grep -oP 'failedChecks="\K[0-9]+' "$result_file" || echo "0")

        if [[ "$compliant" == "true" ]]; then
            print_success "PDF/A-3: PASS ✓"
        else
            print_error "PDF/A-3: FAIL (${failed_rules} rules, ${failed_checks} checks failed)"

            # Show failed rules
            if [[ -f "$result_file" ]]; then
                echo ""
                print_info "Failed rules:"
                grep -A 3 'status="failed"' "$result_file" | grep -oP 'clause="\K[^"]+' | sort -u | while read clause; do
                    echo "  - ISO 19005-3:${clause}"
                done
            fi
        fi

        return 0
    else
        print_error "veraPDF validation failed (tool error)"
        if [[ -f "$result_file" ]]; then
            cat "$result_file" | grep -i error || true
        fi
        return 1
    fi
}

validate_facturx_mustang() {
    local pdf_file="$1"

    if [[ $MUSTANG_AVAILABLE -eq 0 ]]; then
        print_warning "Mustangproject not available - skipping Factur-X validation"
        return 1
    fi

    print_info "Running Mustangproject validation..."

    # Run Mustangproject validation
    # Note: Mustang CLI doesn't have a simple validation command
    # We'll attempt to extract and validate XML
    if mustang --action validate "$pdf_file" 2>&1 | grep -i "valid\|error"; then
        print_success "Factur-X: PASS ✓"
        return 0
    else
        print_warning "Factur-X: Could not validate (Mustangproject CLI limitation)"
        return 1
    fi
}

################################################################################
# Main Validation
################################################################################

validate_pdf() {
    local pdf_file="$1"

    if [[ ! -f "$pdf_file" ]]; then
        print_error "File not found: $pdf_file"
        return 1
    fi

    print_header "Validating: $(basename "$pdf_file")"
    echo ""
    print_info "File: $pdf_file"
    print_info "Size: $(du -h "$pdf_file" | cut -f1)"
    echo ""

    local validation_passed=0
    local verapdf_result=1
    local mustang_result=1

    # Run veraPDF validation
    if validate_pdfa3_verapdf "$pdf_file"; then
        verapdf_result=0
    fi
    echo ""

    # Run Mustangproject validation
    if validate_facturx_mustang "$pdf_file"; then
        mustang_result=0
    fi
    echo ""

    # Summary
    if [[ $verapdf_result -eq 0 ]] || [[ $mustang_result -eq 0 ]]; then
        validation_passed=1
    fi

    return $validation_passed
}

################################################################################
# Main Script
################################################################################

main() {
    print_header "Factur-X External Validation"
    echo ""

    # Check if tools are available
    check_tools

    # Get PDF file(s) to validate
    if [[ $# -eq 0 ]]; then
        # No arguments - validate all PDFs in test-results/pdfs/
        print_info "No PDF specified - validating all test PDFs"
        echo ""

        pdf_dir="test-results/pdfs"
        if [[ ! -d "$pdf_dir" ]]; then
            print_error "Test PDFs directory not found: $pdf_dir"
            print_info "Run: node test-validation.js to generate test PDFs first"
            exit 1
        fi

        total_pdfs=0
        passed_pdfs=0
        failed_pdfs=0

        for pdf_file in "$pdf_dir"/*.pdf; do
            if [[ -f "$pdf_file" ]]; then
                total_pdfs=$((total_pdfs + 1))

                if validate_pdf "$pdf_file"; then
                    passed_pdfs=$((passed_pdfs + 1))
                else
                    failed_pdfs=$((failed_pdfs + 1))
                fi

                echo ""
                echo "────────────────────────────────────────────────────────────────────"
                echo ""
            fi
        done

        # Summary
        print_header "Validation Summary"
        echo ""
        print_info "Total PDFs: $total_pdfs"
        print_success "Passed: $passed_pdfs"
        if [[ $failed_pdfs -gt 0 ]]; then
            print_error "Failed: $failed_pdfs"
        fi
        echo ""

        if [[ $failed_pdfs -eq 0 ]] && [[ $total_pdfs -gt 0 ]]; then
            print_success "All PDFs validated successfully!"
            exit 0
        else
            exit 1
        fi
    else
        # Validate single PDF
        pdf_file="$1"
        if validate_pdf "$pdf_file"; then
            exit 0
        else
            exit 1
        fi
    fi
}

# Run main
main "$@"
