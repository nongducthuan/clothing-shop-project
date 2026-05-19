const VoucherModel = require("../models/voucherModel");
const pool = require("../db");

async function createVoucherAdmin(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { productIds, categoryIds, applicable_category_id, ...voucherData } = req.body;
    const voucherId = await VoucherModel.createVoucher(voucherData, connection);
    if (voucherData.apply_scope === 'category' && categoryIds?.length > 0) {
      await VoucherModel.addCategoriesToVoucher(voucherId, categoryIds, connection);
    }
    else if (voucherData.apply_scope === 'product' && productIds?.length > 0) {
      await VoucherModel.addProductsToVoucher(voucherId, productIds, connection);
    }
    await connection.commit();
    res.status(201).json({ success: true, message: "Voucher Created Successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("LỖI BACKEND:", error.message);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo Voucher" });
  } finally {
    connection.release();
  }
}

async function getAllVouchersAdmin(req, res) {
  try {
    const vouchers = await VoucherModel.getAllVouchersAdmin();
    res.json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function toggleVoucherStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await VoucherModel.updateVoucherStatus(id, status);
    res.json({ success: true, message: "Cập nhật trạng thái mã giảm giá thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function removeVoucher(req, res) {
  try {
    const { id } = req.params;
    const affectedRows = await VoucherModel.updateVoucherStatus(id, 0);
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found or already deleted!"
      });
    }
    res.json({
      success: true,
      message: "Voucher deleted successfully! The code has been released for reuse."
    });
  } catch (error) {
    console.error("Remove Voucher Error:", error);
    res.status(500).json({
      success: false,
      message: "System error while deleting voucher."
    });
  }
}

async function applyVoucherClient(req, res) {
  try {
    const { code, orderTotal, cartItems } = req.body;
    
    // 1. Lấy thông tin voucher
    const voucher = await VoucherModel.getVoucherDetailsByCode(code);
    if (!voucher) return res.status(404).json({ success: false, message: "Mã giảm giá không tồn tại hoặc đã hết hạn!" });
    
    // 2. Chuyển đổi allowedIds sang Number cho an toàn tuyệt đối
    const allowedIds = (voucher.allowed_ids || []).map(id => Number(id));
    
    let eligibleTotal = 0;
    
    // 3. Tính toán tổng tiền hợp lệ
    if (voucher.apply_scope === 'all') {
      eligibleTotal = Number(orderTotal);
    } 
    else if (voucher.apply_scope === 'product') {
      const eligibleItems = cartItems.filter(item => {
        // Kiểm tra xem item có id không
        return item.id && allowedIds.includes(Number(item.id));
      });
      eligibleTotal = eligibleItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    } 
    else if (voucher.apply_scope === 'category') {
      const eligibleItems = cartItems.filter(item => {
        // Kiểm tra xem item CÓ category_id KHÔNG
        if (!item.category_id) {
          console.warn("CẢNH BÁO: Sản phẩm trong giỏ hàng thiếu category_id", item.name);
          return false; 
        }
        return allowedIds.includes(Number(item.category_id));
      });
      eligibleTotal = eligibleItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    }
    
    // 4. Kiểm tra xem có sản phẩm nào được áp dụng không
    if (eligibleTotal === 0) {
      return res.status(400).json({ success: false, message: "Mã giảm giá này không áp dụng cho các sản phẩm trong giỏ hàng của bạn!" });
    }
    
    // 5. Kiểm tra giá trị tối thiểu
    if (Number(orderTotal) < Number(voucher.min_order_value)) {
      return res.status(400).json({ success: false, message: `Đơn hàng chưa đạt mức tối thiểu ${Number(voucher.min_order_value).toLocaleString()}đ` });
    }
    
    // 6. Tính tiền giảm
    let discountAmount = (eligibleTotal * Number(voucher.discount_percent)) / 100;
    
    // Nếu có mức giảm tối đa và tiền giảm vượt quá mức đó
    if (voucher.max_discount_amount && discountAmount > Number(voucher.max_discount_amount)) {
      discountAmount = Number(voucher.max_discount_amount);
    }
    
    // 7. Trả về kết quả
    res.json({
      success: true,
      message: "Áp dụng mã thành công!",
      data: {
        ...voucher, // Cần trả lại nguyên object voucher để Frontend hiện % giảm, code,...
        discount_amount: discountAmount,
        final_total: Number(orderTotal) - discountAmount,
        applied_to_total: eligibleTotal
      }
    });
  } catch (error) {
    console.error("Lỗi áp dụng Voucher:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi áp dụng mã giảm giá" });
  }
}

async function getVoucherDetails(req, res) {
  try {
    const { id } = req.params; // Đảm bảo lấy ID từ URL
    if (!id) throw new Error("Missing ID");

    // Gọi hàm Admin mới tạo ở trên
    const data = await VoucherModel.getVoucherDetailsAdmin(id);

    if (!data) {
      return res.status(404).json({ success: false, message: "Không tìm thấy" });
    }

    res.json({
      success: true,
      details: data.details // Trả về mảng [{name: '...'}, ...] cho Modal
    });
  } catch (error) {
    console.error("Lỗi Controller:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

const getActiveVouchers = async (req, res) => {
  try {
    const { category_id, product_id } = req.query;

    // Truyền vào 1 Object duy nhất để Model nhận diện đúng
    const vouchers = await VoucherModel.findActiveVouchers({
      category_id,
      product_id
    });

    res.json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    console.error("Voucher API Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createVoucherAdmin,
  getAllVouchersAdmin,
  toggleVoucherStatus,
  removeVoucher,
  applyVoucherClient,
  getVoucherDetails,
  getActiveVouchers
};