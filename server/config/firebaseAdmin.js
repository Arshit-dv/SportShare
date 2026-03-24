const admin = require("firebase-admin");

/**
 * Initialize Firebase Admin SDK
 * This allows the backend to verify Firebase ID tokens securely.
 */
try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.error("❌ ERROR: FIREBASE_SERVICE_ACCOUNT_BASE64 is missing in .env");
  } else {
    // Decode the base64 string back into a JSON object
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("✅ Firebase Admin Initialized");
  }
} catch (error) {
  console.error("❌ Firebase Admin Initialization Error:", error.message);
}

module.exports = admin;
