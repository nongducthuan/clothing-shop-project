import type { PrismaClient } from '../generated/prisma/client';
import { getErrorMessage } from '../utils/errorMessage';

export async function recordInteraction(userId: number, productId: number, type: 'view' | 'add_to_cart' | 'purchase', db: PrismaClient): Promise<void> {
  if (!userId || !productId || !type) return;

  try {
    if (type === 'view') {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingView = await db.userProductInteraction.findFirst({
            where: {
                user_id: userId,
                product_id: productId,
                interaction_type: 'view',
                created_at: { gte: fiveMinsAgo }
            }
        });

        if (existingView) {
            return;
        }
    }

    await db.userProductInteraction.create({
        data: {
            user_id: userId,
            product_id: productId,
            interaction_type: type
        }
    });

  } catch (err: unknown) {
    console.error("Interaction log error:", getErrorMessage(err));
  }
}
