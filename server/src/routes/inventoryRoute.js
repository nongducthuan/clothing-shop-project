// PURPOSE: Define secured routes for inventory management (admin only)

const express = require('express');
const router = express.Router();

const { getInventory } = require('../controllers/inventoryController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, requireAdmin, getInventory);

module.exports = router;
