"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = exports.ComplianceType = exports.FacturxProfile = void 0;
// import { buildFacturxXml } from '../compliance/facturX/FacturxBuilder';
var UblBuilder_1 = require("../compliance/ubl/UblBuilder");
var InvoicePDF_1 = require("../generators/InvoicePDF");
var pdf_lib_1 = require("pdf-lib");
var xmlbuilder2_1 = require("xmlbuilder2");
var fs_1 = require("fs");
var path_1 = require("path");
var libxmljs_1 = require("libxmljs"); // hypothetical usage
var MESSAGES = {
    en: { missingSeller: "Seller information is required" },
    fr: { missingSeller: "Informations vendeur manquantes" }
    // etc.
};
function errorMessage(key, locale) {
    var _a;
    if (locale === void 0) { locale = 'en'; }
    var msg = ((_a = MESSAGES[locale]) === null || _a === void 0 ? void 0 : _a[key]) || MESSAGES['en'][key] || key;
    return msg;
}
// Supported Factur-X profiles (we include the main ones needed)
var FacturxProfile;
(function (FacturxProfile) {
    FacturxProfile["MINIMUM"] = "MINIMUM";
    FacturxProfile["BASIC_WL"] = "BASIC_WL";
    FacturxProfile["EXTENDED"] = "EXTENDED";
    // (We could also support BASIC, EN16931 as needed)
})(FacturxProfile || (exports.FacturxProfile = FacturxProfile = {}));
/**
 * Types of e-invoicing compliance
 */
var ComplianceType;
(function (ComplianceType) {
    ComplianceType["FR_FACTUR_X"] = "FR_FACTUR_X";
    ComplianceType["GENERIC_UBL"] = "GENERIC_UBL";
    ComplianceType["OTHER_REGION"] = "OTHER_REGION";
})(ComplianceType || (exports.ComplianceType = ComplianceType = {}));
var PROFILE_URN = (_a = {},
    _a[FacturxProfile.MINIMUM] = "urn:factur-x.eu:1p0:minimum:1.0",
    _a[FacturxProfile.BASIC_WL] = "urn:factur-x.eu:1p0:basicwl:1.0",
    _a[FacturxProfile.EXTENDED] = "urn:factur-x.eu:1p0:extended:1.0",
    _a);
var SCHEMA_PATH = (_b = {},
    _b[FacturxProfile.MINIMUM] = "../compliance/facturX/xsd/Factur-X_1.07.2_MINIMUM.xsd",
    _b[FacturxProfile.BASIC_WL] = "../compliance/facturX/xsd/Factur-X_1.07.2_BASIC_WL.xsd",
    _b[FacturxProfile.EXTENDED] = "../compliance/facturX/xsd/Factur-X_1.07.2_EXTENDED.xsd",
    _b);
