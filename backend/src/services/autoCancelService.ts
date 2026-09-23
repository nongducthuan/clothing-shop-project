import prisma from '../../prisma/client';
import { changeOrderStatusLogic } from '../controllers/admin/orderController';
import { sendEmail } from '../utils/emailService';
import cron from 'node-cron';

// ─── AUTO-CANCEL EXPIRED UNPAID ORDERS ────────────────────────────────────────
// Đơn thanh toán online (MoMo/VNPay) nếu khách không hoàn tất/ thất bại sẽ nằm
// ở trạng thái Pending + Unpaid VĨNH VIỄN và vẫn đang GIỮ KHO (kho đã trừ lúc
// tạo đơn). Job này tự hủy các đơn đó sau một khoảng grace-time để nhả kho.
// COD không được tự hủy — shop chủ động xác nhận/hủy.

const CHECK_INTERVAL_MS = 5 * 60 * 1000;   // chạy quét mỗi 5 phút
export const UNPAID_ONLINE_TIMEOUT_MINUTES = 30;  // quá 30 phút chưa thanh toán → hủy
const BATCH_LIMIT = 50;                    // giới hạn số đơn mỗi lần quét

async function runAutoCancel(): Promise<void> {
    try {
        const cutoff = new Date(Date.now() - UNPAID_ONLINE_TIMEOUT_MINUTES * 60 * 1000);

        const expired = await prisma.order.findMany({
            where: {
                status: 'Pending',
                payment_status: 'Unpaid',
                payment_method: { in: ['momo', 'vnpay'] },
                created_at: { lt: cutoff },
            },
            select: { id: true, email: true, name: true },
            take: BATCH_LIMIT,
        });

        if (expired.length === 0) return;

        let cancelled = 0;
        for (const order of expired) {
            try {
                // Pending → Cancelled: tự hoàn kho trong transaction,
                // doanh thu không đổi (đơn chưa Delivered)
                await changeOrderStatusLogic(order.id, 'Cancelled');
                cancelled++;

                // Gửi email thông báo hủy đơn tự động
                if (order.email) {
                    sendEmail(
                        order.email,
                        `Đơn hàng #${order.id} đã bị hủy tự động`,
                        `Đơn hàng #${order.id} của bạn đã bị hủy do không hoàn tất thanh toán trong ${UNPAID_ONLINE_TIMEOUT_MINUTES} phút. Kho hàng đã được hoàn lại.`,
                    ).catch(e => console.error(`⏱️ Auto-cancel email error for order #${order.id}:`, e.message));
                }
            } catch (err: any) {
                console.error(`⏱️ Auto-cancel failed for order #${order.id}:`, err.message);
            }
        }

        console.log(
            `⏱️ Auto-cancel: ${cancelled}/${expired.length} unpaid online orders ` +
            `(older than ${UNPAID_ONLINE_TIMEOUT_MINUTES}m) cancelled — stock restored.`
        );
    } catch (err: any) {
        console.error('⏱️ Auto-cancel job error:', err.message);
    }
}

export function startAutoCancelJob(): void {
    // Chạy mỗi 5 phút
    cron.schedule('*/5 * * * *', runAutoCancel);
    console.log(
        `⏱️ Auto-cancel job started: unpaid MoMo/VNPay orders will be cancelled after ${UNPAID_ONLINE_TIMEOUT_MINUTES} minutes.`
    );
}
