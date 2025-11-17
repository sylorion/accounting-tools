/**
 * External validation tools integration for Factur-X documents
 *
 * This module provides TypeScript wrappers for external validation tools:
 * - veraPDF: Industry standard PDF/A-3 validator
 * - Mustangproject: Factur-X/ZUGFeRD validator
 *
 * @module ExternalValidators
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

const execFileAsync = promisify(execFile);

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Result of veraPDF validation
 */
export interface VeraPDFResult {
  readonly isValid: boolean;
  readonly isCompliant: boolean;
  readonly profile: string;
  readonly errors: ReadonlyArray<VeraPDFError>;
  readonly warnings: ReadonlyArray<VeraPDFWarning>;
  readonly metadata: VeraPDFMetadata;
  readonly rawReport?: string;
}

export interface VeraPDFError {
  readonly clause: string;
  readonly specification: string;
  readonly level: 'Error' | 'Warning';
  readonly message: string;
  readonly location?: string;
}

export interface VeraPDFWarning {
  readonly message: string;
  readonly context?: string;
}

export interface VeraPDFMetadata {
  readonly pdfVersion: string;
  readonly fileSize: number;
  readonly pageCount: number;
  readonly hasAttachments: boolean;
  readonly creationDate?: string;
  readonly modificationDate?: string;
}

/**
 * Result of Mustangproject validation
 */
export interface MustangprojectResult {
  readonly isValid: boolean;
  readonly profile: string;
  readonly errors: ReadonlyArray<MustangError>;
  readonly warnings: ReadonlyArray<MustangWarning>;
  readonly xmlExtracted: boolean;
  readonly xmlContent?: string;
  readonly rawReport?: string;
}

export interface MustangError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'FATAL' | 'ERROR' | 'WARNING';
  readonly xpath?: string;
}

export interface MustangWarning {
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * Combined external validation result
 */
export interface ExternalValidationResult {
  readonly timestamp: Date;
  readonly veraPDF?: VeraPDFResult;
  readonly mustangproject?: MustangprojectResult;
  readonly isFullyValid: boolean;
  readonly summary: ExternalValidationSummary;
}

export interface ExternalValidationSummary {
  readonly totalErrors: number;
  readonly totalWarnings: number;
  readonly pdfA3Compliant: boolean;
  readonly facturXCompliant: boolean;
  readonly recommendations: ReadonlyArray<string>;
}

/**
 * Configuration for external validators
 */
export interface ExternalValidatorConfig {
  readonly veraPDFPath?: string;
  readonly mustangprojectPath?: string;
  readonly tempDir?: string;
  readonly timeout?: number; // milliseconds
  readonly saveReports?: boolean;
  readonly reportsDir?: string;
}

// ============================================================================
// Validator Installation Check
// ============================================================================

/**
 * Check if veraPDF is installed and get its path
 */
export async function findVeraPDF(): Promise<string | null> {
  const possiblePaths = [
    process.env.VERAPDF_HOME ? path.join(process.env.VERAPDF_HOME, 'verapdf') : null,
    '/opt/verapdf/verapdf',
    path.join(process.env.HOME || '', 'verapdf', 'verapdf'),
    'verapdf', // Try in PATH
  ].filter(Boolean) as string[];

  for (const verapdfPath of possiblePaths) {
    try {
      const { stdout } = await execFileAsync(verapdfPath, ['--version'], { timeout: 5000 });
      if (stdout.includes('veraPDF')) {
        return verapdfPath;
      }
    } catch (error) {
      // Continue trying other paths
    }
  }

  return null;
}

/**
 * Check if Mustangproject is installed and get its JAR path
 */
export async function findMustangproject(): Promise<string | null> {
  const possiblePaths = [
    process.env.MUSTANG_JAR,
    '/opt/mustangproject/Mustang-CLI.jar',
    path.join(process.env.HOME || '', 'mustangproject', 'Mustang-CLI.jar'),
  ].filter(Boolean) as string[];

  for (const jarPath of possiblePaths) {
    if (existsSync(jarPath)) {
      return jarPath;
    }
  }

  return null;
}

/**
 * Check which external validators are available
 */
export async function checkExternalValidators(): Promise<{
  veraPDF: boolean;
  mustangproject: boolean;
  veraPDFPath?: string;
  mustangprojectPath?: string;
}> {
  const veraPDFPath = await findVeraPDF();
  const mustangprojectPath = await findMustangproject();

  return {
    veraPDF: veraPDFPath !== null,
    mustangproject: mustangprojectPath !== null,
    veraPDFPath: veraPDFPath || undefined,
    mustangprojectPath: mustangprojectPath || undefined,
  };
}

// ============================================================================
// veraPDF Validator
// ============================================================================

/**
 * Validate PDF/A-3 compliance using veraPDF
 */
export class VeraPDFValidator {
  private readonly veraPDFPath: string;
  private readonly timeout: number;
  private readonly saveReports: boolean;
  private readonly reportsDir?: string;

