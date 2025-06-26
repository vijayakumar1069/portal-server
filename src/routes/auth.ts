import express from 'express';

import { 
  signupValidation, 
  loginValidation, 
  handleValidationErrors 
} from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

import {  loginController, logoutController, signupController } from '../controllers/auth.controller.js';


const authRoutes = express.Router();

authRoutes.post(
  "/signup",
  signupValidation,
  handleValidationErrors,
  signupController // ✅ Fully typed handler
);

// Login
authRoutes.post('/signin', loginValidation, handleValidationErrors, loginController);

authRoutes.post('/logout', authenticateToken, logoutController)

export default authRoutes;