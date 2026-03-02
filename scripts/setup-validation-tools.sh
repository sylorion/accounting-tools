#!/bin/bash

################################################################################
# External Validation Tools Setup Script
#
# This script installs and configures external validation tools:
# - veraPDF: PDF/A-3 validator
# - Mustangproject: Factur-X/ZUGFeRD validator
#
# Usage: ./scripts/setup-validation-tools.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERAPDF_VERSION="1.28.2"
VERAPDF_INSTALLER="verapdf-greenfield-${VERAPDF_VERSION}-installer.zip"
VERAPDF_URL="https://software.verapdf.org/releases/${VERAPDF_VERSION}/${VERAPDF_INSTALLER}"
VERAPDF_INSTALL_DIR="/usr/local/verapdf"
VERAPDF_AUTO_XML="/tmp/verapdf-auto-install.xml"

MUSTANG_VERSION="2.13.1"
MUSTANG_JAR="Mustang-CLI-${MUSTANG_VERSION}.jar"
MUSTANG_URL="https://github.com/ZUGFeRD/mustangproject/releases/download/v${MUSTANG_VERSION}/${MUSTANG_JAR}"
MUSTANG_INSTALL_DIR="/usr/local/mustangproject"

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
    echo -e "${BLUE}ℹ${NC} $1"
}

################################################################################
# veraPDF Installation
################################################################################

install_verapdf() {
    print_header "Installing veraPDF v${VERAPDF_VERSION}"

    # Check if already installed
    if command -v verapdf &> /dev/null; then
        local installed_version=$(verapdf --version 2>&1 | grep -oP 'veraPDF \K[0-9.]+' || echo "unknown")
        if [[ "$installed_version" == "$VERAPDF_VERSION" ]]; then
            print_success "veraPDF v${VERAPDF_VERSION} already installed"
            return 0
        else
            print_info "Found veraPDF v${installed_version}, upgrading to v${VERAPDF_VERSION}"
        fi
    fi

    # Create auto-install configuration
    print_info "Creating auto-install configuration..."
    cat > "$VERAPDF_AUTO_XML" <<'EOF'
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<AutomatedInstallation langpack="eng">
    <com.izforge.izpack.panels.htmlhello.HTMLHelloPanel id="welcome"/>
    <com.izforge.izpack.panels.target.TargetPanel id="install_dir">
        <installpath>/usr/local/verapdf</installpath>
    </com.izforge.izpack.panels.target.TargetPanel>
    <com.izforge.izpack.panels.packs.PacksPanel id="sdk_pack_select">
        <pack index="0" name="veraPDF GUI" selected="false"/>
        <pack index="1" name="veraPDF Batch Processor" selected="true"/>
        <pack index="2" name="veraPDF validation model" selected="true"/>
        <pack index="3" name="veraPDF PDF/A validation profiles" selected="true"/>
    </com.izforge.izpack.panels.packs.PacksPanel>
    <com.izforge.izpack.panels.install.InstallPanel id="install"/>
    <com.izforge.izpack.panels.finish.FinishPanel id="finish"/>
</AutomatedInstallation>
EOF

    # Download installer
    print_info "Downloading veraPDF installer..."
    if ! wget -q --show-progress "$VERAPDF_URL" -O "/tmp/${VERAPDF_INSTALLER}"; then
        print_error "Failed to download veraPDF installer"
        return 1
    fi

    # Extract installer
    print_info "Extracting installer..."
    if ! unzip -q "/tmp/${VERAPDF_INSTALLER}" -d /tmp/verapdf-installer; then
        print_error "Failed to extract veraPDF installer"
        return 1
    fi

    # Run installer with auto-install configuration
    print_info "Installing veraPDF to ${VERAPDF_INSTALL_DIR}..."
    if ! java -jar /tmp/verapdf-installer/verapdf-izpack-installer-*.jar "$VERAPDF_AUTO_XML"; then
        print_error "Failed to install veraPDF"
        return 1
    fi

    # Create symlink
    print_info "Creating symlink in /usr/local/bin..."
    if ! ln -sf "${VERAPDF_INSTALL_DIR}/verapdf" /usr/local/bin/verapdf; then
        print_error "Failed to create symlink"
        return 1
    fi

    # Cleanup
    print_info "Cleaning up installation files..."
    rm -rf "/tmp/${VERAPDF_INSTALLER}" /tmp/verapdf-installer "$VERAPDF_AUTO_XML"

    # Verify installation
    if command -v verapdf &> /dev/null; then
        print_success "veraPDF v${VERAPDF_VERSION} installed successfully"
        verapdf --version
        return 0
    else
        print_error "veraPDF installation verification failed"
        return 1
    fi
}