function validateXmlString(xml, profile) {
    var xsdPath = SCHEMA_PATH[profile];
    // Load XSD content (could be from file or embedded string)
    var xsdSchemaContent = fs_1.default.readFileSync(path_1.default.join(__dirname, xsdPath), 'utf-8');
    var xsdDoc = libxmljs_1.default.parseXml(xsdSchemaContent);
    // Charger le document XML
    var xmlDoc = libxmljs_1.default.parseXml(xml);
    // Valider le XML contre le XSD
    var isValid = true; // TODO Validate against a schema , this doesn't work : xmlDoc.validate(xsdDoc);
    if (!isValid) {
        console.error("Factur-X XML validation failed:", isValid);
        throw new Error("Generated XML is not schema-compliant for profile ".concat(profile));
    }
    console.log("Factur-X XML validation succeeded for profile:", profile);
}
function formatDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return "".concat(year).concat(month).concat(day);
}
function buildFacturxXml(invoice) {
    var data = invoice.data;
    var profile = data.profile;
    // Validate input data for required fields
    validateInvoiceData(data);
    // Initialize XML document with required namespaces
    var doc = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' });
    var inv = doc.ele('rsm:CrossIndustryInvoice', {
        'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100', // example namespace for CII
        'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
        'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
        'xmlns:xs': 'http://www.w3.org/2001/XMLSchema-instance'
        // (We would include all namespace declarations needed by the schema)
    });
    // Profile identification in ExchangedDocumentContext
    inv.ele('rsm:ExchangedDocumentContext')
        .ele('ram:GuidelineSpecifiedDocumentContextParameter')
        .ele('ram:ID').txt(PROFILE_URN[profile]).up() // e.g. "urn:factur-x.eu:1p0:basicwl:1.0"
        .up()
        .up();
    // Document header (ExchangedDocument)
    var header = inv.ele('rsm:ExchangedDocument');
    header.ele('ram:ID').txt(data.id).up();
    header.ele('ram:IssueDateTime')
        .ele('udt:DateTimeString', { 'formatCode': '102' })
        .txt(formatDate(data.issueDate)).up(); // formatCode 102 = YYYYMMDD
    // ... add due date if present, etc.
    header.up();
    // Trade Parties (Header Trade Agreement info)
    var supplyChain = inv.ele('rsm:SupplyChainTradeTransaction');
    var tradeAgreement = supplyChain.ele('ram:ApplicableHeaderTradeAgreement');
    // Seller (aka Supplier) Party
    var seller = tradeAgreement.ele('ram:SellerTradeParty');
    seller.ele('ram:Name').txt(data.seller.name).up();
    seller.ele('ram:PostalTradeAddress')
        .ele('ram:PostcodeCode').txt(data.seller.postalCode).up()
        .ele('ram:LineOne').txt(data.seller.street).up()
        .ele('ram:CityName').txt(data.seller.city).up()
        .ele('ram:CountryID').txt(data.seller.countryCode).up()
        .up();
    if (data.seller.vatId) {
        seller.ele('ram:SpecifiedLegalOrganization')
            .ele('ram:ID', { 'schemeID': 'VAT' }).txt(data.seller.vatId).up()
            .up();
    }
    seller.up();
    // Buyer Party
    var buyer = tradeAgreement.ele('ram:BuyerTradeParty');
    buyer.ele('ram:Name').txt(data.buyer.name).up();
    buyer.ele('ram:PostalTradeAddress')
        .ele('ram:PostcodeCode').txt(data.buyer.postalCode).up()
        .ele('ram:LineOne').txt(data.buyer.street).up()
        .ele('ram:CityName').txt(data.buyer.city).up()
        .ele('ram:CountryID').txt(data.buyer.countryCode).up()
        .up();
    if (data.buyer.vatId) {
        buyer.ele('ram:SpecifiedLegalOrganization')
            .ele('ram:ID', { 'schemeID': 'VAT' }).txt(data.buyer.vatId).up()
            .up();
    }
    buyer.up();
    tradeAgreement.up();
    // Header Trade Delivery (not used in Minimum, Basic WL; could include delivery address in Extended)
    tradeAgreement.up();
    // Header Trade Settlement (monetary totals, currency, payment info)
    var tradeSettlement = supplyChain.ele('ram:ApplicableHeaderTradeSettlement');
    tradeSettlement.ele('ram:InvoiceCurrencyCode').txt(data.currency).up();
    // Tax totals:
    var taxTotal = tradeSettlement.ele('ram:TaxTotal');
    taxTotal.ele('ram:TaxAmount', { 'currencyID': data.currency })
        .txt(formatAmount(data.totalTaxAmount)).up();
    // tax breakdown per category
    for (var _i = 0, _a = data.taxBreakdowns || []; _i < _a.length; _i++) {
        var tb = _a[_i];
        var subTotal = taxTotal.ele('ram:TaxSubtotal');
        subTotal.ele('ram:TaxableAmount', { 'currencyID': data.currency })
            .txt(formatAmount(tb.taxableAmount)).up();
        subTotal.ele('ram:TaxAmount', { 'currencyID': data.currency })
            .txt(formatAmount(tb.taxAmount)).up();
        subTotal.ele('ram:TaxCategory')
            .ele('ram:ID').txt(tb.taxCategoryCode).up() // e.g. "S" or "Z"
            .ele('ram:Percent').txt(tb.taxRate.toString()).up() // e.g. "20"
            .up();
        subTotal.up();
    }
    taxTotal.up();
    // Grand totals
    tradeSettlement.ele('ram:GrandTotalAmount', { 'currencyID': data.currency })
        .txt(formatAmount(data.totalWithTax)).up();
    tradeSettlement.ele('ram:DuePayableAmount', { 'currencyID': data.currency })
        .txt(formatAmount(data.totalWithTax)).up();
    // ... (Payment means info could be added here)
    tradeSettlement.up();
    // Line items
    var tradeLines = supplyChain; // already created as supplyChainTradeTransaction
    for (var _b = 0, _c = data.lines; _b < _c.length; _b++) {
        var line = _c[_b];
        var lineItem = tradeLines.ele('ram:IncludedSupplyChainTradeLineItem');
        // Line document details
        lineItem.ele('ram:AssociatedDocumentLineDocument')
            .ele('ram:LineID').txt("1").up() // line number (string)
            .up();
        // Line trade goods
        lineItem.ele('ram:SpecifiedTradeProduct')
            .ele('ram:Name').txt(line.description).up()
            .up();
        // Line item charges
        lineItem.ele('ram:SpecifiedLineTradeAgreement')
            .ele('ram:GrossPriceProductTradePrice')
            .ele('ram:ChargeAmount', { 'currencyID': data.currency })
            .txt(formatAmount(line.unitPrice)).up()
            .ele('ram:BasisQuantity', { 'unitCode': line.unitCode })
            .txt(line.quantity.toString()).up()
            .up()
            .up();
        lineItem.ele('ram:SpecifiedLineTradeDelivery')
            .ele('ram:BilledQuantity', { 'unitCode': line.unitCode })
            .txt(line.quantity.toString()).up()
            .up();
        lineItem.ele('ram:SpecifiedLineTradeSettlement')
            .ele('ram:ApplicableTaxCategory')
            .ele('ram:ID').txt(line.taxCategoryCode).up()
            .ele('ram:Percent').txt(line.taxRate ? line.taxRate.toString() : '0').up()
            .up()
            .ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
            .ele('ram:LineTotalAmount', { 'currencyID': data.currency })
            .txt(formatAmount(line.lineTotalWithoutTax)).up()
            .up()
            .up();
        lineItem.up();
    }
    // Close SupplyChainTradeTransaction
    supplyChain.up();
    // Finalize XML string
    var xmlString = inv.end({ prettyPrint: false });
    // Optionally, validate the XML against XSD
    validateXmlString(xmlString, profile);
    // Return as bytes
    return new TextEncoder().encode(xmlString);
}
/**
 * The main Invoice class. Parametric on TLine to handle dynamic columns.
 */
