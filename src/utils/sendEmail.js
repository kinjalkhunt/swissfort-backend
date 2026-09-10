import nodemailer from 'nodemailer';

// CREATE TRANSPORTER FOR EMAIL SENDING
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// SEND PASSWORD RESET EMAIL
const sendPasswordResetEmail = async (email, resetToken, userName) => {

  try {

    const transporter = createTransporter();

    // FRONTEND BASE URL - CONFIGURE IN .ENV
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // RESET LINK
    const resetLink = `${frontendURL}/auth/reset-password?token=${resetToken}`;

    // EMAIL CONTENT
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'SwissFort - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 8px;
              }
              .header {
                background-color: #1e3a8a;
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background-color: white;
                padding: 20px;
                border-radius: 0 0 8px 8px;
              }
              .button {
                display: inline-block;
                background-color: #1e3a8a;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
              }
              .warning {
                color: #d32f2f;
                font-size: 12px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                
                <p>We received a request to reset your password for your SwissFort account. If you didn't make this request, you can ignore this email.</p>
                
                <p>To reset your password, click the button below:</p>
                
                <a href="${resetLink}" class="button">Reset Password</a>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                  ${resetLink}
                </p>
                
                <p class="warning">⚠️ This link will expire in 30 minutes for security reasons.</p>
                
                <p>If you have any questions, please contact the SwissFort administrator.</p>
                
                <p>Best regards,<br><strong>SwissFort Team</strong></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} SwissFort MFG. All rights reserved.</p>
                <p>This is an automated email. Please do not reply directly to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    // SEND EMAIL
    const result = await transporter.sendMail(mailOptions);

    console.log('[EmailService] Password reset email sent to:', email);
    console.log('[EmailService] Message ID:', result.messageId);

    return {
      success: true,
      message: 'Email sent successfully'
    };

  } catch (error) {

    console.error('[EmailService] Error sending email:', error.message);

    throw new Error('Failed to send email: ' + error.message);
  }
};

export default {
  sendPasswordResetEmail
};
