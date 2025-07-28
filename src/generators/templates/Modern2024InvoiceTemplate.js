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
exports.Modern2024InvoiceTemplate = void 0;
var pdf_lib_1 = require("pdf-lib");
var Modern2024InvoiceTemplate = /** @class */ (function () {
    function Modern2024InvoiceTemplate(baseOptions) {
        if (baseOptions === void 0) { baseOptions = {}; }
        this.baseOptions = baseOptions;
    }
    Modern2024InvoiceTemplate.prototype.render = function (pdfDoc, invoice, userOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, _a, pageWidth, pageHeight, page, margin, brandColor, textColor, secondaryBgColor, headerBandHeight, fontNormal, fontBold, headerTopY, scale, embeddedLogo, dims, yLogo, _b, headerTitle, titleSize, titleWidth, titleX, titleY, currentY, leftX, rightX, locale, dateString, invoiceNumber, sellerBlockY, sellerBoxHeight, buyerBlockY, buyerBoxHeight, columns, tableX, tableWidth, headerRowHeight, xPos, headerY, _i, columns_1, col, txtX, colTitleWidth, colTitleWidth, rowHeight, i, line, rowY, colX, _c, columns_2, col, cellVal, textWidth, drawX, totalsLabelX, label, val, labelWidth, label, val, labelWidth, label, val, labelWidth;
            var _d, _e;
            var _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22;
            return __generator(this, function (_23) {
                switch (_23.label) {
                    case 0:
                        options = __assign(__assign({}, this.baseOptions), userOptions);
                        _a = pdf_lib_1.PageSizes.A4, pageWidth = _a[0], pageHeight = _a[1];
                        if (options.pageSize === 'Letter') {
                            _d = pdf_lib_1.PageSizes.Letter, pageWidth = _d[0], pageHeight = _d[1];
                        }
                        else if (typeof options.pageSize === 'object') {
                            pageWidth = options.pageSize.width;
                            pageHeight = options.pageSize.height;
                        }
                        if (options.orientation === 'landscape') {
                            _e = [pageHeight, pageWidth], pageWidth = _e[0], pageHeight = _e[1];
                        }
                        page = pdfDoc.addPage([pageWidth, pageHeight]);
                        margin = (_f = options.margin) !== null && _f !== void 0 ? _f : 50;
                        brandColor = (_g = options.brandColor) !== null && _g !== void 0 ? _g : (0, pdf_lib_1.rgb)(0.2, 0.4, 0.7);
                        textColor = (_h = options.textColor) !== null && _h !== void 0 ? _h : (0, pdf_lib_1.rgb)(0, 0, 0);
                        secondaryBgColor = (0, pdf_lib_1.rgb)(0.9, 0.95, 1);
                        // 2) Background color
                        if (options.backgroundColor) {
                            page.drawRectangle({
                                x: 0, y: 0,
                                width: pageWidth, height: pageHeight,
                                color: options.backgroundColor
                            });
                        }
                        headerBandHeight = (_j = options.headerHeight) !== null && _j !== void 0 ? _j : 70;
                        page.drawRectangle({
                            x: 0,
                            y: pageHeight - headerBandHeight,
                            width: pageWidth,
                            height: headerBandHeight,
                            color: brandColor
                        });
                        return [4 /*yield*/, pdfDoc.embedFont((_k = options.fontFamilyNormal) !== null && _k !== void 0 ? _k : pdf_lib_1.StandardFonts.Helvetica)];
                    case 1:
                        fontNormal = _23.sent();
                        return [4 /*yield*/, pdfDoc.embedFont((_l = options.fontFamilyBold) !== null && _l !== void 0 ? _l : pdf_lib_1.StandardFonts.HelveticaBold)];
                    case 2:
                        fontBold = _23.sent();
                        headerTopY = pageHeight - 20;
                        if (!options.logo) return [3 /*break*/, 6];
                        _23.label = 3;
                    case 3:
                        _23.trys.push([3, 5, , 6]);
                        scale = (_m = options.logoScale) !== null && _m !== void 0 ? _m : 0.3;
                        return [4 /*yield*/, pdfDoc.embedPng(options.logo)];
                    case 4:
                        embeddedLogo = _23.sent();
                        dims = embeddedLogo.scale(scale);
                        yLogo = pageHeight - dims.height - 10;
                        page.drawImage(embeddedLogo, {
                            x: margin,
                            y: yLogo,
                            width: dims.width,
                            height: dims.height
                        });
                        headerTopY = yLogo - 10;
                        return [3 /*break*/, 6];
                    case 5:
                        _b = _23.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        // Title in header (top-right)
                        if (options.showHeader !== false) {
                            headerTitle = (_o = options.headerTitle) !== null && _o !== void 0 ? _o : 'INVOICE';
                            titleSize = (_p = options.fontSizeHeading) !== null && _p !== void 0 ? _p : 24;
                            titleWidth = fontBold.widthOfTextAtSize(headerTitle, titleSize);
                            titleX = pageWidth - margin - titleWidth;
                            titleY = pageHeight - headerBandHeight + (headerBandHeight - titleSize) / 2;
                            page.drawText(headerTitle, {
                                x: titleX,
                                y: titleY,
                                font: fontBold,
                                size: titleSize,
                                color: (_q = options.headerTextColor) !== null && _q !== void 0 ? _q : (0, pdf_lib_1.rgb)(1, 1, 1),
                            });
                        }
                        page.setFont(fontNormal);
                        page.setFontSize((_r = options.fontSizeBody) !== null && _r !== void 0 ? _r : 12);
                        currentY = pageHeight - headerBandHeight - 30;
                        leftX = margin;
                        rightX = pageWidth / 2 + margin / 2;
                        locale = (_s = options.locale) !== null && _s !== void 0 ? _s : 'en-US';
                        dateString = invoice.issueDate.toLocaleDateString(locale);
                        invoiceNumber = invoice.number ? "Invoice #".concat(invoice.number) : 'Invoice';
                        page.drawText(invoiceNumber, {
                            x: leftX,
                            y: currentY,
                            font: fontBold,
                            size: (_t = options.fontSizeBody) !== null && _t !== void 0 ? _t : 12,
                            color: textColor
                        });
                        currentY -= 15;
                        page.drawText("Date: ".concat(dateString), {
                            x: leftX,
                            y: currentY,
                            size: (_u = options.fontSizeBody) !== null && _u !== void 0 ? _u : 12,
                            color: textColor
                        });
                        sellerBlockY = currentY - 30;
                        sellerBoxHeight = 60;
                        // A subtle background rectangle behind Seller details
                        page.drawRectangle({
                            x: leftX - 5,
                            y: sellerBlockY - 5,
                            width: pageWidth / 2 - margin,
                            height: sellerBoxHeight,
                            color: secondaryBgColor
                        });
                        sellerBlockY -= 5; // padding inside
                        page.drawText((_v = options.sellerLabel) !== null && _v !== void 0 ? _v : 'Seller:', {
                            x: leftX,
                            y: sellerBlockY,
                            font: fontBold,
                            size: (_w = options.fontSizeBody) !== null && _w !== void 0 ? _w : 12,
                            color: textColor
                        });
                        sellerBlockY -= 15;
                        page.drawText("".concat(invoice.seller.name, "\n").concat(invoice.seller.address), {
                            x: leftX,
                            y: sellerBlockY,
                            lineHeight: 12,
                            font: fontNormal,
                            size: (_x = options.fontSizeBody) !== null && _x !== void 0 ? _x : 12,
                            color: textColor
                        });
                        buyerBlockY = currentY - 30;
                        buyerBoxHeight = 60;
                        page.drawRectangle({
                            x: rightX - 5,
                            y: buyerBlockY - 5,
                            width: pageWidth / 2 - margin,
                            height: buyerBoxHeight,
                            color: secondaryBgColor
                        });
                        buyerBlockY -= 5;
                        page.drawText((_y = options.buyerLabel) !== null && _y !== void 0 ? _y : 'Buyer:', {
                            x: rightX,
                            y: buyerBlockY,
                            font: fontBold,
                            size: (_z = options.fontSizeBody) !== null && _z !== void 0 ? _z : 12,
                            color: textColor
                        });
                        buyerBlockY -= 15;
                        page.drawText("".concat(invoice.buyer.name, "\n").concat(invoice.buyer.address), {
                            x: rightX,
                            y: buyerBlockY,
                            lineHeight: 12,
                            font: fontNormal,
                            size: (_0 = options.fontSizeBody) !== null && _0 !== void 0 ? _0 : 12,
                            color: textColor
                        });
                        // 10) Adjust currentY to below these blocks
                        currentY -= 100;
                        columns = (_1 = options.columns) !== null && _1 !== void 0 ? _1 : [];
                        if (columns.length > 0) {
                            tableX = margin;
                            tableWidth = columns.reduce(function (acc, c) { return acc + c.width; }, 0);
                            if (tableWidth > pageWidth - margin * 2) {
                                tableWidth = pageWidth - margin * 2;
                            }
                            headerRowHeight = 20;
                            page.drawRectangle({
                                x: tableX,
                                y: currentY,
                                width: tableWidth,
                                height: headerRowHeight,
                                color: brandColor
                            });
                            page.setFont(fontBold);
                            page.setFontSize((_2 = options.fontSizeBody) !== null && _2 !== void 0 ? _2 : 12);
                            xPos = tableX;
                            headerY = currentY + 5;
                            for (_i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
                                col = columns_1[_i];
                                txtX = xPos + 5;
                                if (col.align === 'right') {
                                    colTitleWidth = fontBold.widthOfTextAtSize(col.header, (_3 = options.fontSizeBody) !== null && _3 !== void 0 ? _3 : 12);
                                    txtX = xPos + col.width - colTitleWidth - 5;
                                }
                                else if (col.align === 'center') {
                                    colTitleWidth = fontBold.widthOfTextAtSize(col.header, (_4 = options.fontSizeBody) !== null && _4 !== void 0 ? _4 : 12);
                                    txtX = xPos + (col.width / 2) - (colTitleWidth / 2);
                                }
                                page.drawText(col.header, {
                                    x: txtX,
                                    y: headerY,
                                    color: (0, pdf_lib_1.rgb)(1, 1, 1) // header text in white
                                });
                                xPos += col.width;
                            }
                            currentY -= headerRowHeight;
                            // Table rows
                            page.setFont(fontNormal);
                            rowHeight = (_5 = options.rowSpacing) !== null && _5 !== void 0 ? _5 : 18;
                            for (i = 0; i < invoice.lines.length; i++) {
                                line = invoice.lines[i];
                                rowY = currentY - rowHeight * i;
                                // Alternate background color for row
                                if (i % 2 === 0) {
                                    page.drawRectangle({
                                        x: tableX,
                                        y: rowY,
                                        width: tableWidth,
                                        height: rowHeight,
                                        color: secondaryBgColor
                                    });
                                }
                                colX = tableX;
                                for (_c = 0, columns_2 = columns; _c < columns_2.length; _c++) {
                                    col = columns_2[_c];
                                    cellVal = String((_6 = line[col.id]) !== null && _6 !== void 0 ? _6 : '');
                                    textWidth = fontNormal.widthOfTextAtSize(cellVal, (_7 = options.fontSizeBody) !== null && _7 !== void 0 ? _7 : 12);
                                    drawX = colX + 5;
                                    if (col.align === 'right') {
                                        drawX = colX + col.width - textWidth - 5;
                                    }
                                    else if (col.align === 'center') {
                                        drawX = colX + (col.width / 2) - (textWidth / 2);
                                    }
                                    page.drawText(cellVal, {
                                        x: drawX,
                                        y: rowY + 4,
                                        color: textColor,
                                        size: (_8 = options.fontSizeBody) !== null && _8 !== void 0 ? _8 : 12,
                                    });
                                    colX += col.width;
                                }
                            }
                            currentY -= rowHeight * invoice.lines.length;
                        }
                        else {
                            // If no columns defined, fallback or skip table
                            page.drawText('No columns defined for items.', { x: margin, y: currentY });
                            currentY -= 20;
                        }
                        currentY -= 30;
                        // 12) Totals Section
                        page.setFont(fontBold);
                        totalsLabelX = pageWidth - margin - 100;
                        if (options.showSubtotal !== false) {
                            label = 'Subtotal: ';
                            val = invoice.getNetTotal().toFixed(2);
                            labelWidth = fontBold.widthOfTextAtSize(label, (_9 = options.fontSizeBody) !== null && _9 !== void 0 ? _9 : 12);
                            page.drawText(label, {
                                x: totalsLabelX,
                                y: currentY,
                                size: (_10 = options.fontSizeBody) !== null && _10 !== void 0 ? _10 : 12,
                                color: textColor
                            });
                            page.drawText(val, {
                                x: totalsLabelX + labelWidth,
                                y: currentY,
                                size: (_11 = options.fontSizeBody) !== null && _11 !== void 0 ? _11 : 12,
                                color: textColor
                            });
                            currentY -= 15;
                        }
                        if (options.showVat !== false) {
                            label = 'VAT: ';
                            val = invoice.getVatTotal().toFixed(2);
                            labelWidth = fontBold.widthOfTextAtSize(label, (_12 = options.fontSizeBody) !== null && _12 !== void 0 ? _12 : 12);
                            page.drawText(label, {
                                x: totalsLabelX,
                                y: currentY,
                                size: (_13 = options.fontSizeBody) !== null && _13 !== void 0 ? _13 : 12,
                                color: textColor
                            });
                            page.drawText(val, {
                                x: totalsLabelX + labelWidth,
                                y: currentY,
                                size: (_14 = options.fontSizeBody) !== null && _14 !== void 0 ? _14 : 12,
                                color: textColor
                            });
                            currentY -= 15;
                        }
                        if (options.showGrandTotal !== false) {
                            label = (_15 = options.totalsLabel) !== null && _15 !== void 0 ? _15 : 'Grand Total: ';
                            val = invoice.getTotalWithVat().toFixed(2);
                            labelWidth = fontBold.widthOfTextAtSize(label, (_16 = options.fontSizeBody) !== null && _16 !== void 0 ? _16 : 12);
                            page.drawText(label, {
                                x: totalsLabelX,
                                y: currentY,
                                size: (_17 = options.fontSizeBody) !== null && _17 !== void 0 ? _17 : 12,
                                color: textColor
                            });
                            page.drawText(val, {
                                x: totalsLabelX + labelWidth,
                                y: currentY,
                                size: (_18 = options.fontSizeBody) !== null && _18 !== void 0 ? _18 : 12,
                                color: textColor
                            });
                            currentY -= 25;
                        }
                        // 13) Notes
                        page.setFont(fontNormal);
                        if (invoice.notes) {
                            page.drawText('Notes:', {
                                x: leftX,
                                y: currentY,
                                font: fontBold,
                                size: (_19 = options.fontSizeBody) !== null && _19 !== void 0 ? _19 : 12,
                                color: textColor
                            });
                            currentY -= 15;
                            page.drawText(invoice.notes, {
                                x: leftX,
                                y: currentY,
                                lineHeight: 12,
                                color: textColor,
                                size: (_20 = options.fontSizeBody) !== null && _20 !== void 0 ? _20 : 12,
                                maxWidth: pageWidth - margin * 2
                            });
                            currentY -= 40;
                        }
                        // 14) Payment Terms
                        if (invoice.paymentTerms) {
                            page.drawText('Payment Terms:', {
                                x: leftX,
                                y: currentY,
                                font: fontBold,
                                size: (_21 = options.fontSizeBody) !== null && _21 !== void 0 ? _21 : 12,
                                color: textColor
                            });
                            currentY -= 15;
                            page.drawText(invoice.paymentTerms, {
                                x: leftX,
                                y: currentY,
                                size: (_22 = options.fontSizeBody) !== null && _22 !== void 0 ? _22 : 12,
                                color: textColor
                            });
                            currentY -= 30;
                        }
                        // 15) Footer
                        if (options.footerNote) {
                            page.drawText(options.footerNote, {
                                x: margin,
                                y: 30,
                                size: 10,
                                color: textColor
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return Modern2024InvoiceTemplate;
}());
exports.Modern2024InvoiceTemplate = Modern2024InvoiceTemplate;
