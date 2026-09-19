import { Request, Response } from 'express';

// ─── Mock Prisma before importing the controller ──────────────────────────────
jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    order: { findUnique: jest.fn() },
  },
}));

import prisma from '../../../prisma/client';
import { updateOrderStatus, rejectReturn } from '../../controllers/admin/orderController';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(params: Record<string, string>, body: Record<string, any>, user: any = { id: 9, role: 'admin' }): Request {
  return { params, body, user } as unknown as Request;
}

/** Đơn Delivered gốc: đã tính doanh thu, đã thu tiền, không voucher. */
const deliveredOrder = {
  id: 326,
  status: 'Delivered',
  total_price: 500000,
  user_id: 1,
  voucher_id: null,
  delivered_at: new Date('2026-01-10T00:00:00Z'),
  payment_status: 'Paid',
  items: [],
};

let tx: any;

beforeEach(() => {
  jest.clearAllMocks();

  tx = {
    order: {
      findUnique: jest.fn().mockResolvedValue(deliveredOrder),
      update: jest.fn().mockResolvedValue({}),
    },
    productSize: { findUnique: jest.fn(), update: jest.fn() },
    revenue: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    membership: { findFirst: jest.fn() },
    returnRequest: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({}),
    },
    paymentStatusLog: { create: jest.fn() },
    voucher: { findUnique: jest.fn(), update: jest.fn() },
  };

  (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('updateOrderStatus – hoàn tác duyệt nhầm Reject (LEGACY: Return_Rejected → Delivered)', () => {
  it('[legacy] trả ReturnRequest về Pending + xóa lý do trong cùng transaction, KHÔNG đụng doanh thu', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ status: 'Return_Rejected' });
    tx.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'Return_Rejected' });

    const res = mockRes();
    await updateOrderStatus(mockReq({ id: '326' }, { status: 'Delivered' }), res);

    // API chặn hẳn: trả 400 và KHÔNG mở transaction nào (không đụng kho/doanh thu/ReturnRequest)
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.returnRequest.updateMany).not.toHaveBeenCalled();
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
  });
});
// Ghi chú: describe phía trên giữ nhánh LEGACY `Return_Rejected → Delivered` — chỉ còn dùng cho
// DỮ LIỆU CŨ do phiên bản trước ghi (orders.status='Delivered' + return_requests.status='Pending').
// Luồng HIỆN TẠI đưa đơn về `Return_Requested` (khớp UNDO_TRANSITIONS ở
// backend/src/controllers/admin/orderController.ts và frontend/src/utils/orderUtils.ts).
describe('updateOrderStatus – hoàn tác từ chối nhầm (Return_Rejected → Return_Requested)', () => {
  it('đơn về Return_Requested + ReturnRequest về Pending, KHÔNG đụng kho/doanh thu', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ status: 'Return_Rejected' });
    tx.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'Return_Rejected' });

    const res = mockRes();
    await updateOrderStatus(mockReq({ id: '326' }, { status: 'Return Requested' }), res);

    // Đơn quay lại đúng vòng chờ duyệt đổi trả (không phải Delivered)
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Return_Requested' }) })
    );
    // Yêu cầu đổi trả về Pending (giữ hàng — lịch sử), lý do từ chối bị xóa
    expect(tx.returnRequest.updateMany).toHaveBeenCalledWith({
      where: { order_id: 326 },
      data: { status: 'Pending', admin_response: null },
    });
    // reject chưa hề hoàn kho/trừ doanh thu → undo không được cộng/trừ gì
    expect(tx.productSize.update).not.toHaveBeenCalled();
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Order status updated successfully' }));
  });
});

describe('rejectReturn – từ chối đổi trả', () => {
  it('từ Delivered (sau hoàn tác duyệt nhầm): chỉ đổi nhãn, KHÔNG trừ doanh thu', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ status: 'Delivered' });
    tx.returnRequest.findUnique.mockResolvedValue({ id: 55, order_id: 326, status: 'Pending' });

    const res = mockRes();
    await rejectReturn(mockReq({ id: '326' }, { adminNote: 'Không đủ bằng chứng' }), res);

    expect(tx.returnRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Rejected' }) })
    );
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Return_Rejected' }) })
    );
    // Delivered gốc vẫn được tính doanh thu → reject không được trừ
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('từ Return_Requested (luồng thường): vẫn không đụng doanh thu', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ status: 'Return_Requested' });
    tx.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'Return_Requested' });
    tx.returnRequest.findUnique.mockResolvedValue({ id: 55, order_id: 326, status: 'Pending' });

    const res = mockRes();
    await rejectReturn(mockReq({ id: '326' }, { adminNote: 'Đơn còn cần' }), res);

    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Return_Rejected' }) })
    );
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});