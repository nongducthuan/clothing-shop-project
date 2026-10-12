import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';

import adminRoutes from './routes/admin';
import customerRoutes from './routes/customer';
import notificationRoutes from './routes/notificationRoutes';
import { globalErrorHandler } from './middleware/errorMiddleware';
import { initSocket } from './utils/socket';
import { startAutoCancelJob } from './services/autoCancelService';
import { checkCriticalEnv } from './utils/envCheck';

// Cảnh báo NGAY khi khởi động nếu thiếu env bắt buộc (thiếu env chỉ làm vài API 500
// chứ không làm server chết → rất dễ chẩn đoán sai). Mặc định KHÔNG chặn khởi động;
// muốn chặn deploy hẳn thì đặt STRICT_ENV_CHECK=true trên host.
checkCriticalEnv();

const app = express();

// Backend chạy sau reverse proxy (Render): thiếu dòng này thì express-rate-limit thấy
// X-Forwarded-For nhưng không xác định được IP thật -> lỗi ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

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

app.use('/public', express.static(path.resolve(process.cwd(), 'src/public')));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use('/api/admin', adminRoutes);
app.use('/api', customerRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.send("TS Server is running successfully!"));

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Initialize Socket.io — must attach to httpServer, not app directly
initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});

// Tự động hủy đơn MoMo/VNPay quá hạn chưa thanh toán (nhả kho)
startAutoCancelJob();
