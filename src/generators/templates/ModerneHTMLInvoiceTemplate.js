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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModernHTMLInvoiceTemplate = void 0;
/**
 * ModernHTMLInvoiceTemplate renders the invoice as an HTML string.
 * The design now uses a purple-orange color scheme with smooth gradients and soft shadows.
 */
var ModernHTMLInvoiceTemplate = /** @class */ (function () {
    function ModernHTMLInvoiceTemplate(baseOptions) {
        if (baseOptions === void 0) { baseOptions = {}; }
        this.baseOptions = baseOptions;
    }
    ModernHTMLInvoiceTemplate.prototype.render = function (pdfDoc, invoice, userOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, headerBgColor, accentColor, backgroundColor, columns, columnsHtml, rowsHtml, html, page;
            return __generator(this, function (_a) {
                options = __assign(__assign({}, this.baseOptions), userOptions);
                headerBgColor = "#5e35b1";
                accentColor = "#ff9800";
                backgroundColor = "#f3e5f5";
                columns = options.columns || [];
                columnsHtml = columns.map(function (col) { return "\n      <th style=\"\n          padding: 12px 8px; \n          border: 1px solid #ddd; \n          background-color: ".concat(headerBgColor, "; \n          color: #fff;\n          text-align: ").concat(col.align || 'left', ";\n        \">\n        ").concat(col.header, "\n      </th>"); }).join('');
                rowsHtml = invoice.lines.map(function (line, index) {
                    var rowBgColor = index % 2 === 0 ? "#ffffff" : "#fff3e0"; // white and very light orange
                    var rowCells = columns.map(function (col) {
                        var _a;
                        return "\n        <td style=\"\n            padding: 10px; \n            border: 1px solid #ddd; \n            text-align: ".concat(col.align || 'left', ";\n          \">\n          ").concat((_a = line[col.id]) !== null && _a !== void 0 ? _a : '', "\n        </td>");
                    }).join('');
                    return "<tr style=\"background-color: ".concat(rowBgColor, ";\">").concat(rowCells, "</tr>");
                }).join('');
                html = "\n<!DOCTYPE html>\n<html lang=\"".concat(invoice.data.language || 'en', "\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Invoice ").concat(invoice.number, "</title>\n  <style>\n    body {\n      font-family: 'Arial', sans-serif;\n      background-color: ").concat(backgroundColor, ";\n      margin: 0;\n      padding: 0;\n      color: #333;\n    }\n    header {\n      background: linear-gradient(90deg, ").concat(headerBgColor, ", ").concat(accentColor, ");\n      color: #fff;\n      padding: 20px;\n      text-align: center;\n      box-shadow: 0 4px 8px rgba(0,0,0,0.1);\n    }\n    .invoice-info {\n      display: flex;\n      justify-content: space-between;\n      padding: 20px;\n      gap: 4%;\n    }\n    .invoice-info .block {\n      width: 48%;\n      background-color: #fff;\n      padding: 15px;\n      border-radius: 8px;\n      box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    }\n    .invoice-details, .totals, .notes {\n      padding: 20px;\n    }\n    table {\n      width: 100%;\n      border-collapse: collapse;\n      margin: 20px 0;\n    }\n    th, td {\n      border: 1px solid #ddd;\n      padding: 12px;\n      text-align: left;\n    }\n    tr:nth-child(even) {\n      background-color: #fff3e0;\n    }\n    .totals {\n      text-align: right;\n      font-size: 1.1em;\n      font-weight: bold;\n    }\n    .notes {\n      font-size: 0.9em;\n      background-color: #fff;\n      padding: 15px;\n      border-radius: 8px;\n      box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>").concat(options.headerTitle || 'Invoice', "</h1>\n  </header>\n  <section class=\"invoice-info\">\n    <div class=\"block\">\n      <h2>Seller</h2>\n      <p>").concat(invoice.seller.name, "<br>").concat(invoice.seller.address, "</p>\n    </div>\n    <div class=\"block\">\n      <h2>Buyer</h2>\n      <p>").concat(invoice.buyer.name, "<br>").concat(invoice.buyer.address, "</p>\n    </div>\n  </section>\n  <section class=\"invoice-details\">\n    <p><strong>Invoice #:</strong> ").concat(invoice.number, "</p>\n    <p><strong>Date:</strong> ").concat(invoice.issueDate.toLocaleDateString(), "</p>\n  </section>\n  <section class=\"invoice-items\">\n    <table>\n      <thead>\n        <tr>\n          ").concat(columnsHtml, "\n        </tr>\n      </thead>\n      <tbody>\n        ").concat(rowsHtml, "\n      </tbody>\n    </table>\n  </section>\n  <section class=\"totals\">\n    <p>Subtotal: ").concat(invoice.getNetTotal().toFixed(2), "</p>\n    <p>VAT: ").concat(invoice.getVatTotal().toFixed(2), "</p>\n    <p>Grand Total: ").concat(invoice.getTotalWithVat().toFixed(2), "</p>\n  </section>\n  ").concat(invoice.notes ? "\n  <section class=\"notes\">\n    <h2>Notes</h2>\n    <p>".concat(invoice.notes, "</p>\n  </section>") : '', "\n</body>\n</html>\n    ");
                page = pdfDoc.addPage();
                return [2 /*return*/, page.drawText(html, {
                        x: 50,
                        y: 50,
                        size: 12
                    })];
            });
        });
    };
    return ModernHTMLInvoiceTemplate;
}());
exports.ModernHTMLInvoiceTemplate = ModernHTMLInvoiceTemplate;
