"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableLocaleCodes = exports.getLocaleByCode = exports.DEFAULT_LOCALES = exports.de = exports.fr = exports.en = void 0;
const en_1 = require("./en");
Object.defineProperty(exports, "en", { enumerable: true, get: function () { return en_1.en; } });
const fr_1 = require("./fr");
Object.defineProperty(exports, "fr", { enumerable: true, get: function () { return fr_1.fr; } });
const de_1 = require("./de");
Object.defineProperty(exports, "de", { enumerable: true, get: function () { return de_1.de; } });
exports.DEFAULT_LOCALES = Object.freeze([en_1.en, fr_1.fr, de_1.de]);
function getLocaleByCode(code) {
    return exports.DEFAULT_LOCALES.find(loc => loc.code === code);
}
exports.getLocaleByCode = getLocaleByCode;
function getAvailableLocaleCodes() {
    return exports.DEFAULT_LOCALES.map(loc => loc.code);
}
exports.getAvailableLocaleCodes = getAvailableLocaleCodes;
//# sourceMappingURL=index.js.map