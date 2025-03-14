"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isString = isString;
exports.isNumber = isNumber;
exports.isBoolean = isBoolean;
exports.isObject = isObject;
exports.isResourceType = isResourceType;
exports.isSubmissionStatus = isSubmissionStatus;
exports.isUserRole = isUserRole;
exports.isValidZipCode = isValidZipCode;
exports.isValidEmail = isValidEmail;
exports.isValidLatitude = isValidLatitude;
exports.isValidLongitude = isValidLongitude;
exports.assertNonNullable = assertNonNullable;
const types_1 = require("../types");
function isString(value) {
    return typeof value === 'string';
}
function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}
function isBoolean(value) {
    return typeof value === 'boolean';
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isResourceType(value) {
    return typeof value === 'string' && Object.values(types_1.ResourceType).includes(value);
}
function isSubmissionStatus(value) {
    return typeof value === 'string' && Object.values(types_1.SubmissionStatus).includes(value);
}
function isUserRole(value) {
    return typeof value === 'string' && Object.values(types_1.UserRole).includes(value);
}
function isValidZipCode(value) {
    if (!isString(value))
        return false;
    return /^\d{5}(-\d{4})?$/.test(value);
}
function isValidEmail(value) {
    if (!isString(value))
        return false;
    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(value);
}
function isValidLatitude(value) {
    if (!isNumber(value))
        return false;
    return value >= -90 && value <= 90;
}
function isValidLongitude(value) {
    if (!isNumber(value))
        return false;
    return value >= -180 && value <= 180;
}
function assertNonNullable(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message);
    }
}
