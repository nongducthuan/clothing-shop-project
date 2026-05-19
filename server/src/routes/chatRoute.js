const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

/**
 * @route POST /api/chat/message
 * @description Endpoint to handle user chat messages and interact with the AI engine.
 * @access Public
 */
router.post('/message', chatController.handleChat);
router.post('/message-with-history', chatController.handleChatWithHistory)
router.post('/clear-history', chatController.clearChatHistory)
module.exports = router;
