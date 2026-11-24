import type { OrderItem } from '../generated/prisma/client';
import type { TxClient } from '../types/orderTypes';

export type StatusTx = TxClient;
type InventoryOrder = { items: Pick<OrderItem, 'size_id' | 'quantity'>[] };

export async function updateOrderInventory(
    tx: StatusTx,
    order: InventoryOrder,
    oldStatus: string,
    normalizedStatus: string,
    opts?: { skipStock?: boolean; partial?: { returnItems: { size_id: number | null; return_quantity: number }[] } }
) {
    const inactiveSet = new Set(['Cancelled', 'Return_Approved']);
    const oldIsInactive = inactiveSet.has(oldStatus);
    const newIsInactive = inactiveSet.has(normalizedStatus);
    if (oldIsInactive === newIsInactive || opts?.skipStock) return;

    if (opts?.partial && !oldIsInactive && newIsInactive) {
        for (const retItem of opts.partial.returnItems) {
            if (!retItem.size_id) continue;
            await tx.productSize.update({
                where: { id: retItem.size_id },
                data: { stock: { increment: retItem.return_quantity } },
            });
        }
        return;
    }

    for (const item of order.items) {
        if (!item.size_id) continue;
        if (!oldIsInactive && newIsInactive) {
            await tx.productSize.update({ where: { id: item.size_id }, data: { stock: { increment: item.quantity } } });
        } else if (oldIsInactive && !newIsInactive) {
            const result = await tx.productSize.updateMany({
                where: { id: item.size_id, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
            });
            if (result.count !== 1) {
                throw new Error(`Insufficient stock for product (size_id=${item.size_id})`);
            }
        }
    }
}
