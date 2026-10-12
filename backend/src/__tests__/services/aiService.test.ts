jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn(() => ({
            generateContent: jest.fn().mockResolvedValue({
                response: { text: () => 'Mình có thể giúp bạn chọn mẫu phù hợp.' },
            }),
        })),
    })),
}));

jest.mock('../../../prisma/client', () => ({
    __esModule: true,
    default: {
        product: { findMany: jest.fn() },
        category: { findMany: jest.fn() },
        sale: { findMany: jest.fn() },
        voucher: { findMany: jest.fn() },
    },
}));

import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../../prisma/client';
import { generateAiResponse } from '../../services/aiService';

type MockPrisma = {
    product: { findMany: jest.Mock };
    category: { findMany: jest.Mock };
    sale: { findMany: jest.Mock };
    voucher: { findMany: jest.Mock };
};

const mockPrisma = prisma as unknown as MockPrisma;

describe('AI sales assistant context and conversation style', () => {
    beforeAll(() => {
        process.env.GOOGLE_API_KEY = 'test-google-api-key';
    });

    beforeEach(() => {
        const now = new Date();
        jest.clearAllMocks();
        mockPrisma.product.findMany.mockResolvedValue([
            {
                id: 8,
                name: 'Wide-Leg Trousers',
                name_vi: 'Quần Tây Nữ Cạp Cao Ống Rộng',
                price: 320000,
                gender: 'female',
                description: 'High-waisted wide-leg trousers',
                description_vi: 'Quần cạp cao, ống rộng.',
                is_active: true,
                created_at: new Date('2026-01-01T00:00:00.000Z'),
                category: { name: 'Trousers', name_vi: 'Quần Tây' },
            },
        ]);
        mockPrisma.category.findMany.mockResolvedValue([
            { name: 'Trousers', name_vi: 'Quần Tây' },
        ]);
        mockPrisma.sale.findMany.mockResolvedValue([
            {
                id: 1,
                name: 'Summer Sale',
                name_vi: 'Sale Mùa Hè',
                discount_percent: 20,
                apply_scope: 'product',
                start_date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                end_date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                product_sales: [{ product: { name: 'Wide-Leg Trousers', name_vi: 'Quần Tây Nữ Cạp Cao Ống Rộng' } }],
                sale_categories: [],
            },
        ]);
        mockPrisma.voucher.findMany.mockResolvedValue([
            {
                code: 'LOOM10',
                discount_percent: 10,
                max_discount_amount: 100000,
                min_order_value: 200000,
                usage_limit: 10,
                used_count: 2,
                status: true,
                start_date: null,
                end_date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                apply_scope: 'all',
                product_vouchers: [],
                voucher_categories: [],
            },
            {
                code: 'EXHAUSTED',
                discount_percent: 5,
                max_discount_amount: null,
                min_order_value: 0,
                usage_limit: 3,
                used_count: 3,
                status: true,
                start_date: null,
                end_date: null,
                apply_scope: 'all',
                product_vouchers: [],
                voucher_categories: [],
            },
        ]);
    });

    it('uses conversational instructions and fetches currently valid promotions on each turn', async () => {
        const answer = await generateAiResponse('Mình đang tìm quần nữ để đi làm.');
        expect(answer).toBe('Mình có thể giúp bạn chọn mẫu phù hợp.');

        expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                status: true,
                start_date: { lte: expect.any(Date) },
                end_date: { gte: expect.any(Date) },
            }),
        }));

        const voucherCall = mockPrisma.voucher.findMany.mock.calls[0][0] as {
            where: { status: boolean; AND: Array<{ OR: Array<Record<string, unknown>> }> };
        };
        expect(voucherCall.where.status).toBe(true);
        expect(voucherCall.where.AND).toHaveLength(2);
        expect(voucherCall.where.AND[0].OR[0]).toEqual({ start_date: null });
        expect(voucherCall.where.AND[0].OR[1].start_date).toEqual({ lte: expect.any(Date) });
        expect(voucherCall.where.AND[1].OR[0]).toEqual({ end_date: null });
        expect(voucherCall.where.AND[1].OR[1].end_date).toEqual({ gte: expect.any(Date) });

        const googleMock = GoogleGenerativeAI as unknown as jest.Mock;
        const latestInstance = googleMock.mock.results[googleMock.mock.results.length - 1].value as {
            getGenerativeModel: jest.Mock;
        };
        const modelOptions = latestInstance.getGenerativeModel.mock.calls[0][0] as {
            systemInstruction: string;
        };
        expect(modelOptions.systemInstruction).toContain('Do not begin every reply with the same phrase');
        expect(modelOptions.systemInstruction).toContain('Do not ask again for their gender, budget, preferred style, or purpose');
        expect(modelOptions.systemInstruction).toContain('Sale Mùa Hè');
        expect(modelOptions.systemInstruction).toContain('Chỉ áp dụng cho sản phẩm: Quần Tây Nữ Cạp Cao Ống Rộng');
        expect(modelOptions.systemInstruction).toContain('LOOM10');
        expect(modelOptions.systemInstruction).not.toContain('EXHAUSTED');

        await generateAiResponse('Còn voucher nào đang dùng được không?', [
            { role: 'user', content: 'Mình đang tìm quần nữ để đi làm.' },
            { role: 'ai', content: answer },
        ]);

        // Only catalog data is cached. Promotions and vouchers are checked again each turn.
        expect(mockPrisma.sale.findMany).toHaveBeenCalledTimes(2);
        expect(mockPrisma.voucher.findMany).toHaveBeenCalledTimes(2);
        expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
    });
});
