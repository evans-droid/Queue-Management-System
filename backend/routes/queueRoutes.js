/**
 * Queue Routes
 * Defines all API endpoints for the queue system
 */
const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// Customer registration
router.post('/register', queueController.registerCustomer);

// Get today's queue
router.get('/queue', queueController.getTodayQueue);

// Call next customer
router.post('/queue/next', queueController.callNextCustomer);

// Mark customer as served
router.post('/queue/:id/served', queueController.markAsServed);

module.exports = router;