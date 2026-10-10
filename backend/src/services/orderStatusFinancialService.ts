import type { OrderWithItems, TxClient } from '../types/orderTypes';

export type StatusTx = TxClient;
type FinancialOrder = Pick<OrderWithItems, 'total_price' | 'user_id' | 'delivered_at'>;

export async function updateOrderFinancials(
    tx: StatusTx,
    order: FinancialOrder,
    oldEnum: string,
    normalizedStatus: string,
    opts?: { skipFinancial?: boolean; partial?: { refundAmount: number } }
) {
    const totalPrice = Number(order.total_price);
    const userId = order.user_id;
    const REVENUE_COUNTED_STATUSES = new Set(['Delivered', 'Return_Requested']);
    let revenueChange = 0;
    let orderCountChange = 0;
    let deliveredAtUpdate: Date | null = null;

    if (opts?.skipFinancial) {
    } else if (opts?.partial && normalizedStatus === 'Return_Approved' && REVENUE_COUNTED_STATUSES.has(oldEnum)) {
        revenueChange = -Math.max(0, Number(opts.partial.refundAmount) || 0);
    } else if (oldEnum !== 'Delivered' && normalizedStatus === 'Delivered') {
        revenueChange = totalPrice;
        orderCountChange = 1;
        deliveredAtUpdate = new Date();
    } else if ((normalizedStatus === 'Return_Approved' || normalizedStatus === 'Cancelled') && REVENUE_COUNTED_STATUSES.has(oldEnum)) {
        revenueChange = -totalPrice;
        orderCountChange = -1;
    } else if (oldEnum === 'Delivered' && !REVENUE_COUNTED_STATUSES.has(normalizedStatus)) {
        revenueChange = -totalPrice;
        orderCountChange = -1;
    }

    if (revenueChange !== 0 && userId) {
        const currentUser = await tx.user.findUnique({ where: { id: userId } });
        if (currentUser) {
            const newTotalSpent = Math.max(0, Number(currentUser.total_spent) + revenueChange);
            await tx.user.update({ where: { id: userId }, data: { total_spent: newTotalSpent } });
            const tier = await tx.membership.findFirst({
                where: { min_spending: { lte: newTotalSpent }, is_active: true },
                orderBy: { min_spending: 'desc' },
            });
            await tx.user.update({ where: { id: userId }, data: { membership_id: tier?.id ?? null } });
        }
    }

    if (revenueChange !== 0 || orderCountChange !== 0) {
        let revenueDate: Date;
        if (normalizedStatus === 'Delivered') revenueDate = new Date();
        else if (order.delivered_at) revenueDate = new Date(order.delivered_at);
        else revenueDate = new Date();
        revenueDate.setHours(0, 0, 0, 0);
        const existingRevenue = await tx.revenue.findUnique({ where: { report_date: revenueDate } });
        if (existingRevenue) {
            await tx.revenue.update({
                where: { report_date: revenueDate },
                data: { total_sales: { increment: revenueChange }, total_orders: { increment: orderCountChange } },
            });
        } else {
            await tx.revenue.create({
                data: {
                    report_date: revenueDate,
                    total_sales: Math.max(0, revenueChange),
                    total_orders: Math.max(0, orderCountChange),
                },
            });
        }
    }

    return { revenueChange, orderCountChange, deliveredAtUpdate };
}
