import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';

import adminRoutes from './routes/admin';
import { globalErrorHandler } from './middleware/errorMiddleware';
import customerRoutes from './routes/customer';

import { startAutoCancelJob } from './services/autoCancelService';

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', adminRoutes);
app.use('/api', customerRoutes);

app.get('/', (req, res) => res.send("TS Server is running successfully!"));

// Global Error Handling Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});

// Tự động hủy đơn MoMo/VNPay quá hạn chưa thanh toán (nhả kho)
startAutoCancelJob();
