"use strict";
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
var vitest_1 = require("vitest");
var index_js_1 = require("../src/index.js");
(0, vitest_1.describe)('Stripe Provider', function () {
    (0, vitest_1.it)('exports connector manifest', function () {
        (0, vitest_1.expect)(index_js_1.connectorManifest.provider).toBe('stripe');
        (0, vitest_1.expect)(index_js_1.connectorManifest.id).toBe('stripe-connector');
    });
    (0, vitest_1.it)('testConnection returns ok with credentials', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = Object.fromEntries(["secretKey"].map(function (k) { return [k, 'test-value']; }));
                    return [4 /*yield*/, index_js_1.provider.testConnection({ settings: settings })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('authenticate stores credentials ref', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = Object.fromEntries(["secretKey"].map(function (k) { return [k, 'test-value']; }));
                    return [4 /*yield*/, index_js_1.provider.authenticate({ settings: settings })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)(result.credentialsRef).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('sync pull returns records', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = Object.fromEntries(["secretKey"].map(function (k) { return [k, 'test-value']; }));
                    return [4 /*yield*/, index_js_1.provider.sync.pull({ settings: settings }, 'payments')];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.count).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('webhook register returns registration', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings, reg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = Object.fromEntries(["secretKey"].map(function (k) { return [k, 'test-value']; }));
                    return [4 /*yield*/, index_js_1.provider.webhook.register({ settings: settings, webhookUrl: 'https://example.com/hook' }, ['connected'])];
                case 1:
                    reg = _a.sent();
                    (0, vitest_1.expect)(reg.webhookId).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('health check reports status', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings, health;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = Object.fromEntries(["secretKey"].map(function (k) { return [k, 'test-value']; }));
                    return [4 /*yield*/, index_js_1.provider.health.check({ settings: settings })];
                case 1:
                    health = _a.sent();
                    (0, vitest_1.expect)(['healthy', 'degraded', 'down']).toContain(health.status);
                    return [2 /*return*/];
            }
        });
    }); });
});
