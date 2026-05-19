const membership = require('../models/membershipModel');

exports.getMemberships = async (req, res) => {
    try {
        const data = await membership.getAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách hạng hội viên" });
    }
};

exports.addMembership = async (req, res) => {
    try {
        await Membership.create(req.body);
        res.status(201).json({ message: "Đã thêm hạng hội viên mới thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateMembership = async (req, res) => {
    try {
        const { id } = req.params;
        await Membership.update(id, req.body);
        res.json({ message: "Cập nhật hạng hội viên thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};