import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import cron, { ScheduledTask } from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';
import { changeOrderStatusLogic } from './orderStatusService';
import { sendEmail } from '../utils/emailService';
import { getErrorMessage } from '../utils/errorMessage';

// Unpaid online orders hold inventory after creation; release the reservation after a grace period.
export const UNPAID_ONLINE_TIMEOUT_MINUTES = 30;
const BATCH_LIMIT = 50;

@Injectable()
export class AutoCancelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoCancelService.name);
  private scheduledTask?: ScheduledTask;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (process.env.DISABLE_AUTO_CANCEL_JOB === 'true') return;
    this.scheduledTask = cron.schedule('*/5 * * * *', () => void this.runAutoCancel());
    this.logger.log(`Auto-cancel job started: unpaid MoMo/VNPay orders will be cancelled after ${UNPAID_ONLINE_TIMEOUT_MINUTES} minutes.`);
  }

  onModuleDestroy(): void {
    this.scheduledTask?.stop();
  }

  private async runAutoCancel(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - UNPAID_ONLINE_TIMEOUT_MINUTES * 60 * 1000);
      const expired = await this.prisma.order.findMany({
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
          await changeOrderStatusLogic(order.id, 'Cancelled', this.prisma, {
            expectedStatuses: ['Pending'],
            expectedPaymentStatus: 'Unpaid',
          });
          cancelled += 1;
          if (order.email) {
            sendEmail(
              order.email,
              `Đơn hàng #${order.id} đã bị hủy tự động`,
              `Đơn hàng #${order.id} của bạn đã bị hủy do không hoàn tất thanh toán trong ${UNPAID_ONLINE_TIMEOUT_MINUTES} phút. Kho hàng đã được hoàn lại.`,
            ).catch((error) => console.error(`⏱️ Auto-cancel email error for order #${order.id}:`, error instanceof Error ? error.message : String(error)));
          }
        } catch (error) {
          console.error(`⏱️ Auto-cancel failed for order #${order.id}:`, getErrorMessage(error));
        }
      }
      this.logger.log(`Cancelled ${cancelled}/${expired.length} unpaid online orders (older than ${UNPAID_ONLINE_TIMEOUT_MINUTES}m) cancelled — stock restored.`);
    } catch (error) {
      console.error('⏱️ Auto-cancel job error:', getErrorMessage(error));
    }
  }
}
