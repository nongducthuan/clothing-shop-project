import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const p = Number(page) || 1;
        const l = Number(limit) || 50;
        const offset = (p - 1) * l;

        const [ordersRaw, totalOrders] = await Promise.all([
            prisma.order.findMany({
                skip: offset,
                take: l,
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    voucher: {
                        select: { id: true, code: true, discount_percent: true, max_discount_amount: true }
                    },
                    return_request: {
                        include: {
                            items: {
                                include: {
                                    order_item: {
                                        include: {
                                            product: { select: { name: true, name_vi: true, name_en: true } }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    items: {
                        include: {
                            product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                            color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                            size: { select: { size: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            }),
            prisma.order.count()
        ]);

        const processedOrders = ordersRaw.map(order => {
            let bankInfo = null;
            let returnImages: any[] = [];
            const rr = order.return_request;

            if (rr) {
                try {
                    bankInfo = typeof rr.refund_bank_info === 'string'
                        ? JSON.parse(rr.refund_bank_info)
                        : rr.refund_bank_info;
                    returnImages = typeof rr.images === 'string'
                        ? JSON.parse(rr.images)
                        : rr.images || [];
                } catch (e) {
                    console.error("Error parsing return data for order:", order.id, e);
                }
            }

            const items = order.items.map(item => ({
                ...item,
                product_name: item.product?.name,
                product_name_vi: item.product?.name_vi,
                product_name_en: item.product?.name_en,
                image_url: item.color?.image_url || item.product?.image_url,
                color_name: item.color?.color_name,
                color_name_vi: item.color?.color_name_vi,
                color_name_en: item.color?.color_name_en,
                size: item.size?.size
            }));

            const displayStatus = ENUM_TO_DISPLAY_STATUS[order.status] || order.status;
            const normalizedDisplayStatus =
                displayStatus === 'Delivered' && rr?.status === 'Pending' ? 'Return Requested' : displayStatus;

            return {
                ...order,
                status: normalizedDisplayStatus,
                user_name: order.user?.name || order.name,
                user_email: order.user?.email || order.email,
                shipping_fee: Number(order.shipping_fee || 0),
                reason_code: rr?.reason_code,
                description: rr?.description,
                admin_response: rr?.admin_response,
                refund_bank_info: bankInfo,
                return_images: returnImages,
                return_status: rr?.status,
                refund_amount: rr ? Number(rr.refund_amount) : 0,
                return_items: rr?.items || [],
                voucher: order.voucher ? {
                    id: order.voucher.id,
                    code: order.voucher.code,
                    discount_percent: order.voucher.discount_percent ? Number(order.voucher.discount_percent) : null,
                    max_discount_amount: order.voucher.max_discount_amount ? Number(order.voucher.max_discount_amount) : null
                } : null,
                voucher_code: order.voucher?.code || null,
                items,
                user: undefined,
                return_request: undefined
            };
        });

        res.json({
            data: processedOrders,
            totalPages: Math.ceil(totalOrders / l),
            currentPage: p,
            totalOrders
        });
    } catch (err) {
        console.error("getOrders admin error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { payment_status } = req.body;

    // State machine cho tiền — đối xứng với ALLOWED_STATUS_TRANSITIONS của đơn:
    // Unpaid -> Paid | Refunded | giữ nguyên
    // Paid -> Refunded | Unpaid | giữ nguyên
    //   Paid -> Unpaid = undo "bấm nhầm Đã thanh toán" khi tiền CHƯA thật sự thu
    //   (điển hình COD). MoMo/VNPay: Paid thường do webhook cổng ghi — admin phải
    //   đối chiếu cổng thanh toán trước khi hoàn tác. Mọi lần đổi đều ghi audit log.
    // Refunded -> Paid (lỡ bấm hoàn nhầm mà chưa chuyển tiền thật) | giữ nguyên
    const ALLOWED_PAYMENT_TRANSITIONS: Record<string, string[]> = {
        Unpaid: ["Unpaid", "Paid", "Refunded"],
        Paid: ["Paid", "Refunded", "Unpaid"],
        Refunded: ["Refunded", "Paid"],
    };
    // Refunded chỉ hợp lệ khi đơn đã đóng (Cancelled / Return_Approved):
    // đơn đang mở mà đánh dấu Refunded là sổ sai.

    try {
        const orderId = Number(id);
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            res.status(404).json({ message: "Order not found." });
            return;
        }

        const from = order.payment_status as string;
        const to = String(payment_status);

        if (!ALLOWED_PAYMENT_TRANSITIONS[from]?.includes(to)) {
            res.status(400).json({ message: `Invalid payment transition: ${from} -> ${to}.` });
            return;
        }
        if (to === "Refunded" && from !== "Refunded") {
            const orderEnum = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? (order.status as string);
            if (!["Cancelled", "Return_Approved"].includes(orderEnum)) {
                res.status(400).json({ message: "Refunded is only allowed for Cancelled or Return Approved orders." });
                return;
            }
        }

        if (from !== to) {
            await prisma.$transaction([
                prisma.order.update({ where: { id: orderId }, data: { payment_status: to as any } }),
                prisma.paymentStatusLog.create({
                    data: {
                        order_id: orderId,
                        from_status: from as any,
                        to_status: to as any,
                        changed_by: (req as any).user?.id ?? null,
                        note: "Admin manual update",
                    },
                }),
            ]);
        }

        res.json({ message: `Payment status updated to ${payment_status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating payment" });
    }
};

const ENUM_TO_DISPLAY_STATUS: Record<string, string> = {
    "Return_Requested": "Return Requested",
    "Return_Rejected":  "Return Rejected",
    "Return_Approved":  "Return Approved",
};

// Map display names (with spaces, as sent by frontend) → Prisma enum names (with underscores)
const STATUS_DISPLAY_TO_ENUM: Record<string, string> = {
    "Return Requested": "Return_Requested",
    "Return Rejected":  "Return_Rejected",
    "Return Approved":  "Return_Approved",
};

// Luồng trạng thái hợp lệ (khớp với frontend/src/utils/orderUtils.ts):
// Pending → Confirmed → Shipping → Delivered, hoặc Cancelled ở bất kỳ bước nào.
// Phải validate ở backend vì UI chỉ chặn được ở dropdown —
// gọi API trực tiếp vẫn có thể nhảy bước và làm sai kho/doanh thu.
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Shipping", "Cancelled"],
    Shipping: ["Delivered", "Cancelled"],
    Delivered: [],
    Cancelled: [],
};

// 3 trạng thái đổi trả chỉ được đổi qua /return/approve hoặc /return/reject
const RETURN_STATUS_ENUMS = ["Return_Requested", "Return_Approved", "Return_Rejected"];

// Admin bấm nhầm hay đổi ý: cho phép quay lại đúng 3 cặp an toàn, mỗi cặp có
// hậu quả đảo chiều được changeOrderStatusLogic xử lý đối xứng:
//   Delivered → Shipping            : trừ doanh thu/total_spent đúng ngày delivered_at
//   Cancelled → Pending             : trừ lại kho (chặn nếu không đủ kho)
//   Return_Rejected → Return_Requested : chỉ đổi nhãn (reject chưa đụng kho/tiền) và trả
//                                     yêu cầu đổi trả về Pending → đơn quay lại đúng vòng
//                                     "chờ duyệt đổi trả" như khi khách vừa gửi yêu cầu.
//                                     KHÔNG đưa về Delivered: yêu cầu còn mở thì đơn không
//                                     còn là "Đã giao", và nếu để Delivered thì 2 chiều
//                                     hoàn tác (duyệt nhầm / từ chối nhầm) bị trùng nhau.
// Mọi cặp khác vẫn bị chặn: Return_Approved → Delivered bị cấm vì tiền có thể
// đã hoàn thật cho khách, undo sẽ làm sổ lệch ngoài hệ thống.
const UNDO_TRANSITIONS: Record<string, string> = {
    "Delivered": "Shipping",
    "Cancelled": "Pending",
    "Return_Rejected": "Return_Requested",
};

const isUndoTransition = (from: string, to: string): boolean =>
    UNDO_TRANSITIONS[from] === to;

// Rank tiến trình của luồng chính, dùng để CHỐNG ĐI LÙI trong changeOrderStatusLogic.
// Webhook IPN (MoMo/VNPay) có thể đến TRỄ hoặc được gateway retry nhiều lần: nếu admin
// đã đẩy đơn lên Shipping/Delivered mà IPN vẫn yêu cầu set về 'Confirmed' thì phải chặn,
// nếu không doanh thu/total_spent sẽ bị trừ sai (Delivered → khác = -total_price).
// - Cùng rank (IPN retry / no-op) → cho phép, idempotent.
// - Cancelled và 3 trạng thái Return_* không nằm trong rank → luôn cho phép
//   (hủy/đổi trả là luồng riêng; admin API còn có ALLOWED_STATUS_TRANSITIONS chặn trước).
// - Guard chỉ chặn phần TRẠNG THÁI ĐƠN; payment_status do caller set TRƯỚC khi gọi
//   hàm này nên tiền đã thu vẫn được ghi nhận bình thường.
const STATUS_RANK: Record<string, number> = {
    Pending: 1,
    Confirmed: 2,
    Shipping: 3,
    Delivered: 4,
    Return_Requested: 5,
    Return_Rejected: 5,
    Return_Approved: 5,
};

// Complex status change handling inventory and revenue
// opts.partial: khi approve đổi trả 1 phần — chỉ hoàn kho + trừ tiền đúng các item
// được trả (returnItems: [{size_id, return_quantity}], refundAmount), thay vì toàn bộ đơn.
// approveReturn PHẢI đi qua đường này để kho/doanh thu/spending chỉ có 1 nơi tính.
type StatusLogicOpts = {
    isUndo?: boolean;
    skipFinancial?: boolean;
    skipStock?: boolean;
    partial?: { returnItems: { size_id: number | null; return_quantity: number }[]; refundAmount: number };
};

export const changeOrderStatusLogic = async (
    orderId: number,
    newStatus: string,
    opts?: StatusLogicOpts
) => {
    return await prisma.$transaction(async (tx) => {
        await changeOrderStatusLogicTx(tx, orderId, newStatus, opts);
    });
};

// Core logic chạy trên transaction caller truyền vào — dùng để gộp approveReturn
// (update ReturnRequest + hoàn kho + đổi status + trừ tiền) vào 1 transaction duy nhất.
export const changeOrderStatusLogicTx = async (
    tx: any,
    orderId: number,
    newStatus: string,
    opts?: StatusLogicOpts
) => {
    // Normalize: "Return Requested" → "Return_Requested" etc.
    const normalizedStatus = STATUS_DISPLAY_TO_ENUM[newStatus] ?? newStatus;

    {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) throw new Error("Order not found");

        const oldStatus = order.status;
        const totalPrice = Number(order.total_price);
        const userId = order.user_id;
        const orderVoucherId = order.voucher_id;

        // 0. Chống đi lùi: IPN đến trễ/retry hoặc caller nội bộ không được kéo đơn về
        // trạng thái trước đó (VD: Delivered → Confirmed sẽ trừ doanh thu + total_spent).
        // Normalize cả oldStatus để khớp cả 2 biến thể "Return Requested"/"Return_Requested".
        // Ngoại lệ: opts.isUndo (chỉ updateOrderStatus khi khớp UNDO_TRANSITIONS) được phép
        // quay lại đúng 1 bước có kiểm soát — hậu quả đảo chiều do chính logic này xử lý.
        const oldEnum = STATUS_DISPLAY_TO_ENUM[oldStatus] ?? oldStatus;
        const oldRank: number | undefined = STATUS_RANK[oldEnum];
        const newRank: number | undefined = STATUS_RANK[normalizedStatus];
        if (!opts?.isUndo && oldRank !== undefined && newRank !== undefined && newRank < oldRank) {
            console.warn(
                `⛔ Blocked status regression for order #${orderId}: ${oldStatus} → ${normalizedStatus}`
            );
            throw new Error(
                `Invalid status transition: cannot move order #${orderId} from "${oldStatus}" back to "${normalizedStatus}"`
            );
        }

        // 1. Inventory Updates
        const inactiveSet = new Set(["Cancelled", "Return_Approved"]);

        const oldIsInactive = inactiveSet.has(oldStatus);
        const newIsInactive = inactiveSet.has(normalizedStatus as any);

        if (oldIsInactive !== newIsInactive) {
            if (opts?.skipStock) {
                // approveReturn đã tự hoàn kho partial trước đó — bỏ qua để không hoàn 2 lần
            } else if (opts?.partial && !oldIsInactive && newIsInactive) {
                // Partial return: chỉ hoàn kho đúng các item được trả
                for (const retItem of opts.partial.returnItems) {
                    if (!retItem.size_id) continue;
                    await tx.productSize.update({
                        where: { id: retItem.size_id },
                        data: { stock: { increment: retItem.return_quantity } }
                    });
                }
            } else for (const item of order.items) {
                if (!item.size_id) continue;

                if (!oldIsInactive && newIsInactive) {
                    // Restore stock (Cancelled / Return Approved)
                    await tx.productSize.update({
                        where: { id: item.size_id },
                        data: { stock: { increment: item.quantity } }
                    });
                } else if (oldIsInactive && !newIsInactive) {
                    // Deduct stock (e.g. Cancelled → Pending)
                    const size = await tx.productSize.findUnique({ where: { id: item.size_id } });
                    if (!size || size.stock < item.quantity) {
                        throw new Error(`Insufficient stock for product (size_id=${item.size_id})`);
                    }
                    await tx.productSize.update({
                        where: { id: item.size_id },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }
        }

        // 2. Financial Updates
        // skipFinancial: dùng cho undo reject (Return_Rejected → Return_Requested) — reject chưa
        // từng trừ kho/doanh thu nên KHÔNG được cộng lại, nếu không doanh thu + order count
        // sẽ bị nhân đôi.
        let revenueChange = 0;
        let orderCountChange = 0;
        let deliveredAtUpdate: Date | null = null;

        // Nhóm trạng thái mà doanh thu của đơn VẪN ĐANG được tính trong báo cáo:
        //   - Delivered         : đã giao, tiền đã ghi nhận vào ngày delivered_at.
        //   - Return_Requested  : khách đã gửi yêu cầu đổi trả nhưng CHƯA được duyệt
        //     (submitReturnRequest / undo chỉ đổi nhãn, không đụng bảng revenues) → doanh thu
        //     vẫn giữ nguyên, chỉ trừ khi đổi trả được CHẤP NHẬN (Return_Approved) hoặc đơn bị hủy.
        // Nhờ vậy mọi đường vào Return_Requested (khách gửi yêu cầu, hoàn tác duyệt nhầm,
        // hoàn tác từ chối nhầm) đều hành xử giống nhau khi admin quyết định lại.
        const REVENUE_COUNTED_STATUSES = new Set(["Delivered", "Return_Requested"]);

        if (opts?.skipFinancial) {
            // Không đụng doanh thu/spending/delivered_at — chỉ đổi nhãn trạng thái
        } else if (opts?.partial && normalizedStatus === "Return_Approved" && REVENUE_COUNTED_STATUSES.has(oldEnum)) {
            // Partial return: chỉ trừ refundAmount, KHÔNG trừ order count
            // (đơn vẫn được tính là 1 đơn đã bán, chỉ hoàn 1 phần tiền hàng)
            revenueChange = -Math.max(0, Number(opts.partial.refundAmount) || 0);
            orderCountChange = 0;
        } else if (oldEnum !== "Delivered" && normalizedStatus === "Delivered") {
            revenueChange = totalPrice;
            orderCountChange = 1;
            deliveredAtUpdate = new Date(); // Fix 7: ghi lại thời điểm giao hàng
        } else if ((normalizedStatus === "Return_Approved" || normalizedStatus === "Cancelled") && REVENUE_COUNTED_STATUSES.has(oldEnum)) {
            revenueChange = -totalPrice;
            orderCountChange = -1;
        } else if (oldEnum === "Delivered" && !REVENUE_COUNTED_STATUSES.has(normalizedStatus)) {
            // Rời khỏi Delivered sang trạng thái KHÔNG còn tính doanh thu (Cancelled/Return_Approved).
            // Return_Requested bị loại khỏi nhánh này vì yêu cầu chưa duyệt → tiền vẫn đang tính.
            revenueChange = -totalPrice;
            orderCountChange = -1;
        }

        // Fix 6: Update User Spending – đảm bảo total_spent không bị âm
        if (revenueChange !== 0 && userId) {
            const currentUser = await tx.user.findUnique({ where: { id: userId } });
            if (currentUser) {
                const newTotalSpent = Math.max(0, Number(currentUser.total_spent) + revenueChange);
                await tx.user.update({
                    where: { id: userId },
                    data: { total_spent: newTotalSpent }
                });

                const tier = await tx.membership.findFirst({
                    where: { min_spending: { lte: newTotalSpent } },
                    orderBy: { min_spending: 'desc' }
                });
                if (tier) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { membership_id: tier.id }
                    });
                }
            }
        }

        // Fix 7: Update Daily Revenues – dùng ngày giao hàng thực tế, không phải ngày hôm nay
        if (revenueChange !== 0 || orderCountChange !== 0) {
            // Xác định ngày để ghi revenue:
            // - Khi status → Delivered: dùng ngày hôm nay
            // - Khi cancel/return từ Delivered: dùng delivered_at của đơn (ngày gốc)
            let revenueDate: Date;
            if (normalizedStatus === "Delivered") {
                revenueDate = new Date();
            } else if (order.delivered_at) {
                revenueDate = new Date(order.delivered_at);
            } else {
                revenueDate = new Date(); // fallback nếu chưa có delivered_at
            }
            revenueDate.setHours(0, 0, 0, 0);

            const existingRevenue = await tx.revenue.findUnique({
                where: { report_date: revenueDate }
            });

            if (existingRevenue) {
                await tx.revenue.update({
                    where: { report_date: revenueDate },
                    data: {
                        total_sales: { increment: revenueChange },
                        total_orders: { increment: orderCountChange }
                    }
                });
            } else {
                await tx.revenue.create({
                    data: {
                        report_date: revenueDate,
                        total_sales: Math.max(0, revenueChange),
                        total_orders: Math.max(0, orderCountChange)
                    }
                });
            }
        }

        // 3. Update Order
        const updateData: any = { status: normalizedStatus as any };
        if (deliveredAtUpdate) updateData.delivered_at = deliveredAtUpdate; // Fix 7

        // 4. Cờ hoàn tiền: đơn ĐÃ thu tiền mà bị hủy / chấp nhận đổi trả → đánh dấu 'Refunded'
        // để admin biết cần hoàn tiền cho khách.
        // Quyết định dựa trên payment_status (tiền đã thu chưa), KHÔNG dựa vào payment_method
        // (COD giao xong vẫn đã thu tiền mặt). Chỉ set khi thực sự chuyển vào trạng thái
        // inactive → gọi lại nhiều lần cũng không ghi đè sai.
        // Cờ hoàn tiền + audit log: đơn ĐÃ thu tiền mà bị hủy / chấp nhận đổi trả
        // → đánh dấu 'Refunded' để admin biết cần hoàn tiền cho khách.
        // Quyết định dựa trên payment_status (tiền đã thu chưa), KHÔNG dựa vào payment_method
        // (COD giao xong vẫn đã thu tiền mặt). Chỉ set khi thực sự chuyển vào trạng thái
        // inactive → gọi lại nhiều lần cũng không ghi đè sai.
        let paymentTransition: { from: string; to: string } | null = null;
        if (newIsInactive && !oldIsInactive && order.payment_status === 'Paid') {
            updateData.payment_status = 'Refunded';
            paymentTransition = { from: 'Paid', to: 'Refunded' };
        }

        await tx.order.update({
            where: { id: orderId },
            data: updateData
        });

        if (paymentTransition) {
            await tx.paymentStatusLog.create({
                data: {
                    order_id: orderId,
                    from_status: paymentTransition.from as any,
                    to_status: paymentTransition.to as any,
                    changed_by: null,
                    note: `Auto: ${oldStatus} -> ${normalizedStatus}`,
                },
            });
        }

        // 5. Hoàn voucher khi đơn bị hủy TRƯỚC khi giao (Pending/Confirmed/Shipping → Cancelled):
        // voucher chỉ nên bị trừ hẳn khi đơn Delivered. Hủy sớm mà mất voucher là thiệt cho khách.
        // (Return_Approved KHÔNG hoàn — khách đã nhận hàng rồi mới trả, voucher đã tiêu là đúng.)
        // Voucher không giới hạn (usage_limit null) chỉ giảm used_count, không tăng limit.
        if (
            orderVoucherId &&
            normalizedStatus === "Cancelled" &&
            oldStatus !== "Delivered" &&
            (oldEnum === "Pending" || oldEnum === "Confirmed" || oldEnum === "Shipping")
        ) {
            const v = await tx.voucher.findUnique({ where: { id: orderVoucherId } });
            if (v) {
                await tx.voucher.update({
                    where: { id: orderVoucherId },
                    data: v.usage_limit !== null && v.usage_limit !== undefined
                        ? { usage_limit: { increment: 1 }, used_count: { decrement: 1 } }
                        : { used_count: v.used_count > 0 ? { decrement: 1 } : undefined },
                });
            }
        }
    }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const orderId = Number(id);

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });
        if (!order) {
            res.status(404).json({ message: "Order not found." });
            return;
        }

        const normalizedStatus = STATUS_DISPLAY_TO_ENUM[status] ?? status;

        // Undo có kiểm soát: bấm nhầm/đổi ý — chỉ 3 cặp chính xác được quay lại
        // (Delivered→Shipping, Cancelled→Pending, Return_Rejected→Return_Requested).
        // Mỗi cặp có hậu quả đảo chiều đã được xử lý đối xứng trong changeOrderStatusLogic;
        // Return_Rejected→Return_Requested cần skipFinancial vì reject chưa hề trừ doanh thu
        // (giữ luôn nhánh cũ →Delivered cho dữ liệu đã hoàn tác bằng phiên bản trước).
        const oldEnum = STATUS_DISPLAY_TO_ENUM[order.status] ?? order.status;
        const isUndo = isUndoTransition(oldEnum, normalizedStatus);
        const skipFinancial =
            oldEnum === "Return_Rejected" &&
            (normalizedStatus === "Return_Requested" || normalizedStatus === "Delivered");

        // Validate luồng: chặn nhảy bước / nhảy vào trạng thái đổi trả qua API này.
        // Cho phép khi trạng thái không đổi (no-op) để không phá các lần bấm lặp.
        if (normalizedStatus !== order.status && !isUndo) {
            if (RETURN_STATUS_ENUMS.includes(normalizedStatus)) {
                console.warn(`Blocked direct set of return status "${normalizedStatus}" on order #${orderId}`);
                res.status(400).json({
                    message: "Return statuses must be updated via the approve or reject return action."
                });
                return;
            }

            const allowedTargets = ALLOWED_STATUS_TRANSITIONS[order.status];
            if (!allowedTargets || !allowedTargets.includes(normalizedStatus)) {
                console.warn(`Blocked invalid status transition ${order.status} → ${normalizedStatus} on order #${orderId}`);
                res.status(400).json({ message: "Invalid status transition for this order." });
                return;
            }
        }

        if (isUndo && skipFinancial) {
            // Undo từ chối nhầm (Return_Rejected → Return_Requested): trả ReturnRequest về
            // Pending + xóa lý do từ chối (quyết định đã bị rút lại) trong CÙNG transaction —
            // đối xứng với undoApproveReturn — để admin bấm Approve/Reject lại ngay mà
            // khách không phải gửi lại yêu cầu đổi trả lần 2. Đơn về "Return Requested"
            // (không phải "Delivered") vì yêu cầu đổi trả vẫn đang mở.
            await prisma.$transaction(async (tx) => {
                await changeOrderStatusLogicTx(tx, orderId, status, { isUndo, skipFinancial });
                await tx.returnRequest.updateMany({
                    where: { order_id: orderId },
                    data: { status: 'Pending', admin_response: null },
                });
            });
        } else {
            await changeOrderStatusLogic(orderId, status, { isUndo, skipFinancial });
        }
        res.json({ message: 'Order status updated successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const changeOrderStatus = updateOrderStatus;

export const approveReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    try {
        const returnReq = await prisma.returnRequest.findUnique({
            where: { order_id: orderId },
            include: { items: { include: { order_item: true } } }
        });

        const refundAmount = returnReq ? Number(returnReq.refund_amount) : 0;
        const hasPartialItems = !!returnReq?.items && returnReq.items.length > 0;
        const shippingRefund = returnReq ? Number(returnReq.shipping_refund ?? 0) : 0;

        await prisma.$transaction(async (tx) => {
            if (returnReq) {
                await tx.returnRequest.update({
                    where: { order_id: orderId },
                    data: { status: 'Approved', admin_response: null }
                });
            } else {
                await tx.returnRequest.create({
                    data: {
                        order_id: orderId,
                        reason_code: 'Admin Approval',
                        description: 'Manually approved by admin',
                        status: 'Approved',
                        admin_response: null
                    }
                });
            }

            if (hasPartialItems) {
                await changeOrderStatusLogicTx(tx, orderId, 'Return_Approved', {
                    partial: {
                        returnItems: returnReq!.items.map((retItem) => ({
                            size_id: retItem.order_item.size_id,
                            return_quantity: retItem.return_quantity,
                        })),
                        refundAmount: refundAmount + shippingRefund,
                    },
                });
            } else {
                // Backward-compatible: manual approve hoặc full return → restore toàn bộ
                await changeOrderStatusLogicTx(tx, orderId, 'Return_Approved');
            }
        });

        res.status(200).json({ message: "Return request approved successfully!" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};

// Hoàn tác duyệt nhầm Return Approved — thay thế runbook SQL trong README.
// Admin chốt 2 dữ kiện đã gọi điện xác nhận với khách:
//   - stock_returned: hàng đã gửi trả về kho thật chưa?
//     false → trừ lại kho (số đã cộng nhầm lúc approve). true → giữ nguyên.
//   - money_refunded: tiền đã hoàn ra ngoài thật chưa?
//     false → Refunded → Paid. true → giữ Refunded.
// Toàn bộ đảo ngược (kho + doanh thu/total_spent/membership + payment + status)
// chạy trong 1 transaction duy nhất — crash giữa chừng không lệch sổ.
// ReturnRequest KHÔNG xóa, chỉ trả về Pending để còn lịch sử; đơn quay về
// "Return Requested" (yêu cầu vẫn đang mở — chờ admin quyết định lại), KHÔNG phải
// "Delivered" như bản cũ vì như vậy đơn trông như đã giao xong giữa lúc còn đổi trả.
export const undoApproveReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    const { stock_returned = true, money_refunded = true } = req.body ?? {};
    try {
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!order) throw new Error("Order not found.");
            const oldEnum = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? (order.status as string);
            if (oldEnum !== "Return_Approved") {
                throw new Error(`Only a Return Approved order can be un-approved (current: "${order.status}").`);
            }

            const returnReq = await tx.returnRequest.findUnique({
                where: { order_id: orderId },
                include: { items: { include: { order_item: true } } },
            });
            const hasPartialItems = !!returnReq?.items && returnReq.items.length > 0;
            const refundAmount = returnReq ? Number(returnReq.refund_amount) : 0;
            const shippingRefund = returnReq ? Number((returnReq as any).shipping_refund ?? 0) : 0;
            const restoreAmount = hasPartialItems ? refundAmount + shippingRefund : Number(order.total_price);

            // 1. Trừ lại kho nếu hàng chưa về (đảo của lúc approve cộng kho)
            if (!stock_returned) {
                const toDeduct: { size_id: number | null; qty: number }[] = hasPartialItems
                    ? returnReq!.items.map((retItem) => ({ size_id: retItem.order_item.size_id, qty: retItem.return_quantity }))
                    : order.items.map((item) => ({ size_id: item.size_id, qty: item.quantity }));
                for (const d of toDeduct) {
                    if (!d.size_id) continue;
                    const size = await tx.productSize.findUnique({ where: { id: d.size_id } });
                    if (!size || Number(size.stock) < d.qty) {
                        throw new Error(`Insufficient stock for product (size_id=${d.size_id})`);
                    }
                    await tx.productSize.update({
                        where: { id: d.size_id },
                        data: { stock: { decrement: d.qty } },
                    });
                }
            }

            // 2. Cộng lại doanh thu đúng ngày giao gốc (đảo của lúc approve trừ tiền).
            // Partial: cộng refundAmount, KHÔNG cộng order count.
            // Full: cộng cả đơn + count.
            const revenueDate = order.delivered_at ? new Date(order.delivered_at) : new Date();
            revenueDate.setHours(0, 0, 0, 0);
            const revenuePayload: any = {
                total_sales: { increment: Math.max(0, restoreAmount) },
                ...(hasPartialItems ? {} : { total_orders: { increment: 1 } }),
            };
            const existingRevenue = await tx.revenue.findUnique({ where: { report_date: revenueDate } });
            if (existingRevenue) {
                await tx.revenue.update({ where: { report_date: revenueDate }, data: revenuePayload });
            } else {
                await tx.revenue.create({
                    data: {
                        report_date: revenueDate,
                        total_sales: Math.max(0, restoreAmount),
                        total_orders: hasPartialItems ? 0 : 1,
                    },
                });
            }

            // 3. Cộng lại total_spent + tính lại hạng membership (đảo của lúc approve)
            if (order.user_id && restoreAmount > 0) {
                const currentUser = await tx.user.findUnique({ where: { id: order.user_id } });
                if (currentUser) {
                    const newTotalSpent = Number(currentUser.total_spent) + restoreAmount;
                    await tx.user.update({ where: { id: order.user_id }, data: { total_spent: newTotalSpent } });
                    const tier = await tx.membership.findFirst({
                        where: { min_spending: { lte: newTotalSpent } },
                        orderBy: { min_spending: 'desc' },
                    });
                    if (tier) {
                        await tx.user.update({ where: { id: order.user_id }, data: { membership_id: tier.id } });
                    }
                }
            }

            // 4. Trả status về Return_Requested + trả ReturnRequest về Pending (giữ lịch sử).
            // Yêu cầu đổi trả của khách vẫn đang mở ⇒ đơn phải nằm lại đúng vòng chờ duyệt
            // ("Yêu cầu đổi trả"), KHÔNG phải Delivered — nếu để Delivered thì đơn bị hiển thị
            // như đã giao xong trong khi yêu cầu đổi trả vẫn treo, và trùng với chiều hoàn tác
            // từ chối nhầm (2 chiều không còn phân biệt được).
            // isUndo để vượt guard chống đi lùi (rank 5 → 5); skip stock/financial
            // vì kho + tiền đã tự đảo ở bước 1-3.
            await changeOrderStatusLogicTx(tx, orderId, 'Return_Requested', { isUndo: true, skipFinancial: true, skipStock: true });
            if (returnReq) {
                await tx.returnRequest.update({
                    where: { order_id: orderId },
                    data: { status: 'Pending', admin_response: null },
                });
            }

            // 5. Payment: chỉ đảo Refunded → Paid khi tiền chưa ra ngoài thật.
            let paymentRestored = false;
            if (!money_refunded && order.payment_status === 'Refunded') {
                await tx.order.update({ where: { id: orderId }, data: { payment_status: 'Paid' } });
                await tx.paymentStatusLog.create({
                    data: {
                        order_id: orderId,
                        from_status: 'Refunded' as any,
                        to_status: 'Paid' as any,
                        changed_by: (req as any).user?.id ?? null,
                        note: 'Undo approve: money not yet refunded',
                    },
                });
                paymentRestored = true;
            }

            return { restoreAmount, hasPartialItems, paymentRestored };
        });

        res.status(200).json({ message: "Return approval undone. Order is back to Return Requested.", ...result });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};

export const rejectReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    const { adminNote } = req.body;
    try {
        const current = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true },
        });
        if (!current) throw new Error("Order not found.");
        const currentEnum = STATUS_DISPLAY_TO_ENUM[current.status as string] ?? (current.status as string);
        const rejectFromDelivered = currentEnum === "Delivered";

        await prisma.$transaction(async (tx) => {
            const existing = await tx.returnRequest.findUnique({ where: { order_id: orderId } });
            if (existing) {
                await tx.returnRequest.update({
                    where: { order_id: orderId },
                    data: { status: 'Rejected', admin_response: adminNote }
                });
            } else {
                await tx.returnRequest.create({
                    data: {
                        order_id: orderId,
                        reason_code: 'Admin Rejection',
                        description: 'Manually rejected by admin',
                        status: 'Rejected',
                        admin_response: adminNote || 'Rejected by admin'
                    }
                });
            }
            await changeOrderStatusLogicTx(
                tx,
                orderId,
                'Return_Rejected',
                rejectFromDelivered ? { skipFinancial: true } : undefined
            );
        });
        res.status(200).json({ message: "Return request rejected successfully." });
    } catch (err: any) {
        res.status(500).json({ message: "Failed to reject return request", error: err.message });
    }
};
