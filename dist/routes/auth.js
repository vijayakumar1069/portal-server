import express from 'express';
import { signupValidation, loginValidation, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { getUserController, loginController, signupController } from '../controllers/auth.controller.js';
const authRoutes = express.Router();
authRoutes.post("/signup", signupValidation, handleValidationErrors, signupController // ✅ Fully typed handler
);
// Login
authRoutes.post('/signin', loginValidation, handleValidationErrors, loginController);
// Get current user
authRoutes.get('/me', authenticateToken, getUserController);
// Logout (client-side token removal)
authRoutes.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});
export default authRoutes;
