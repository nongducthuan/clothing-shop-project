require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./src/db');

// Import các routes
const productsRoute = require('./src/routes/productRoute');
const authRoute = require('./src/routes/authRoute');
const ordersRoute = require('./src/routes/orderRoute');
const adminRoute = require('./src/routes/adminRoute');
const categoryRoute = require('./src/routes/categoryRoute');
const uploadRoute = require('./src/routes/uploadRoute');
const inventoryRoute = require('./src/routes/inventoryRoute');
const recommendationRoute = require("./src/routes/recommendationRoute");
const saleRoutes = require('./src/routes/saleRoute');
const voucherRoute = require('./src/routes/voucherRoute');
const chatRoute = require("./src/routes/chatRoute");
const promotionRoute = require('./src/routes/promotionRoute')
const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/products', productsRoute);
app.use('/auth', authRoute);
app.use('/orders', ordersRoute);
app.use('/admin', adminRoute);
app.use('/categories', categoryRoute);
app.use('/upload', uploadRoute);
app.use('/api/inventory', inventoryRoute);
app.use('/recommendations', recommendationRoute)
app.use('/api/chat', chatRoute);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/sales', saleRoutes);
app.use('/vouchers', voucherRoute);
app.use('/promotions', promotionRoute)
app.get('/banners', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM banners ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi' });
    }
});

app.get('/', (req, res) => res.send("Server đang hoạt động!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});