  constructor(config: ExternalValidatorConfig = {}) {
    this.veraPDFPath = config.veraPDFPath || 'verapdf';
    this.timeout = config.timeout || 60000; // 60 seconds default
    this.saveReports = config.saveReports || false;
    this.reportsDir = config.reportsDir;
  }

  /**
   * Validate a PDF file for PDF/A-3 compliance
   */
  async validate(pdfPath: string): Promise<VeraPDFResult> {
    try {
      // Run veraPDF with machine-readable output
      const args = [
        '--format', 'mrr', // Machine-Readable Report
        '--flavour', '3b', // PDF/A-3b (required for Factur-X)
        pdfPath
      ];

      const { stdout } = await execFileAsync(
        this.veraPDFPath,
        args,
        {
          timeout: this.timeout,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      );

      // Save report if requested
      if (this.saveReports && this.reportsDir) {
        const reportPath = path.join(
          this.reportsDir,
          `verapdf-${Date.now()}.xml`
        );
        await fs.mkdir(this.reportsDir, { recursive: true });
        await fs.writeFile(reportPath, stdout);
      }

      // Parse veraPDF output
      return this.parseVeraPDFOutput(stdout, pdfPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(
          `veraPDF not found at '${this.veraPDFPath}'. ` +
          'Please install veraPDF or specify the correct path.'
        );
      }
      if (error.killed && error.signal === 'SIGTERM') {
        throw new Error(`veraPDF validation timeout after ${this.timeout}ms`);
      }
      throw new Error(`veraPDF validation failed: ${error.message}`);
    }
  }

  /**
   * Parse veraPDF machine-readable output
   */
  private async parseVeraPDFOutput(
    output: string,
    pdfPath: string
  ): Promise<VeraPDFResult> {
    const errors: VeraPDFError[] = [];
    const warnings: VeraPDFWarning[] = [];

    // Simple parsing (for a production version, use XML parser)
    const isCompliant = output.includes('compliant="true"') ||
                        output.includes('<validationResult isCompliant="true"');
    const isValid = !output.includes('isValid="false"');

    // Extract profile
    let profile = 'PDF/A-3b';
    const profileMatch = output.match(/flavour="([^"]+)"/);
    if (profileMatch) {
      profile = profileMatch[1];
    }

    // Extract errors (simplified - in production, use proper XML parsing)
    const errorPattern = /<error[^>]*specification="([^"]*)"[^>]*clause="([^"]*)"[^>]*>(.*?)<\/error>/gs;
    let match;
    while ((match = errorPattern.exec(output)) !== null) {
      errors.push({
        specification: match[1] || 'Unknown',
        clause: match[2] || 'Unknown',
        level: 'Error',
        message: match[3]?.trim() || 'Validation error',
      });
    }

    // Get file metadata
    const stats = await fs.stat(pdfPath);
    const metadata: VeraPDFMetadata = {
      pdfVersion: '1.7', // Default, should parse from PDF
      fileSize: stats.size,
      pageCount: 0, // Should parse from veraPDF output
      hasAttachments: output.includes('EmbeddedFile') || output.includes('attachment'),
    };

    return {
      isValid,
      isCompliant,
      profile,
      errors,
      warnings,
      metadata,
      rawReport: output,
    };
  }

  /**
   * Check if veraPDF is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync(this.veraPDFPath, ['--version'], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Mustangproject Validator
// ============================================================================

/**
 * Validate Factur-X compliance using Mustangproject
 */
export class MustangprojectValidator {
  private readonly jarPath: string;
  private readonly javaPath: string;
  private readonly timeout: number;
  private readonly saveReports: boolean;
  private readonly reportsDir?: string;

  constructor(config: ExternalValidatorConfig = {}) {
    this.jarPath = config.mustangprojectPath ||
                   process.env.MUSTANG_JAR ||
                   '/opt/mustangproject/Mustang-CLI.jar';
    this.javaPath = process.env.JAVA_HOME
      ? path.join(process.env.JAVA_HOME, 'bin', 'java')
      : 'java';
    this.timeout = config.timeout || 60000;
    this.saveReports = config.saveReports || false;
    this.reportsDir = config.reportsDir;
  }

  /**
   * Validate a Factur-X PDF
   */
  async validate(pdfPath: string): Promise<MustangprojectResult> {
    try {
      // Run Mustangproject validation
      const args = [
        '-jar', this.jarPath,
        '--action', 'validate',
        '--source', pdfPath
      ];

      const { stdout, stderr } = await execFileAsync(
        this.javaPath,
        args,
        {
          timeout: this.timeout,
          maxBuffer: 10 * 1024 * 1024
        }
      );

      const combinedOutput = stdout + '\n' + stderr;

      // Save report if requested
      if (this.saveReports && this.reportsDir) {
        const reportPath = path.join(
          this.reportsDir,
          `mustang-${Date.now()}.txt`
        );
        await fs.mkdir(this.reportsDir, { recursive: true });
        await fs.writeFile(reportPath, combinedOutput);
      }

      return this.parseMustangOutput(combinedOutput);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(
          `Java or Mustangproject not found. ` +
          `Java: '${this.javaPath}', JAR: '${this.jarPath}'. ` +
          'Please install Java and Mustangproject or specify correct paths.'
        );
      }
      if (error.killed && error.signal === 'SIGTERM') {
        throw new Error(`Mustangproject validation timeout after ${this.timeout}ms`);
      }

      // Mustangproject might return non-zero exit on validation errors
      // Parse output even if execution "failed"
      if (error.stdout || error.stderr) {
        const combinedOutput = (error.stdout || '') + '\n' + (error.stderr || '');
        return this.parseMustangOutput(combinedOutput);
      }

      throw new Error(`Mustangproject validation failed: ${error.message}`);
    }
  }

  /**
   * Extract XML from Factur-X PDF
   */
  async extractXML(pdfPath: string, outputPath?: string): Promise<string> {
    const tempOutput = outputPath || path.join(
      process.env.TMPDIR || '/tmp',
      `facturx-${Date.now()}.xml`
    );

    try {
      const args = [
        '-jar', this.jarPath,
        '--action', 'extract',
        '--source', pdfPath,
        '--out', tempOutput
      ];

      await execFileAsync(this.javaPath, args, { timeout: this.timeout });

      const xmlContent = await fs.readFile(tempOutput, 'utf-8');

      // Clean up temp file if we created it
      if (!outputPath) {
        await fs.unlink(tempOutput).catch(() => {});
      }

      return xmlContent;
    } catch (error: any) {
      throw new Error(`Failed to extract XML: ${error.message}`);
    }
  }

  /**
   * Parse Mustangproject output
   */
  private parseMustangOutput(output: string): MustangprojectResult {
    const errors: MustangError[] = [];
    const warnings: MustangWarning[] = [];

    // Check if validation passed
    const isValid = output.includes('valid') &&
                    !output.includes('invalid') &&
                    !output.toLowerCase().includes('error');

    // Detect profile
    let profile = 'UNKNOWN';
    if (output.includes('MINIMUM')) profile = 'MINIMUM';
    else if (output.includes('BASIC-WL')) profile = 'BASIC-WL';
    else if (output.includes('BASIC')) profile = 'BASIC';
    else if (output.includes('EN16931')) profile = 'EN16931';
    else if (output.includes('EXTENDED')) profile = 'EXTENDED';

    // Extract errors (simplified parsing)
    const errorLines = output.split('\n').filter(line =>
      line.toLowerCase().includes('error') ||
      line.toLowerCase().includes('exception') ||
      line.toLowerCase().includes('invalid')
    );

    errorLines.forEach(line => {
      if (line.trim()) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: line.trim(),
          severity: 'ERROR',
        });
      }
    });

    // Extract warnings
    const warningLines = output.split('\n').filter(line =>
      line.toLowerCase().includes('warning') ||
      line.toLowerCase().includes('warn')
    );

    warningLines.forEach(line => {
      if (line.trim()) {
        warnings.push({
          message: line.trim(),
        });
      }
    });

    return {
      isValid,
      profile,
      errors,
      warnings,
      xmlExtracted: output.includes('extracted') || output.includes('XML'),
      rawReport: output,
    };
  }

  /**
   * Check if Mustangproject is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if Java is available
      await execFileAsync(this.javaPath, ['-version'], { timeout: 5000 });

      // Check if JAR exists
      return existsSync(this.jarPath);
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Combined External Validator
// ============================================================================

/**
 * Combined external validation using both veraPDF and Mustangproject
 */
