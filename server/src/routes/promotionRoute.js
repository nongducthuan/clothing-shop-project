const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');

router.post('/calculate-cart', promotionController.calculateCart);
router.get('/admin', promotionController.getAdminPromotions);
router.post('/admin', promotionController.createPromotion);
router.get('/active', promotionController.getActivePromotions);
router.delete('/admin/:id', promotionController.deletePromotion);
router.put('/admin/:id', promotionController.updatePromotion);

module.exports = router;