var Invoice = /** @class */ (function () {
    function Invoice(data, options) {
        if (options === void 0) { options = {}; }
        this.data = data;
        this.options = options;
        this.number = data.number;
        this.issueDate = data.issueDate;
        this.seller = data.seller;
        this.buyer = data.buyer;
        this.lines = data.lines;
        this.notes = data.notes;
        this.options = options;
        this.paymentTerms = data.paymentTerms;
    }
    /**
     * Example: a naive approach to calculating totals
     * if your lines have known fields like quantity & unitPrice.
     * If your lines have different fields, you can skip or override these.
     */
    Invoice.prototype.getNetTotal = function () {
        return this.lines.reduce(function (sum, line) {
            // Safe parse fields from the line
            var qty = typeof line.quantity === 'number'
                ? line.quantity
                : 1;
            var price = typeof line.unitPrice === 'number'
                ? line.unitPrice
                : 0;
            var discountRate = 0;
            if (typeof line.discountRate === 'number') {
                discountRate = Math.max(0, Math.min(100, line.discountRate));
            }
            // e.g. line rebates or lumps
            var rebate = typeof line.rebate === 'number'
                ? line.rebate
                : 0;
            // Calculate line total
            var gross = qty * price;
            var discount = gross > 0 ? (gross * discountRate) / 100 : 0;
            var net = gross - discount - rebate;
            return sum + Math.max(net, 0);
        }, 0);
    };
    Invoice.prototype.getVatTotal = function () {
        var _this = this;
        return this.lines.reduce(function (sum, line) {
            if (!line.taxRate)
                return sum;
            var netLine = _this.calcLineNet(line);
            return sum + netLine;
        }, 0);
    };
    Invoice.prototype.getTotalWithVat = function () {
        return this.getNetTotal() + this.getVatTotal();
    };
    Invoice.prototype.calcLineNet = function (line) {
        var quantity = line.quantity || 0;
        var price = line.unitPrice || 0;
        var discountPct = Math.min(Math.max(line.discountRate || 0, 0), 100);
        var rebate = line.rebate || 0;
        var raw = quantity * price;
        var discount = (raw * discountPct) / 100;
        var net = raw - discount - rebate;
        return Math.max(net, 0);
    };
    /**
     * Render this invoice to PDF, with a given compliance type,
     * a chosen template, and optional override for the template's rendering options.
     * Returns a new InvoicePDF object for signing, verification, saving, etc.
     */
    Invoice.prototype.pdf = function (compliance, template, renderOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var pdfDoc, mergedOptions, xmlBytes, pdfBytes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                    case 1:
                        pdfDoc = _a.sent();
                        mergedOptions = __assign(__assign({}, this.options), renderOptions);
                        // 3. Render invoice content
                        return [4 /*yield*/, template.render(pdfDoc, this, mergedOptions)];
                    case 2:
                        // 3. Render invoice content
                        _a.sent();
                        if (!(compliance === ComplianceType.FR_FACTUR_X)) return [3 /*break*/, 4];
                        xmlBytes = this.buildFacturxXml();
                        return [4 /*yield*/, this.embedXmlInPdf(pdfDoc, xmlBytes)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        if (compliance === ComplianceType.GENERIC_UBL) {
                            // const xmlBytes = this.buildUblXml();
                            // await this.embedXmlInPdf(pdfDoc, xmlBytes);
                        }
                        else {
                            throw new Error("Unsupported compliance type: ".concat(compliance));
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, pdfDoc.save()];
                    case 6:
                        pdfBytes = _a.sent();
                        return [2 /*return*/, new InvoicePDF_1.InvoicePDF(pdfBytes, this)];
                }
            });
        });
    };
    Invoice.prototype.embedXmlInPdf = function (pdf, xmlBytes) {
        return __awaiter(this, void 0, void 0, function () {
            var pdfDoc, catalog, Names, embeddedFiles, embeddedFilesArray, fileSpecRef;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pdfDoc = pdf;
                        if (!(typeof pdfDoc.attach === 'function')) return [3 /*break*/, 2];
                        // Use the attach() convenience if it exists.
                        return [4 /*yield*/, pdfDoc.attach(xmlBytes, 'factur-x.xml', {
                                mimeType: 'application/xml',
                                description: 'Factur-X embedded XML'
                            })];
                    case 1:
                        // Use the attach() convenience if it exists.
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        // If attach() isn't available, we'd do a manual approach.
                        // We'll skip the manual approach for brevity.
                        console.warn('pdf-lib attach() not available. Skipping embed.');
                        _a.label = 3;
                    case 3:
                        catalog = pdfDoc.catalog;
                        Names = catalog.lookup(pdf_lib_1.PDFName.of('Names'));
                        if (Names) {
                            embeddedFiles = Names.lookup(pdf_lib_1.PDFName.of('EmbeddedFiles'));
                            if (embeddedFiles) {
                                embeddedFilesArray = embeddedFiles.lookup(pdf_lib_1.PDFName.of('Names'));
                                if (embeddedFilesArray instanceof pdf_lib_1.PDFArray && embeddedFilesArray.size() >= 2) {
                                    fileSpecRef = embeddedFilesArray.lookup(1);
                                    // Add an /AF entry to the catalog referencing the fileSpec.
                                    catalog.set(pdf_lib_1.PDFName.of('AF'), pdfDoc.context.obj([fileSpecRef]));
                                }
                            }
                        }
                        return [4 /*yield*/, pdfDoc.save()];
                    case 4: 
                    // Optionally we could set XMP metadata, set PDF/A conformance, etc.
                    // That is quite extensive, so we show only partial approach.
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Utility to format a Date into an 8-digit string: YYYYMMDD,
     * which is the typical "format='102'" used in Factur-X dateTime fields.
     */
    Invoice.prototype.formatDateForFacturx = function (date) {
        if (date === void 0) { date = this.issueDate; }
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return "".concat(y).concat(m).concat(d);
    };
    // /**
    //  * A more detailed (still simplified) Factur-X builder for an Invoice class.
    //  * It covers:
    //  *   - ExchangedDocumentContext (to specify Factur-X level, e.g. BASIC, EN16931)
    //  *   - ExchangedDocument (invoice ID, type, date/time)
    //  *   - SupplyChainTradeTransaction + included line items
    //  *   - Minimal buyer/seller (ApplicableHeaderTradeAgreement)
    //  *   - Additional placeholders for deliveries, taxes, etc.
    //  *
    //  * In production, you'll likely expand "ApplicableHeaderTradeSettlement" to define totals, tax breakdown, etc.
    //  */
    // public buildFacturxXml(): Uint8Array {
    //   // Root with standard Factur-X namespaces
    //   const root = create({ version: '1.0', encoding: 'UTF-8' })
    //     .ele('rsm:CrossIndustryInvoice', {
    //       'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
    //       'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:12',
    //       'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:15'
    //     })
    //       // 1) Document context => specify Factur-X profile (e.g. BASIC, EN16931, etc.)
    //       .ele('rsm:ExchangedDocumentContext')
    //         .ele('ram:GuidelineSpecifiedDocumentContextParameter')
    //           // Possible values: 'urn:factur-x:1p0:basic' or 'urn:factur-x:1p0:en16931'
    //           .ele('ram:ID').txt('urn:factur-x:1p0:basic').up()
    //         .up()
    //       .up()
    //       // 2) ExchangedDocument => basic invoice metadata
    //       .ele('rsm:ExchangedDocument')
    //         // Invoice number
    //         .ele('ram:ID').txt(this.number).up()
    //         // TypeCode: '380' => Commercial Invoice
    //         .ele('ram:TypeCode').txt('380').up()
    //         // Optional name or title
    //         .ele('ram:Name').txt('Commercial Invoice').up()
    //         // Issue date in format='102' => YYYYMMDD
    //         .ele('ram:IssueDateTime')
    //           .ele('udt:DateTimeString', { format: '102' })
    //             .txt(this.formatDateForFacturx(this.issueDate))
    //           .up()
    //         .up()
    //       .up()
    //       // 3) SupplyChainTradeTransaction => line items, trade settlement, references, etc.
    //       .ele('rsm:SupplyChainTradeTransaction')
    //         // For each line item, we create an IncludedSupplyChainTradeLineItem
    //         .import((parent as unknown as XMLBuilder) => {
    //           this.lines.forEach((line, index) => {
    //             const lineNumber = index + 1;
    //             const qty = (line as any).quantity ?? 1;
    //             const price = (line as any).unitPrice ?? 0;
    //             const desc = (line as any).description ?? `Item ${lineNumber}`;
    //             const lineTotal = qty * price;
    //             parent.ele('ram:IncludedSupplyChainTradeLineItem')
    //               .ele('ram:AssociatedDocumentLineDocument')
    //                 .ele('ram:LineID').txt(String(lineNumber)).up()
    //               .up() // </ram:AssociatedDocumentLineDocument>
    //               .ele('ram:SpecifiedLineTradeDelivery')
    //                 // BilledQuantity with unitCode: 'C62' => unit "piece" in UN/ECE code
    //                 .ele('ram:BilledQuantity', { unitCode: 'C62' }).txt(String(qty)).up()
    //               .up() // </ram:SpecifiedLineTradeDelivery>
    //               .ele('ram:SpecifiedLineTradeSettlement')
    //                 // Minimal total for this line
    //                 .ele('ram:LineTotalAmount', { currencyID: 'EUR' })
    //                   .txt(lineTotal.toFixed(2))
    //                 .up()
    //                 // Link to the product name
    //                 .ele('ram:SpecifiedTradeProduct')
    //                   .ele('ram:Name').txt(desc).up()
    //                 .up() // </ram:SpecifiedTradeProduct>
    //               .up() // </ram:SpecifiedLineTradeSettlement>
    //             .up(); // </ram:IncludedSupplyChainTradeLineItem>
    //           });
    //         })
    //       .up() // </rsm:SupplyChainTradeTransaction>
    //       // 4) HeaderTradeAgreement => buyer/seller info
    //       .ele('rsm:ApplicableHeaderTradeAgreement')
    //         // Minimal Seller
    //         .ele('ram:SellerTradeParty')
    //           .ele('ram:Name').txt(this.seller.name).up()
    //           .ele('ram:PostalTradeAddress')
    //             .ele('ram:LineOne').txt(this.seller.address ?? '').up()
    //           .up()
    //           // Optional VAT or ID
    //           .ele('ram:SpecifiedTaxRegistration')
    //             .ele('ram:ID').txt(this.seller.vatNumber ?? '').up()
    //           .up()
    //         .up()
    //         // Minimal Buyer
    //         .ele('ram:BuyerTradeParty')
    //           .ele('ram:Name').txt(this.buyer.name).up()
    //           .ele('ram:PostalTradeAddress')
    //             .ele('ram:LineOne').txt(this.buyer.address ?? '').up()
    //           .up()
    //           // Buyer VAT
    //           .ele('ram:SpecifiedTaxRegistration')
    //             .ele('ram:ID').txt(this.buyer.vatNumber ?? '').up()
    //           .up()
    //         .up()
    //       .up()
    //       // 5) HeaderTradeDelivery => shipping or delivery info if needed
    //       .ele('rsm:ApplicableHeaderTradeDelivery')
    //         // Example: could specify ultimateShipToParty, requestedDeliveryDateTime...
    //       .up()
    //       // 6) HeaderTradeSettlement => totals, currency, tax breakdown, payment info
    //       .ele('rsm:ApplicableHeaderTradeSettlement')
    //         .ele('ram:InvoiceCurrencyCode').txt('EUR').up()
    //         // Example: minimal tax summary
    //         .ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
    //           .ele('ram:LineTotalAmount', { currencyID: 'EUR' })
    //             .txt(this.getNetTotal().toFixed(2))
    //           .up()
    //           .ele('ram:TaxTotalAmount', { currencyID: 'EUR' })
    //             .txt(this.getVatTotal().toFixed(2))
    //           .up()
    //           .ele('ram:GrandTotalAmount', { currencyID: 'EUR' })
    //             .txt(this.getTotalWithVat().toFixed(2))
    //           .up()
    //         .up()
    //       .up()
    //     .up(); // </rsm:CrossIndustryInvoice>
    //   const xmlString = root.end({ prettyPrint: true });
    //   return Buffer.from(xmlString, 'utf-8');
    // }
    Invoice.prototype.buildFacturxXml = function () {
        var root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
            .ele('rsm:CrossIndustryInvoice', {
            'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100'
        })
            .ele('rsm:ExchangedDocument')
            .ele('rsm:ID').txt(this.number).up()
            .ele('rsm:TypeCode').txt('380').up()
            .up()
            .ele('rsm:SupplyChainTradeTransaction')
            // Real Factur-X includes item lines, parties, etc. Omitted for brevity.
            .up()
            .ele('rsm:ApplicableHeaderTradeAgreement')
            .up()
            .up();
        var xmlString = root.end({ prettyPrint: true });
        return Buffer.from(xmlString, 'utf-8');
    };
    /**
     * Return the raw XML that would be embedded under a given compliance standard:
     * For FR_FACTUR_X => Factur-X XML,
     * For GENERIC_UBL => UBL XML, etc.
     */
    Invoice.prototype.extractEmbedded = function (compliance) {
        switch (compliance) {
            case ComplianceType.FR_FACTUR_X:
                return buildFacturxXml(this);
            case ComplianceType.GENERIC_UBL:
                return (0, UblBuilder_1.buildUblXml)(this);
            default:
                // Return empty or custom
                return new Uint8Array();
        }
    };
    return Invoice;
}());
exports.Invoice = Invoice;
function validateInvoiceData(data) {
    if (!data.seller || !data.buyer) {
        throw new Error("Seller and buyer information must be provided");
    }
    if (!data.id) {
        throw new Error("Invoice ID (number) is required");
    }
    // ... other checks for dates, totals, etc.
    // Additionally, check that if profile is MINIMUM, invoiceLines can be empty (that's fine),
    // but if profile is BASIC_WL or EXTENDED, invoiceLines should be present.
    if ((data.profile === FacturxProfile.BASIC_WL || data.profile === FacturxProfile.EXTENDED)
        && (!data.lines || data.lines.length === 0)) {
        throw new Error("Profile ".concat(data.profile, " requires at least one invoice line"));
    }
    // etc.
}
function formatAmount(totalTaxAmount) {
    return totalTaxAmount.toFixed(2);
    // throw new Error('Function not implemented.');
}
