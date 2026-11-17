import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import type { Prisma } from '../../generated/prisma/client';

type SqlNumeric = Prisma.Decimal | bigint | number | string | null;

interface SummaryRow {
    weeklyOrders: bigint | number;
    weeklyRevenue: SqlNumeric;
    weeklyProfit: SqlNumeric;
    productsSoldWeek: bigint | number | null;
    monthlyOrders: bigint | number;
    monthlyRevenue: SqlNumeric;
    monthlyProfit: SqlNumeric;
    productsSoldMonth: bigint | number | null;
}

interface Revenue7DaysRow {
    full_date: Date;
    day: string;
    revenue: SqlNumeric;
    profit: SqlNumeric;
}

interface OrderStatusRow {
    status: string;
    quantity: bigint | number;
}

interface RevenueMonthRow {
    month_label: string;
    revenue: SqlNumeric;
    profit: SqlNumeric;
}

interface CategoryStatsRow {
    category_name: string;
    category_name_vi: string | null;
    category_name_en: string | null;
    total_sold: bigint | number | null;
    total_revenue: SqlNumeric;
}

interface CountRow {
    reason?: string | null;
    status?: string;
    quantity: bigint | number;
}

interface DashboardRow {
    totalStock: bigint | number | null;
    orders: bigint | number;
    categoriesCount: bigint | number;
    banners: bigint | number;
    activeSales: bigint | number;
    activeVouchers: bigint | number;
    activePromotions: bigint | number;
    users: bigint | number;
}

const bigintReplacer = (_key: string, value: unknown): unknown =>
    typeof value === 'bigint' ? Number(value) : value;

