import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // This could be extremely complex to port fully to Prisma ORM. 
        // Using $queryRaw for complex statistics is safer and matches the previous SQL exact behavior.
        const summarySql = `
            SELECT 
                COUNT(DISTINCT CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() THEN o.id END) AS weeklyOrders,
                SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity * oi.price ELSE 0 END) AS weeklyRevenue,
                SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() AND o.status = 'Delivered' THEN (oi.price - p.import_price) * oi.quantity ELSE 0 END) AS weeklyProfit,
                SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity ELSE 0 END) AS productsSoldWeek,
                
                COUNT(DISTINCT CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() THEN o.id END) AS monthlyOrders,
                SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity * oi.price ELSE 0 END) AS monthlyRevenue,
                SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() AND o.status = 'Delivered' THEN (oi.price - p.import_price) * oi.quantity ELSE 0 END) AS monthlyProfit,
                SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity ELSE 0 END) AS productsSoldMonth
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
        `;
        const summary: any[] = await prisma.$queryRawUnsafe(summarySql);

        const revenue7DaysSql = `
            SELECT 
                DATE(o.created_at) AS full_date,
                CASE DAYOFWEEK(o.created_at)
                    WHEN 1 THEN CONCAT('CN (', DATE_FORMAT(o.created_at, '%d/%m'), ')') 
                    WHEN 2 THEN CONCAT('T2 (', DATE_FORMAT(o.created_at, '%d/%m'), ')') 
                    WHEN 3 THEN CONCAT('T3 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
                    WHEN 4 THEN CONCAT('T4 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
                    WHEN 5 THEN CONCAT('T5 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
                    WHEN 6 THEN CONCAT('T6 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
                    WHEN 7 THEN CONCAT('T7 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
                END AS day,
                SUM(oi.quantity * oi.price) AS revenue,
                SUM(oi.quantity * (oi.price - p.import_price)) AS profit
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND NOW()
              AND o.status = 'Delivered'
            GROUP BY full_date, day
            ORDER BY full_date ASC
        `;
        const revenue7Days: any[] = await prisma.$queryRawUnsafe(revenue7DaysSql);

        const orderStatusSql = `SELECT status, COUNT(*) as quantity FROM orders GROUP BY status`;
        const orderStatus: any[] = await prisma.$queryRawUnsafe(orderStatusSql);

        const revenueMonthsSql = `
            SELECT 
                DATE_FORMAT(m.month_date, '%m/%y') AS month_label,
                IFNULL(SUM(oi.quantity * oi.price), 0) AS revenue, 
                IFNULL(SUM(oi.quantity * (oi.price - p.import_price)), 0) AS profit
            FROM (
                SELECT DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL seq MONTH) AS month_date
                FROM (
                    SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                    UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 
                    UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
                ) AS sequences
            ) AS m
            LEFT JOIN orders o ON MONTH(o.created_at) = MONTH(m.month_date) 
                AND YEAR(o.created_at) = YEAR(m.month_date)
                AND o.status = 'Delivered'
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY m.month_date
            ORDER BY m.month_date ASC
        `;
        const revenueMonths: any[] = await prisma.$queryRawUnsafe(revenueMonthsSql);

        const categoryStatsSql = `
            SELECT 
                c.name AS category_name,
                SUM(oi.quantity) AS total_sold,
                SUM(oi.quantity * oi.price) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE o.status = 'Delivered' 
            GROUP BY c.name
            ORDER BY total_revenue DESC;
        `;
        const categoryStats: any[] = await prisma.$queryRawUnsafe(categoryStatsSql);

        const returnReasonsSql = `SELECT reason_code AS reason, COUNT(*) AS quantity FROM return_requests GROUP BY reason_code`;
        const returnReasons: any[] = await prisma.$queryRawUnsafe(returnReasonsSql);

        const returnStatusSql = `SELECT status, COUNT(*) as quantity FROM return_requests GROUP BY status`;
        const returnStatuses: any[] = await prisma.$queryRawUnsafe(returnStatusSql);

        // Format to handle BigInt returned by raw queries (Prisma returns BigInt for COUNT)
        const formatBigInt = (obj: any) => {
            return JSON.parse(JSON.stringify(obj, (key, value) =>
                typeof value === 'bigint' ? Number(value) : value
            ));
        };

        res.json({
            ...formatBigInt(summary[0] || {}),
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
