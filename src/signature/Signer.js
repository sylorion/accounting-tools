"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
// ==================================================
// File: services/accounting/src/signature/Signer.ts
// (Example digital signature; real PDF signing needs more advanced approach.)
// ==================================================
var crypto_1 = require("crypto");
var Signer = /** @class */ (function () {
    function Signer() {
    }
    Signer.sign = function (data, privateKey) {
        var sign = crypto_1.default.createSign('RSA-SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKey);
    };
    Signer.verify = function (data, signature, publicKey) {
        var verify = crypto_1.default.createVerify('RSA-SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKey, signature);
    };
    return Signer;
}());
exports.Signer = Signer;
