import { body, validationResult } from 'express-validator';
// Validation rules
export const signupValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];
export const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];
export const integrationValidation = [
    body('freshdeskDomain')
        .optional()
        .isURL({ require_protocol: false })
        .withMessage('Please provide a valid Freshdesk domain'),
    body('freshdeskApiKey')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Please provide a valid Freshdesk API key'),
    body('hubspotAccessToken')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Please provide a valid HubSpot access token'),
];
// Middleware to handle validation results
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg
            }))
        });
        return;
    }
    next();
};
