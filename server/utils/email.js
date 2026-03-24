const nodemailer = require('nodemailer');

/**
 * Centered Email Sending Utility
 * Fixed for Deployment Issues (IPv6 ENETUNREACH errors)
 */
const sendEmail = async (options) => {
    // 1. Create a transporter using Port 587 (more reliable on cloud hosts than 465)
    // 2. Explicitly force IPv4 to avoid IPv6 issues (ENETUNREACH)
    const transporter = nodemailer.createTransport({
        // 🚨 "THE HACK": Using the literal IPv4 Address for smtp.gmail.com
        // This makes it PHYSICALLY IMPOSSIBLE to hit the ENETUNREACH IPv6 error.
        host: '142.251.2.108', 
        port: 465,
        secure: true, // Port 465 uses Implicit TLS
        pool: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            // When connecting via IP, we must manually tell Node to accept the gmail.com certificate
            servername: 'smtp.gmail.com', 
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        },
        // Faster timeouts for a better user experience
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    const mailOptions = {
        from: `SportShare <${process.env.EMAIL_USER || 'noreply@sportshare.com'}>`, // Standardize the sender display name
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${options.to} (MessageID: ${info.messageId})`);
        return info;
    } catch (error) {
        console.error('❌ Nodemailer Error (Centralized Utility):', error.message);
        throw error; // Rethrow to allow route-level error handling
    }
};

module.exports = sendEmail;
