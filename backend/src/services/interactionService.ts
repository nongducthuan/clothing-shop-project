import prisma from '../../prisma/client';

export async function recordInteraction(userId: number, productId: number, type: 'view' | 'add_to_cart' | 'purchase'): Promise<void> {
  if (!userId || !productId || !type) return;

  try {
    if (type === 'view') {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingView = await prisma.userProductInteraction.findFirst({
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

    await prisma.userProductInteraction.create({
        data: {
            user_id: userId,
            product_id: productId,
            interaction_type: type
        }
    });

  } catch (err: any) {
    console.error("Interaction log error:", err.message);
  }
}