export class ExternalValidator {
  private readonly veraPDF: VeraPDFValidator;
  private readonly mustang: MustangprojectValidator;

  constructor(config: ExternalValidatorConfig = {}) {
    this.veraPDF = new VeraPDFValidator(config);
    this.mustang = new MustangprojectValidator(config);
  }

  /**
   * Validate a Factur-X PDF with all available external tools
   */
  async validate(pdfPath: string): Promise<ExternalValidationResult> {
    const timestamp = new Date();
    let veraPDFResult: VeraPDFResult | undefined;
    let mustangResult: MustangprojectResult | undefined;

    // Run veraPDF validation
    const veraPDFAvailable = await this.veraPDF.isAvailable();
    if (veraPDFAvailable) {
      try {
        veraPDFResult = await this.veraPDF.validate(pdfPath);
      } catch (error: any) {
        console.warn(`veraPDF validation failed: ${error.message}`);
      }
    }

    // Run Mustangproject validation
    const mustangAvailable = await this.mustang.isAvailable();
    if (mustangAvailable) {
      try {
        mustangResult = await this.mustang.validate(pdfPath);
      } catch (error: any) {
        console.warn(`Mustangproject validation failed: ${error.message}`);
      }
    }

    // Build summary
    const summary = this.buildSummary(veraPDFResult, mustangResult);

    return {
      timestamp,
      veraPDF: veraPDFResult,
      mustangproject: mustangResult,
      isFullyValid: summary.pdfA3Compliant && summary.facturXCompliant,
      summary,
    };
  }

