import crypto from 'crypto';
export const verifyFreshdeskWebhook = (req, res, next) => {
    try {
        const signature = req.headers['x-freshdesk-signature'];
        const webhookSecret = process.env.FRESHDESK_WEBHOOK_SECRET;
        console.log("Webhooks middleware called");
        console.log("Received signature:", signature);
        console.log("Webhook secret exists:", !!webhookSecret);
        if (webhookSecret && signature) {
            // Work with raw body for signature verification
            const rawBody = req.body;
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            console.log("Expected signature:", expectedSignature);
            if (signature !== expectedSignature) {
                console.log("Signature mismatch!");
                res.status(401).json({
                    success: false,
                    message: 'Invalid webhook signature'
                });
                return; // Important: return void, don't return the response
            }
            // Parse the JSON after signature verification
            try {
                req.body = JSON.parse(rawBody.toString());
                console.log("Parsed JSON:", req.body);
            }
            catch (parseError) {
                console.error("JSON parse error:", parseError);
                res.status(400).json({
                    success: false,
                    message: 'Invalid JSON payload'
                });
                return; // Important: return void, don't return the response
            }
        }
        else {
            console.log("Skipping signature verification - missing secret or signature");
            // If no signature verification is needed, ensure body is parsed
            if (Buffer.isBuffer(req.body)) {
                try {
                    req.body = JSON.parse(req.body.toString());
                }
                catch (parseError) {
                    console.error("JSON parse error:", parseError);
                    res.status(400).json({
                        success: false,
                        message: 'Invalid JSON payload'
                    });
                    return; // Important: return void, don't return the response
                }
            }
        }
        console.log("Webhook verification successful");
        next();
    }
    catch (error) {
        console.error("Webhook verification error:", error);
        res.status(500).json({
            success: false,
            message: 'Webhook verification failed'
        });
        return; // Important: return void, don't return the response
    }
};
