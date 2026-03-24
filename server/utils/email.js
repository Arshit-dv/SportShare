const nodemailer = require('nodemailer');

/**
 * Centered Email Sending Utility
 * Fixed for Deployment Issues (IPv6 ENETUNREACH errors)
 */
const sendEmail = async (options) => {
    // 1. Create a transporter using Port 587 (more reliable on cloud hosts than 465)
    // 2. Explicitly force IPv4 to avoid IPv6 issues (ENETUNREACH)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // For Port 587, secure must be FALSE as it uses STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            // Ensuring the connection is secure and allowing connections even if there are subtle IPv6/v4 mismatch issues
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        },
        // IMPORTANT: Explictly force IPv4 connection
        family: 4, 
        connectionTimeout: 15000, // 15 seconds
        greetingTimeout: 15000,
        socketTimeout: 15000
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