const formatBigInt = <T>(obj: T): T =>
    JSON.parse(JSON.stringify(obj, bigintReplacer)) as T;

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Only approved returns reduce recognized product revenue/quantity.
        // Keep the aggregation at order-item grain to avoid multiplying rows.
        const approvedReturnsJoin = `
            LEFT JOIN (
                SELECT
                    rri.order_item_id,
                    SUM(rri.return_quantity) AS returned_quantity,
                    SUM(rri.refund_amount) AS returned_amount
                FROM return_request_items rri
                JOIN return_requests rr ON rr.id = rri.return_request_id AND rr.status = 'Approved'
                GROUP BY rri.order_item_id
            ) returned ON returned.order_item_id = oi.id
        `;
        const approvedReturnOrdersJoin = `
            LEFT JOIN (
                SELECT rr.order_id, COUNT(rri.id) AS returned_item_count
                FROM return_requests rr
                LEFT JOIN return_request_items rri ON rri.return_request_id = rr.id
                WHERE rr.status = 'Approved'
                GROUP BY rr.order_id
            ) approved_return_order ON approved_return_order.order_id = o.id
        `;
        const fullManualReturn = "(o.status = 'Return Approved' AND COALESCE(approved_return_order.returned_item_count, 0) = 0)";
        const netItemRevenue = `CASE WHEN ${fullManualReturn} THEN 0 ELSE GREATEST(0, COALESCE(oi.payable_amount, oi.price * oi.quantity) - COALESCE(returned.returned_amount, 0)) END`;
        const retainedQuantity = `CASE WHEN ${fullManualReturn} THEN 0 ELSE (oi.quantity - COALESCE(returned.returned_quantity, 0)) END`;

        // Quy uoc bao cao: chi chot so lieu den HET NGAY HOM QUA.
        // Ngay hom nay chua tron 24h (don co the them/sua/huy) nen khong dua vao
        // summary 7/30 ngay va chart ngay -> tranh so nhay lien tuc trong ngay.
        // Vi vay summary 7 ngay = 7 ngay da chot gan nhat (hom qua - 6 ... hom qua),
        // summary 30 ngay = 30 ngay da chot gan nhat (hom qua - 29 ... hom qua).
        const summarySql = `
            SELECT
                COUNT(DISTINCT CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '7 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date THEN o.id END) AS "weeklyOrders",
                SUM(CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '7 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved') THEN ${netItemRevenue} ELSE 0 END) AS "weeklyRevenue",
                SUM(CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '7 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved') THEN ${netItemRevenue} - (COALESCE(oi.import_price_snapshot, p.import_price) * ${retainedQuantity}) ELSE 0 END) AS "weeklyProfit",
                SUM(CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '7 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved') THEN ${retainedQuantity} ELSE 0 END) AS "productsSoldWeek",

                COUNT(DISTINCT CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '30 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date THEN o.id END) AS "monthlyOrders",
                SUM(CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '30 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved') THEN ${netItemRevenue} ELSE 0 END) AS "monthlyRevenue",
                SUM(CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '30 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved') THEN ${netItemRevenue} - (COALESCE(oi.import_price_snapshot, p.import_price) * ${retainedQuantity}) ELSE 0 END) AS "monthlyProfit",
                SUM(CASE WHEN o.created_at::date BETWEEN (CURRENT_DATE - INTERVAL '30 days')::date AND (CURRENT_DATE - INTERVAL '1 day')::date AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved') THEN ${retainedQuantity} ELSE 0 END) AS "productsSoldMonth"
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            ${approvedReturnsJoin}
            ${approvedReturnOrdersJoin}
        `;
        const summary = await prisma.$queryRawUnsafe<SummaryRow[]>(summarySql);

        const revenue7DaysSql = `
            SELECT
                d.full_date,
                (CASE EXTRACT(ISODOW FROM d.full_date)::int
                    WHEN 1 THEN 'T2'
                    WHEN 2 THEN 'T3'
                    WHEN 3 THEN 'T4'
                    WHEN 4 THEN 'T5'
                    WHEN 5 THEN 'T6'
                    WHEN 6 THEN 'T7'
                    WHEN 7 THEN 'CN'
                END) || ' (' || TO_CHAR(d.full_date, 'DD/MM') || ')' AS day,
                COALESCE(SUM(${netItemRevenue}), 0) AS revenue,
                COALESCE(SUM(${netItemRevenue} - (COALESCE(oi.import_price_snapshot, p.import_price) * ${retainedQuantity})), 0) AS profit
            FROM (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '7 days',
                    CURRENT_DATE - INTERVAL '1 day',
                    INTERVAL '1 day'
                )::date AS full_date
            ) AS d
            LEFT JOIN orders o ON o.created_at::date = d.full_date AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved')
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            ${approvedReturnsJoin}
            ${approvedReturnOrdersJoin}
            GROUP BY d.full_date
            ORDER BY d.full_date ASC
        `;
        const revenue7Days = await prisma.$queryRawUnsafe<Revenue7DaysRow[]>(revenue7DaysSql);

        const orderStatusSql = `SELECT status, COUNT(*) as quantity FROM orders GROUP BY status`;
        const orderStatus = await prisma.$queryRawUnsafe<OrderStatusRow[]>(orderStatusSql);

        const revenueMonthsSql = `
            SELECT
                TO_CHAR(m.month_date, 'MM/YY') AS month_label,
                COALESCE(SUM(${netItemRevenue}), 0) AS revenue,
                COALESCE(SUM(${netItemRevenue} - (COALESCE(oi.import_price_snapshot, p.import_price) * ${retainedQuantity})), 0) AS profit
            FROM (
                SELECT generate_series(
                    date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
                    date_trunc('month', CURRENT_DATE),
                    INTERVAL '1 month'
                )::date AS month_date
            ) AS m
            LEFT JOIN orders o ON o.created_at >= m.month_date
                AND o.created_at < (m.month_date + INTERVAL '1 month')
                AND o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved')
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            ${approvedReturnsJoin}
            ${approvedReturnOrdersJoin}
            GROUP BY m.month_date
            ORDER BY m.month_date ASC
        `;
        const revenueMonths = await prisma.$queryRawUnsafe<RevenueMonthRow[]>(revenueMonthsSql);

        const categoryStatsSql = `
            SELECT
                c.name AS category_name,
                c.name_vi AS category_name_vi,
                c.name_en AS category_name_en,
                SUM(${retainedQuantity}) AS total_sold,
                SUM(${netItemRevenue}) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            ${approvedReturnsJoin}
            ${approvedReturnOrdersJoin}
            WHERE o.status IN ('Delivered','Return Requested','Return Rejected','Return Approved')
            GROUP BY c.id, c.name, c.name_vi, c.name_en
            ORDER BY total_revenue DESC;
        `;
        const categoryStats = await prisma.$queryRawUnsafe<CategoryStatsRow[]>(categoryStatsSql);

        const returnReasonsSql = `SELECT reason_code AS reason, COUNT(*) AS quantity FROM return_requests GROUP BY reason_code`;
        const returnReasons = await prisma.$queryRawUnsafe<CountRow[]>(returnReasonsSql);

        const returnStatusSql = `SELECT status, COUNT(*) as quantity FROM return_requests GROUP BY status`;
        const returnStatuses = await prisma.$queryRawUnsafe<CountRow[]>(returnStatusSql);

        // 8 o so lieu tren Dashboard admin: dem bang SQL ngay tai DB thay vi keo
        // toan bo danh sach ve client. Danh sach orders bi phan trang 50/trang va
        // products/categories con phai build anh preview => dem o client vua nang
        // vua sai khi du lieu lon. Cac dieu kien loc giu DUNG nhu cac man quan ly:
        // products/categories chi tinh ban ghi is_active, promotions loai ban ghi
        // da xoa mem (is_active) va chi tinh status = 'active'.
        const dashboardSql = `
            SELECT
                (SELECT COALESCE(SUM(ps.stock), 0)
                   FROM product_sizes ps
                   JOIN product_colors pc ON ps.color_id = pc.id
                   JOIN products p ON pc.product_id = p.id
                  WHERE p.is_active IS TRUE) AS "totalStock",
                (SELECT COUNT(*) FROM orders) AS orders,
                (SELECT COUNT(*) FROM categories WHERE is_active IS TRUE) AS "categoriesCount",
                (SELECT COUNT(*) FROM banners) AS banners,
                (SELECT COUNT(*) FROM sales WHERE status IS TRUE) AS "activeSales",
                (SELECT COUNT(*) FROM vouchers WHERE status IS TRUE) AS "activeVouchers",
                (SELECT COUNT(*) FROM buy_x_get_y_promotions WHERE status = 'active' AND is_active IS TRUE) AS "activePromotions",
                (SELECT COUNT(*) FROM users) AS users
        `;
        const dashboard = await prisma.$queryRawUnsafe<DashboardRow[]>(dashboardSql);

        res.json({
            ...formatBigInt(summary[0] || {}),
            dashboard: formatBigInt(dashboard[0] || {}),
            revenue7Days: formatBigInt(revenue7Days),
            orderStatus: formatBigInt(orderStatus),
            revenueMonths: formatBigInt(revenueMonths),
            categoryStats: formatBigInt(categoryStats),
            returnStatuses: formatBigInt(returnStatuses),
            returnReasons: formatBigInt(returnReasons)
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ message: "Server error fetching statistics" });
    }
};
