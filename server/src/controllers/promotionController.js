const promotionModel = require('../models/promotionModel');
const promotionService = require('../services/promotionService');

const promotionController = {
    calculateCart: async (req, res) => {
        try {
            const { cartItems } = req.body;

            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ success: false, message: 'Empty Cart' });
            }

            const result = await promotionService.calculateCartPromotions(cartItems);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in calculateCart controller:', error);
            return res.status(500).json({ success: false, message: 'Server error when calculating promotion.' });
        }
    },

    getAdminPromotions: async (req, res) => {
        try {
            const promotions = await promotionModel.getAllPromotions();
            return res.status(200).json(promotions);
        } catch (error) {
            console.error('Error fetching admin promotions:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    createPromotion: async (req, res) => {
        try {
            const data = req.body;
            // Ép kiểu boolean cho MySQL (nếu is_stackable là true/false -> 1/0)
            data.is_stackable = data.is_stackable ? 1 : 0;

            const newId = await promotionModel.createPromotion(data);
            return res.status(201).json({ success: true, message: 'Created successfully', id: newId });
        } catch (error) {
            console.error('Error creating promotion:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    deletePromotion: async (req, res) => {
        try {
            const { id } = req.params;
            await promotionModel.deletePromotion(id);
            return res.status(200).json({ success: true, message: 'Deleted successfully' });
        } catch (error) {
            console.error('Error deleting promotion:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getActivePromotions: async (req, res) => {
        try {
            const promotions = await promotionModel.getActiveBuyXGetYPromotions();
            return res.status(200).json({ success: true, data: promotions });
        } catch (error) {
            console.error('Error fetching active promotions:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updatePromotion: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            // Ép kiểu boolean cho MySQL
            data.is_stackable = data.is_stackable ? 1 : 0;

            await promotionModel.updatePromotion(id, data);
            return res.status(200).json({ success: true, message: 'Updated successfully' });
        } catch (error) {
            console.error('Error updating promotion:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

module.exports = promotionController;
