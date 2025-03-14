"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middlewares/validation");
const validationHandler_1 = require("../middlewares/validationHandler");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post('/login', auth_1.authLimiter, validation_1.authValidation.login, validationHandler_1.handleValidation, authController_1.authController.login);
router.post('/register', auth_1.authLimiter, validation_1.authValidation.register, validationHandler_1.handleValidation, authController_1.authController.register);
exports.default = router;
