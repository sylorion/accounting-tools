#!/usr/bin/env node

/**
 * @module CLI
 * @description Modern CLI for Factur-X - Uses production libraries
 *
 * Commands:
 * - invoice: Generate demo invoice
 * - validate: Validate Factur-X XML
 * - help: Show help
 */

import fs from 'fs';
import path from 'path';
import {
  validateXml,
  FacturxProfile,
} from '@facturx/core';

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function error(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function success(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function info(message: string) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function showHelp() {
  console.log(`
${colors.cyan}Factur-X CLI - Production Ready${colors.reset}
Version 1.0.0

USAGE:
  facturx <command> [options]

COMMANDS:
  ${colors.green}invoice${colors.reset}     Generate demo invoice (coming soon)
  ${colors.green}validate${colors.reset}    Validate Factur-X XML file
  ${colors.green}help${colors.reset}        Show this help

EXAMPLES:
  facturx validate invoice.xml

POWERED BY:
  @facturx/core      - Production invoice library
  @facturx/templates - Professional PDF templates
`);
}

function validateFile(filePath: string) {
  info(`Validating: ${filePath}`);
  console.log('');

  try {
    if (!fs.existsSync(filePath)) {
      error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const xml = fs.readFileSync(filePath, 'utf-8');
    const result = validateXml(xml, FacturxProfile.EN16931);

    if (result.isValid) {
      success('XML is valid!');
    } else {
      error('XML validation failed');
      console.log('');
      console.log('Errors:');
      for (const err of result.errors) {
        console.log(`  [${err.code}] Line ${err.line}:${err.column} - ${err.message}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('');
      console.log('Warnings:');
      for (const warn of result.warnings) {
        console.log(`  ${warn}`);
      }
    }

    console.log('');
    info(`Profile: ${result.profile}`);
    info(`Cached: ${result.cached ? 'Yes' : 'No'}`);

  } catch (err: any) {
    error(`Validation error: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'invoice':
      info('Invoice generation coming soon!');
      info('Use the production libraries @facturx/core and @facturx/templates directly.');
      break;

    case 'validate':
      if (!args[1]) {
        error('Please provide XML file path');
        console.log('Usage: facturx validate <file.xml>');
        process.exit(1);
      }
      validateFile(args[1]);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      if (!command) {
        showHelp();
      } else {
        error(`Unknown command: ${command}`);
        console.log('Run "facturx help" for usage');
        process.exit(1);
      }
  }
}

main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
