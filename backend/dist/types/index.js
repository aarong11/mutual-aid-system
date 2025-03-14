"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.SubmissionStatus = exports.ResourceType = void 0;
var ResourceType;
(function (ResourceType) {
    ResourceType["FOOD_BANK"] = "food_bank";
    ResourceType["CLOTHING"] = "clothing";
    ResourceType["SHELTER"] = "shelter";
    ResourceType["MEDICAL"] = "medical";
    ResourceType["OTHER"] = "other";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var SubmissionStatus;
(function (SubmissionStatus) {
    SubmissionStatus["PENDING"] = "pending";
    SubmissionStatus["VERIFIED"] = "verified";
    SubmissionStatus["REJECTED"] = "rejected";
})(SubmissionStatus || (exports.SubmissionStatus = SubmissionStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["CONTRIBUTOR"] = "contributor";
    UserRole["COORDINATOR"] = "coordinator";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
