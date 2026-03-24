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
        port: 465,
        secure: true, // Port 465 uses Implicit TLS (secure: true)
        pool: true,   // Use connection pooling for better performance on slow networks
        // CRITICAL FOR RENDER: Force IPv4 at the DNS level
        lookup: (hostname, options, callback) => {
            require('dns').lookup(hostname, { family: 4 }, (err, address, family) => {
                callback(err, address, family);
            });
        },
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            // Ensuring the connection is secure and using standard protocols
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        },
        // Very generous timeouts for Render's network stability
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 60000,
        socketTimeout: 60000
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
