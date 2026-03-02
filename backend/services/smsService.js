/**
 * SMS Service
 * Handles all SMS notifications using Twilio
 */
const twilio = require('twilio');
require('dotenv').config();

// Initialize Twilio client only if credentials are valid
let client = null;

const initTwilio = () => {
  if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    if (process.env.TWILIO_SID.startsWith('AC')) {
      try {
        client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio client initialized');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Twilio client:', error.message);
        client = null;
      }
    } else {
      console.warn('⚠️ TWILIO_SID must start with "AC". SMS functionality disabled.');
    }
  } else {
    console.warn('⚠️ Twilio credentials not configured. SMS functionality disabled.');
  }
};

// Initialize on module load
initTwilio();

/**
 * Send queue confirmation SMS
 */
const sendQueueConfirmationSMS = async (customer, queuePosition) => {
  if (!client) {
    console.log('ℹ️ SMS skipped (Twilio not configured): Confirmation for', customer.full_name);
    return true;
  }
  
  try {
    const message = await client.messages.create({
      body: `✅ Queue Registration Confirmation\n\nName: ${customer.full_name}\nQueue Number: ${customer.queue_number}\nPosition: ${queuePosition}\nStatus: Waiting\n\nYou'll be notified when it's your turn.`,
      from: process.env.TWILIO_PHONE,
      to: customer.phone
    });
    console.log('✅ Confirmation SMS sent:', message.sid);
    return true;
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return false;
  }
};

/**
 * Send turn notification SMS
 */
const sendTurnNotificationSMS = async (customer) => {
  if (!client) {
    console.log('ℹ️ SMS skipped (Twilio not configured): Turn notification for', customer.full_name);
    return true;
  }
  
  try {
    const message = await client.messages.create({
      body: `🔔 It's Your Turn!\n\nDear ${customer.full_name},\nQueue #${customer.queue_number}\nThe registrar is ready for you. Please proceed to the counter.`,
      from: process.env.TWILIO_PHONE,
      to: customer.phone
    });
    console.log('✅ Turn notification SMS sent:', message.sid);
    return true;
  } catch (error) {
    console.error('❌ Error sending turn notification:', error);
    return false;
  }
};

module.exports = {
  sendQueueConfirmationSMS,
  sendTurnNotificationSMS
};
