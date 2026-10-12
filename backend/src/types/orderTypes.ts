import type { Prisma } from '../generated/prisma/client';
import prisma from '../../prisma/client';

export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type OrderWithItems = Prisma.OrderGetPayload<{
    include: { items: true };
}>;

export type OrderRequestItem = {
    product_id: number | string;
    color_id?: number | string | null;
    size_id?: number | string | null;
    quantity: number | string;
    is_gift?: boolean;
    promotion_id?: number | string | null;
};

export type OrderItemToSave = {
    product_id: number;
    color_id: number | null;
    size_id: number | null;
    quantity: number;
    price: number;
    import_price_snapshot: number;
    discount_amount?: number;
    payable_amount?: number;
    is_gift: boolean;
    promotion_id: number | null;
};

export type MinimumOrderValueError = Error & {
    min_order_value: number;
};

export type FormattableOrder = Prisma.OrderGetPayload<{
    include: {
        return_request: {
            include: {
                items: {
                    include: {
                        order_item: {
                            include: {
                                product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                                color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                                size: { select: { size: true } },
                            },
                        },
                    },
                },
            },
        },
        voucher: {
            select: { id: true, code: true, discount_percent: true, max_discount_amount: true },
        },
        items: {
            include: {
                promotion: { select: { id: true, buy_product_id: true, gift_product_id: true, buy_quantity: true, gift_quantity: true } },
                product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                size: { select: { size: true } },
            },
        },
    },
}>;
