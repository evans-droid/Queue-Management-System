/**
 * Email Service
 * Handles all email notifications using Nodemailer
 */
const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize transporter only if credentials are configured
let transporter = null;

const initEmail = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('✅ Email transporter initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize email transporter:', error.message);
      transporter = null;
    }
  } else {
    console.warn('⚠️ Email credentials not configured. Email functionality disabled.');
  }
};

// Initialize on module load
initEmail();

/**
 * Send queue confirmation email
 */
const sendQueueConfirmation = async (customer, queuePosition) => {
  if (!transporter) {
    console.log('ℹ️ Email skipped (not configured): Confirmation for', customer.email);
    return true;
  }
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: '✅ Your Queue Number - Registration Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Queue Registration Confirmation</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 18px; margin: 10px 0;"><strong>Name:</strong> ${customer.full_name}</p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Queue Number:</strong> <span style="background-color: #4f46e5; color: white; padding: 5px 15px; border-radius: 20px;">${customer.queue_number}</span></p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Position in Queue:</strong> ${queuePosition}</p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Status:</strong> Waiting</p>
          </div>
          <p style="color: #6b7280; text-align: center; font-size: 14px;">You will receive another notification when it's your turn.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

/**
 * Send turn notification email
 */
const sendTurnNotification = async (customer) => {
  if (!transporter) {
    console.log('ℹ️ Email skipped (not configured): Turn notification for', customer.email);
    return true;
  }
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: '🔔 It\'s Your Turn! - Registration Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">It's Your Turn! 🎉</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 18px; margin: 10px 0;"><strong>Dear ${customer.full_name},</strong></p>
            <p style="font-size: 16px; margin: 10px 0;">The registrar is ready for you.</p>
            <p style="font-size: 24px; text-align: center; margin: 20px 0;">
              <span style="background-color: #10b981; color: white; padding: 10px 25px; border-radius: 30px;">
                Queue #${customer.queue_number}
              </span>
            </p>
          </div>
          <p style="color: #6b7280; text-align: center; font-size: 14px;">Please proceed to the registration counter.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Turn notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending turn notification:', error);
    return false;
  }
};

module.exports = {
  sendQueueConfirmation,
  sendTurnNotification
};
