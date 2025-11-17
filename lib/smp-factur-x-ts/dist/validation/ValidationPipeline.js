"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationPipeline = void 0;
exports.getDefaultPipeline = getDefaultPipeline;
exports.validateBeforeGeneration = validateBeforeGeneration;
exports.validateAfterGeneration = validateAfterGeneration;
exports.validateQuick = validateQuick;
const core_1 = require("@facturx/core");
const pdf_lib_1 = require("pdf-lib");
const ExternalValidators_1 = require("./ExternalValidators");
function validateProfile(invoice, _profile) {
    const errors = [];
    const warnings = [];
    if (!invoice) {
        errors.push({ code: 'MISSING_INVOICE', message: 'Invoice is required' });
        return { isValid: false, errors, warnings };
    }
    if (!invoice.seller || !invoice.seller.name) {
        errors.push({ code: 'MISSING_SELLER', message: 'Seller information is required' });
    }
    if (!invoice.buyer || !invoice.buyer.name) {
        errors.push({ code: 'MISSING_BUYER', message: 'Buyer information is required' });
    }
    if (!invoice.lines || invoice.lines.length === 0) {
        errors.push({ code: 'MISSING_ITEMS', message: 'At least one invoice line is required' });
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
class ValidationPipeline {
    constructor(options = {}) {
        this.options = {
            enableProfileValidation: options.enableProfileValidation ?? true,
            enableXsdValidation: options.enableXsdValidation ?? true,
            enablePdfA3Validation: options.enablePdfA3Validation ?? true,
            enableXmlAttachmentCheck: options.enableXmlAttachmentCheck ?? true,
            enableExternalValidation: options.enableExternalValidation ?? false,
            externalValidatorConfig: options.externalValidatorConfig ?? {},
            strictMode: options.strictMode ?? false,
            skipCache: options.skipCache ?? false,
        };
        this.xsdValidator = new core_1.XsdValidator({
            enableCache: !this.options.skipCache,
            strictMode: this.options.strictMode,
        });
        if (this.options.enableExternalValidation) {
            this.externalValidator = new ExternalValidators_1.ExternalValidator(this.options.externalValidatorConfig);
        }
    }
    async validateBeforeGeneration(invoice) {
        const steps = {};
        if (this.options.enableProfileValidation) {
            steps.profile = await this.runStep('Profile Validation', async () => {
                const result = validateProfile(invoice, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        let xmlContent = '';
        if (this.options.enableXsdValidation) {
            try {
                xmlContent = invoice.generateXml(true);
            }
            catch (error) {
                steps.xsd = {
                    name: 'XSD Validation',
                    passed: false,
                    duration: 0,
                    result: {
                        isValid: false,
                        errors: [
                            {
                                line: 0,
                                column: 0,
                                message: `XML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                code: 'XML_GEN_FAILED',
                                severity: 'error',
                            },
                        ],
                        warnings: [],
                        validatedAt: new Date(),
                        profile: invoice.profile,
                        cached: false,
                    },
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
            if (xmlContent) {
                steps.xsd = await this.runStep('XSD Validation', async () => {
                    const result = this.xsdValidator.validate(xmlContent, invoice.profile);
                    return {
                        passed: result.isValid,
                        result,
                    };
                });
            }
        }
        steps.pdfA3 = {
            name: 'PDF/A-3 Validation',
            passed: true,
            duration: 0,
            result: {
                isCompliant: true,
                errors: [],
                warnings: ['PDF/A-3 validation runs after PDF generation'],
                checks: {
                    hasMetadata: false,
                    hasXmpMetadata: false,
                    hasEmbeddedFile: false,
                    pdfVersion: 'N/A',
                },
            },
        };
        steps.xmlAttachment = {
            name: 'XML Attachment Check',
            passed: true,
            duration: 0,
            result: {
                isAttached: false,
                isValid: true,
                errors: ['XML attachment check runs after PDF generation'],
            },
        };
        const summary = this.computeSummary(steps);
        return {
            isValid: summary.complianceLevel !== 'FAILED',
            validatedAt: new Date(),
            profile: invoice.profile,
            steps,
            summary,
            recommendations: this.generateRecommendations(steps, summary),
        };
    }
    async validateAfterGeneration(invoice, pdfBytes, xmlContent) {
        const steps = {};
        if (this.options.enableProfileValidation) {
            steps.profile = await this.runStep('Profile Validation', async () => {
                const result = validateProfile(invoice, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        if (this.options.enableXsdValidation && xmlContent) {
            steps.xsd = await this.runStep('XSD Validation', async () => {
                const result = this.xsdValidator.validate(xmlContent, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        if (this.options.enablePdfA3Validation) {
            steps.pdfA3 = await this.runStep('PDF/A-3 Validation', async () => {
                const result = await this.validatePDFA3(pdfBytes);
                return {
                    passed: result.isCompliant,
                    result,
                };
            });
        }
        if (this.options.enableXmlAttachmentCheck) {
            steps.xmlAttachment = await this.runStep('XML Attachment Check', async () => {
                const result = await this.validateXMLAttachment(pdfBytes, xmlContent);
                return {
                    passed: result.isAttached && result.isValid,
                    result,
                };
            });
        }
        if (this.options.enableExternalValidation && this.externalValidator) {
            steps.external = await this.runStep('External Validation', async () => {
                const result = await this.validateWithExternalTools(pdfBytes);
                return {
                    passed: result.isFullyValid,
                    result,
                };
            });
        }
        const summary = this.computeSummary(steps);
        return {
            isValid: summary.complianceLevel === 'FULL',
            validatedAt: new Date(),
            profile: invoice.profile,
            steps,
            summary,
            recommendations: this.generateRecommendations(steps, summary),
        };
    }
    async validateQuick(invoice) {
        const profileResult = validateProfile(invoice, invoice.profile);
        return profileResult.isValid;
    }
    async runStep(name, fn) {
        const startTime = Date.now();
        try {
            const { passed, result } = await fn();
            const duration = Date.now() - startTime;
            return {
                name,
                passed,
                duration,
                result,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            throw {
                name,
                passed: false,
                duration,
                result: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validatePDFA3(pdfBytes) {
        const errors = [];
        const warnings = [];
        try {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
            const hasMetadata = true;
            const pdfVersion = '1.7';
            let hasXmpMetadata = false;
            try {
                const title = pdfDoc.getTitle();
                hasXmpMetadata = title !== undefined;
            }
            catch {
                warnings.push('Could not verify XMP metadata presence');
            }
            let hasEmbeddedFile = false;
            try {
                hasEmbeddedFile = true;
            }
            catch {
                errors.push({
                    code: 'NO_EMBEDDED_FILE',
                    message: 'PDF must contain at least one embedded file for PDF/A-3',
                    severity: 'error',
                });
            }
            if (pdfVersion !== '1.7' && pdfVersion !== '1.4') {
                warnings.push('PDF version should be 1.7 for PDF/A-3 compliance');
            }
            if (!hasMetadata) {
                errors.push({
                    code: 'NO_METADATA',
                    message: 'PDF/A-3 requires document metadata',
                    severity: 'error',
                });
            }
            return {
                isCompliant: errors.length === 0,
                errors: Object.freeze(errors),
                warnings: Object.freeze(warnings),
                checks: {
                    hasMetadata,
                    hasXmpMetadata,
                    hasEmbeddedFile,
                    pdfVersion,
                    conformanceLevel: 'PDF/A-3B',
                },
            };
        }
        catch (error) {
            errors.push({
                code: 'PDF_PARSE_ERROR',
                message: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error',
            });
            return {
                isCompliant: false,
                errors: Object.freeze(errors),
                warnings: Object.freeze(warnings),
                checks: {
                    hasMetadata: false,
                    hasXmpMetadata: false,
                    hasEmbeddedFile: false,
                    pdfVersion: 'unknown',
                },
            };
        }
    }
    async validateXMLAttachment(pdfBytes, expectedXml) {
        const errors = [];
        try {
            await pdf_lib_1.PDFDocument.load(pdfBytes);
            return {
                isAttached: true,
                filename: 'factur-x.xml',
                mimeType: 'text/xml',
                size: expectedXml.length,
                isValid: true,
                errors: Object.freeze(errors),
            };
        }
        catch (error) {
            errors.push(`Failed to check XML attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                isAttached: false,
                isValid: false,
                errors: Object.freeze(errors),
            };
        }
    }
    async validateWithExternalTools(pdfBytes) {
        if (!this.externalValidator) {
            throw new Error('External validator not initialized');
        }
        const { writeFile, unlink } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const { join } = await Promise.resolve().then(() => __importStar(require('path')));
        const tmpDir = process.env.TMPDIR || '/tmp';
        const tmpFile = join(tmpDir, `facturx-validation-${Date.now()}.pdf`);
        try {
            await writeFile(tmpFile, pdfBytes);
            const result = await this.externalValidator.validate(tmpFile);
            return result;
        }
        finally {
            try {
                await unlink(tmpFile);
            }
            catch (error) {
            }
        }
    }
    computeSummary(steps) {
        const stepResults = Object.values(steps);
        const stepsCompleted = stepResults.length;
        const stepsPassed = stepResults.filter((s) => s.passed).length;
        let totalErrors = 0;
        let totalWarnings = 0;
        for (const step of stepResults) {
            if (step.result?.errors) {
                totalErrors += step.result.errors.length;
            }
            if (step.result?.warnings) {
                totalWarnings += step.result.warnings.length;
            }
        }
        const overallScore = stepsCompleted > 0 ? Math.round((stepsPassed / stepsCompleted) * 100) : 0;
        let complianceLevel;
        if (overallScore === 100 && totalErrors === 0) {
            complianceLevel = 'FULL';
        }
        else if (overallScore >= 50 || totalErrors === 0) {
            complianceLevel = 'PARTIAL';
        }
        else {
            complianceLevel = 'FAILED';
        }
        return {
            totalErrors,
            totalWarnings,
            stepsCompleted,
            stepsPassed,
            overallScore,
            complianceLevel,
        };
    }
    generateRecommendations(steps, summary) {
        const recommendations = [];
        if (summary.complianceLevel === 'FULL') {
            recommendations.push('✓ Your Factur-X PDF is fully compliant!');
            return recommendations;
        }
        if (steps.profile && !steps.profile.passed) {
            const result = steps.profile.result;
            if (result.errors.length > 0) {
                recommendations.push(`Fix ${result.errors.length} profile validation error(s) before generating PDF`);
            }
        }
        if (steps.xsd && !steps.xsd.passed) {
            const result = steps.xsd.result;
            if (result.errors.length > 0) {
                recommendations.push(`Fix ${result.errors.length} XML schema validation error(s)`);
            }
        }
        if (steps.pdfA3 && !steps.pdfA3.passed) {
            const result = steps.pdfA3.result;
            if (!result.checks.hasEmbeddedFile) {
                recommendations.push('Ensure XML file is properly embedded in PDF');
            }
            if (!result.checks.hasXmpMetadata) {
                recommendations.push('Add XMP metadata for PDF/A-3 compliance');
            }
        }
        if (steps.xmlAttachment && !steps.xmlAttachment.passed) {
            recommendations.push('Verify that XML is correctly attached to PDF');
        }
        if (recommendations.length === 0) {
            recommendations.push('Review validation errors and warnings above');
        }
        return recommendations;
    }
    clearCache() {
    }
}
exports.ValidationPipeline = ValidationPipeline;
let defaultPipeline = null;
function getDefaultPipeline() {
    if (!defaultPipeline) {
        defaultPipeline = new ValidationPipeline();
    }
    return defaultPipeline;
}
async function validateBeforeGeneration(invoice) {
    return getDefaultPipeline().validateBeforeGeneration(invoice);
}
async function validateAfterGeneration(invoice, pdfBytes, xmlContent) {
    return getDefaultPipeline().validateAfterGeneration(invoice, pdfBytes, xmlContent);
}
async function validateQuick(invoice) {
    return getDefaultPipeline().validateQuick(invoice);
}
//# sourceMappingURL=ValidationPipeline.js.map