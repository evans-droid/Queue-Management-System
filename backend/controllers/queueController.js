/**
 * Queue Controller
 * Handles all queue-related business logic
 */
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const { sendQueueConfirmation, sendTurnNotification } = require('../services/emailService');
const { sendQueueConfirmationSMS, sendTurnNotificationSMS } = require('../services/smsService');
const { Op } = require('sequelize');

/**
 * Generate next queue number for today
 */
const getNextQueueNumber = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCustomerToday = await Customer.findOne({
    where: {
      created_at: {
        [Op.gte]: today
      }
    },
    order: [['queue_number', 'DESC']]
  });

  return lastCustomerToday ? lastCustomerToday.queue_number + 1 : 1;
};

/**
 * Get queue position for a customer
 */
const getQueuePosition = async (customerId, queueNumber) => {
  const position = await Customer.count({
    where: {
      status: 'waiting',
      queue_number: {
        [Op.lt]: queueNumber
      },
      created_at: {
        [Op.gte]: new Date().setHours(0, 0, 0, 0)
      }
    }
  });

  return position + 1;
};

/**
 * Register a new customer
 */
const registerCustomer = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, phone } = req.body;

    // Check for duplicate phone number today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCustomer = await Customer.findOne({
      where: {
        phone,
        created_at: {
          [Op.gte]: today
        }
      }
    });

    if (existingCustomer) {
      return res.status(400).json({
        error: 'This phone number has already been registered today'
      });
    }

    // Get next queue number
    const queueNumber = await getNextQueueNumber();

    // Create customer
    const customer = await Customer.create({
      full_name,
      email,
      phone,
      queue_number: queueNumber,
      status: 'waiting'
    });

    // Get queue position
    const position = await getQueuePosition(customer.id, queueNumber);

    // Send notifications
    await Promise.allSettled([
      sendQueueConfirmation(customer, position),
      sendQueueConfirmationSMS(customer, position)
    ]);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.emit('queueUpdated', await getTodayQueue());

    res.status(201).json({
      message: 'Registration successful',
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        queue_number: customer.queue_number,
        position,
        status: customer.status
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get today's queue
 */
const getTodayQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const customers = await Customer.findAll({
      where: {
        created_at: {
          [Op.gte]: today
        }
      },
      order: [['queue_number', 'ASC']],
      attributes: ['id', 'full_name', 'email', 'phone', 'queue_number', 'status', 'created_at']
    });

    // Add position for each customer
    const queueWithPositions = await Promise.all(
      customers.map(async (customer) => {
        const position = await getQueuePosition(customer.id, customer.queue_number);
        return {
          ...customer.toJSON(),
          position: customer.status === 'waiting' ? position : null
        };
      })
    );

    if (res) {
      res.json(queueWithPositions);
    }
    return queueWithPositions;
  } catch (error) {
    console.error('❌ Error fetching queue:', error);
    if (res) {
      res.status(500).json({ error: 'Internal server error' });
    }
    return [];
  }
};

/**
 * Call next customer
 */
const callNextCustomer = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find next waiting customer
    const nextCustomer = await Customer.findOne({
      where: {
        status: 'waiting',
        created_at: {
          [Op.gte]: today
        }
      },
      order: [['queue_number', 'ASC']]
    });

    if (!nextCustomer) {
      return res.status(404).json({ error: 'No customers in queue' });
    }

    // Update status to notified
    await nextCustomer.update({ status: 'notified' });

    // Send turn notifications
    await Promise.allSettled([
      sendTurnNotification(nextCustomer),
      sendTurnNotificationSMS(nextCustomer)
    ]);

    // Get updated queue
    const updatedQueue = await getTodayQueue();

    // Emit socket events
    const io = req.app.get('io');
    io.emit('queueUpdated', updatedQueue);
    io.emit('customerCalled', {
      id: nextCustomer.id,
      full_name: nextCustomer.full_name,
      queue_number: nextCustomer.queue_number
    });

    res.json({
      message: 'Customer notified',
      customer: {
        id: nextCustomer.id,
        full_name: nextCustomer.full_name,
        queue_number: nextCustomer.queue_number,
        status: nextCustomer.status
      }
    });
  } catch (error) {
    console.error('❌ Error calling next customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark customer as served
 */
const markAsServed = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.update({ status: 'served' });

    // Get updated queue
    const updatedQueue = await getTodayQueue();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('queueUpdated', updatedQueue);

    res.json({
      message: 'Customer marked as served',
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        status: customer.status
      }
    });
  } catch (error) {
    console.error('❌ Error marking as served:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerCustomer: [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    registerCustomer
  ],
  getTodayQueue,
  callNextCustomer,
  markAsServed
};