import prisma from '../../prisma/client';

export async function recordInteraction(
  userId: number | string,
  productId: number | string,
  type: 'view' | 'add_to_cart' | 'purchase'
): Promise<void> {
  if (!userId || !productId || !type) return;

  const uid = Number(userId);
  const pid = Number(productId);

  try {
    if (type === 'view') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existing = await prisma.userProductInteraction.findFirst({
        where: {
          user_id: uid,
          product_id: pid,
          interaction_type: 'view',
          created_at: { gte: fiveMinutesAgo },
        },
      });

      if (existing) return;
    }

    await prisma.userProductInteraction.create({
      data: {
        user_id: uid,
        product_id: pid,
        interaction_type: type,
      },
    });
  } catch (err: any) {
    console.error('Interaction log error:', err.message);
  }
}