################################################################################
# Mustangproject Installation
################################################################################

install_mustangproject() {
    print_header "Installing Mustangproject v${MUSTANG_VERSION}"

    # Check if already installed
    if [[ -f "${MUSTANG_INSTALL_DIR}/${MUSTANG_JAR}" ]]; then
        print_success "Mustangproject v${MUSTANG_VERSION} already installed"
        return 0
    fi

    # Create installation directory
    print_info "Creating installation directory..."
    mkdir -p "$MUSTANG_INSTALL_DIR"

    # Download JAR
    print_info "Downloading Mustangproject JAR..."
    if ! wget -q --show-progress "$MUSTANG_URL" -O "${MUSTANG_INSTALL_DIR}/${MUSTANG_JAR}"; then
        print_warning "Failed to download Mustangproject (GitHub releases may be unavailable)"
        print_warning "Mustangproject validation will be skipped"
        return 1
    fi

    # Create wrapper script
    print_info "Creating wrapper script..."
    cat > "${MUSTANG_INSTALL_DIR}/mustang" <<EOF
#!/bin/bash
java -jar "${MUSTANG_INSTALL_DIR}/${MUSTANG_JAR}" "\$@"
EOF
    chmod +x "${MUSTANG_INSTALL_DIR}/mustang"

    # Create symlink
    print_info "Creating symlink in /usr/local/bin..."
    if ! ln -sf "${MUSTANG_INSTALL_DIR}/mustang" /usr/local/bin/mustang; then
        print_warning "Failed to create symlink for Mustangproject"
        return 1
    fi

    # Verify installation
    if command -v mustang &> /dev/null; then
        print_success "Mustangproject v${MUSTANG_VERSION} installed successfully"
        return 0
    else
        print_warning "Mustangproject installation verification failed"
        return 1
    fi
}

################################################################################
# Check Java Installation
################################################################################

check_java() {
    print_header "Checking Java Installation"

    if ! command -v java &> /dev/null; then
        print_error "Java is not installed"
        print_info "Please install Java 8 or higher"
        exit 1
    fi

    local java_version=$(java -version 2>&1 | grep -oP 'version "\K[0-9.]+' | head -1)
    print_success "Java ${java_version} found"
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    print_header "External Validation Tools Setup"
    echo ""

    # Check Java
    check_java
    echo ""

    # Install veraPDF
    VERAPDF_INSTALLED=0
    if install_verapdf; then
        VERAPDF_INSTALLED=1
    fi
    echo ""

    # Install Mustangproject (optional)
    MUSTANG_INSTALLED=0
    if install_mustangproject; then
        MUSTANG_INSTALLED=1
    fi
    echo ""

    # Summary
    print_header "Installation Summary"
    echo ""

    if [[ $VERAPDF_INSTALLED -eq 1 ]]; then
        print_success "veraPDF: Installed and ready"
    else
        print_error "veraPDF: Installation failed"
    fi

    if [[ $MUSTANG_INSTALLED -eq 1 ]]; then
        print_success "Mustangproject: Installed and ready"
    else
        print_warning "Mustangproject: Not available (validation will use veraPDF only)"
    fi

    echo ""
    print_header "Next Steps"
    echo ""
    print_info "Run validation tests: npm run test:validation"
    print_info "Or run: node test-validation.js"
    echo ""

    if [[ $VERAPDF_INSTALLED -eq 1 ]]; then
        exit 0
    else
        print_error "Critical: veraPDF installation failed. External validation cannot proceed."
        exit 1
    fi
}

# Run main
main
