const admin = require('../config/firebaseAdmin');

module.exports = async function (req, res, next) {
    // Get token from header (using common header name 'x-auth-token')
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify Firebase ID Token
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Match user by firebase uid in your MongoDB (or use the uid directly)
        // We'll set req.user.id to the firebase uid or find the MongoDB ID
        // For simplicity during transition:
        req.user = { 
            id: decodedToken.uid,
            email: decodedToken.email 
        };
        
        next();
    } catch (err) {
        console.error('Firebase Auth Error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