  /**
   * Build validation summary
   */
  private buildSummary(
    veraPDF?: VeraPDFResult,
    mustang?: MustangprojectResult
  ): ExternalValidationSummary {
    const totalErrors =
      (veraPDF?.errors.length || 0) +
      (mustang?.errors.length || 0);

    const totalWarnings =
      (veraPDF?.warnings.length || 0) +
      (mustang?.warnings.length || 0);

    const pdfA3Compliant = veraPDF?.isCompliant ?? false;
    const facturXCompliant = mustang?.isValid ?? false;

    const recommendations: string[] = [];

    if (!pdfA3Compliant && veraPDF) {
      recommendations.push('Fix PDF/A-3 compliance issues reported by veraPDF');
    }

    if (!facturXCompliant && mustang) {
      recommendations.push('Fix Factur-X compliance issues reported by Mustangproject');
    }

    if (!veraPDF && !mustang) {
      recommendations.push('Install external validation tools (veraPDF and Mustangproject)');
    } else if (!veraPDF) {
      recommendations.push('Install veraPDF for PDF/A-3 validation');
    } else if (!mustang) {
      recommendations.push('Install Mustangproject for Factur-X validation');
    }

    return {
      totalErrors,
      totalWarnings,
      pdfA3Compliant,
      facturXCompliant,
      recommendations,
    };
  }

  /**
   * Check which validators are available
   */
  async getAvailableValidators(): Promise<{
    veraPDF: boolean;
    mustangproject: boolean;
  }> {
    return {
      veraPDF: await this.veraPDF.isAvailable(),
      mustangproject: await this.mustang.isAvailable(),
    };
  }

  /**
   * Extract XML from Factur-X PDF
   */
  async extractXML(pdfPath: string, outputPath?: string): Promise<string | null> {
    const available = await this.mustang.isAvailable();
    if (!available) {
      return null;
    }

    try {
      return await this.mustang.extractXML(pdfPath, outputPath);
    } catch (error: any) {
      console.warn(`XML extraction failed: ${error.message}`);
      return null;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get default external validator instance
 */
let defaultValidator: ExternalValidator | null = null;

export function getDefaultExternalValidator(
  config?: ExternalValidatorConfig
): ExternalValidator {
  if (!defaultValidator) {
    defaultValidator = new ExternalValidator(config);
  }
  return defaultValidator;
}

/**
 * Quick validation with external tools
 */
export async function validateWithExternalTools(
  pdfPath: string,
  config?: ExternalValidatorConfig
): Promise<ExternalValidationResult> {
  const validator = getDefaultExternalValidator(config);
  return validator.validate(pdfPath);
}

/**
 * Extract XML using external tools
 */
export async function extractXMLWithExternalTools(
  pdfPath: string,
  outputPath?: string,
  config?: ExternalValidatorConfig
): Promise<string | null> {
  const validator = getDefaultExternalValidator(config);
  return validator.extractXML(pdfPath, outputPath);
}
