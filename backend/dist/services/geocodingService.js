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
exports.geocodeAddress = void 0;
const axios_1 = __importStar(require("axios"));
const errorHandler_1 = require("../middlewares/errorHandler");
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const geocodeAddress = async (address, zipCode) => {
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const query = `${address} ${zipCode}`;
            const response = await axios_1.default.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: query,
                    format: 'json',
                    limit: 1
                },
                headers: {
                    'User-Agent': 'MutualAidApp/1.0'
                },
                timeout: 5000 // 5 second timeout
            });
            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                return {
                    lat: parseFloat(result.lat),
                    lon: parseFloat(result.lon)
                };
            }
            // If we got a response but no results, don't retry
            return null;
        }
        catch (error) {
            lastError = error;
            if (error instanceof axios_1.AxiosError) {
                // Don't retry for certain error types
                if (error.response?.status === 400) {
                    throw new errorHandler_1.AppError(400, 'Invalid address format');
                }
                if (error.response?.status === 429) {
                    // Rate limit hit - wait longer before retry
                    await sleep(RETRY_DELAY * attempt * 2);
                    continue;
                }
            }
            // Only retry on network errors or 5xx server errors
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY * attempt);
                continue;
            }
        }
    }
    // If we got here, all retries failed
    console.error('Geocoding error after all retries:', lastError);
    throw new errorHandler_1.AppError(503, 'Geocoding service is currently unavailable. Please try again later.');
};
exports.geocodeAddress = geocodeAddress;
