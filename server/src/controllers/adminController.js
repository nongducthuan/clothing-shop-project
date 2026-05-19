const adminModel = require("../models/adminModel");
const orderModel = require('../models/orderModel');

// --- PRODUCTS ---
async function getProducts(req, res) {
  try {
    const products = await adminModel.getAllProducts();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching products" });
  }
}

async function addProduct(req, res) {
  try {
    const id = await adminModel.createProduct(req.body);
    res.status(201).json({ id, message: "Product added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error adding product" });
  }
}

async function editProduct(req, res) {
  try {
    const affected = await adminModel.updateProduct(req.params.id, req.body);
    res.json({ affected });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error editing product" });
  }
}

async function removeProduct(req, res) {
  try {
    const affected = await adminModel.deleteProduct(req.params.id);
    res.json({ affected });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting product" });
  }
}

async function getProductDetail(req, res) {
    try {
        const product = await adminModel.getProductById(req.params.id);
        if(!product) return res.status(404).json({message: "Not found"});
        res.json(product);
    } catch (err) {
        res.status(500).json({message: "Server error"});
    }
}

// --- COLORS & SIZES ---
async function addColor(req, res) {
    try {
        const id = await adminModel.createColor(req.params.productId, req.body);
        res.json({id});
    } catch(err) { res.status(500).json({message: "Server error"}); }
}

async function removeColor(req, res) {
    try {
        await adminModel.deleteColor(req.params.id);
        res.json({message: "Color deleted successfully"});
    } catch(err) { res.status(500).json({message: "Server error"}); }
}

async function addSize(req, res) {
  try {
    const id = await adminModel.addOrUpdateSize(req.params.colorId, req.body);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

async function removeSize(req, res) {
    try {
        await adminModel.deleteSize(req.params.id);
        res.json({message: "Size deleted successfully"});
    } catch(err) { res.status(500).json({message: "Server error"}); }
}

// --- ORDERS ---
async function getOrders(req, res) {
    try {
        // 1. Lấy dữ liệu thô từ Database
        const rawOrders = await adminModel.getAllOrders();

        // 2. Xử lý từng đơn hàng để parse JSON
        const processedOrders = rawOrders.map(order => {
            // Xử lý Bank Info
            let bankInfo = order.refund_bank_info;
            try {
                // Nếu là chuỗi thì parse, nếu là null/object thì giữ nguyên
                if (typeof bankInfo === 'string') {
                    bankInfo = JSON.parse(bankInfo);
                }
            } catch (e) {
                console.error("Lỗi parse bankInfo:", e);
                bankInfo = null;
            }

            // Xử lý Images (Ảnh trả hàng)
            let returnImages = order.return_images; // Hoặc tên cột bạn đặt trong câu SQL
            try {
                if (typeof returnImages === 'string') {
                    returnImages = JSON.parse(returnImages);
                }
            } catch (e) {
                returnImages = [];
            }

            // Trả về object đã được làm sạch
            return {
                ...order,
                refund_bank_info: bankInfo,
                return_images: returnImages
            };
        });

        // 3. Gửi dữ liệu đã xử lý về Frontend
        res.json(processedOrders);

    } catch(err) { 
        console.error(err);
        res.status(500).json({message: "Server error"}); 
    }
}

async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await orderModel.changeOrderStatus(id, status);
    res.json({ message: 'Order delivery status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function confirmPayment(req, res) {
    const { id } = req.params;
    const { payment_status } = req.body;

    try {
        const affected = await adminModel.updatePaymentStatus(id, payment_status);
        
        if (affected === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({ message: `Payment status updated to ${payment_status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating payment" });
    }
}

// --- BANNERS ---
async function getBanners(req, res) {
    try {
        const banners = await adminModel.getAllBanners();
        res.json(banners);
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function addBanner(req, res) {
    try {
        const id = await adminModel.createBanner(req.body);
        res.status(201).json({id, message: "Banner added successfully"});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function editBanner(req, res) {
    try {
        await adminModel.updateBanner(req.params.id, req.body);
        res.json({message: "Banner updated successfully"});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function removeBanner(req, res) {
    try {
        await adminModel.deleteBanner(req.params.id);
        res.json({message: "Banner deleted successfully"});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

// --- STATS ---
async function getStats(req, res) {
  try {
    const stats = await adminModel.getAdminStats();
    res.json({ ...stats });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Server error fetching statistics" });
  }
}

module.exports = {
    getProducts, addProduct, editProduct, removeProduct, getProductDetail,
    addColor, removeColor, addSize, removeSize,
    getOrders, 
    updateOrderStatus, 
    confirmPayment, 
    getBanners, addBanner, editBanner, removeBanner,
    getStats
};