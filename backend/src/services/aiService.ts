import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../prisma/client';
import type { ProductModel, CategoryModel, SaleModel, VoucherModel } from '../generated/prisma/models.js';

export interface ChatMessageHistory {
    role: 'user' | 'ai' | 'model';
    content: string;
}

// Cache store for database context to avoid fetching DB on every single message
let dbContextCache: string | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

async function getShopContext(): Promise<string> {
    const now = Date.now();
    if (dbContextCache && now - lastCacheTime < CACHE_TTL_MS) {
        return dbContextCache;
    }

    try {
        const [products, categories, promotions, vouchers] = await Promise.all([
            prisma.product.findMany({
                where: { is_active: true },
                orderBy: { created_at: 'desc' },
                include: { category: true }
            }),
            prisma.category.findMany({ select: { name: true, name_vi: true } }),
            prisma.sale.findMany({ where: { status: true } }),
            prisma.voucher.findMany({ where: { status: true } }),
        ]);

        const productSummary = products.map((p: ProductModel & { category: CategoryModel | null }) => 
            `- ${p.name_vi || p.name} (ID: ${p.id}, Giá: ${Number(p.price).toLocaleString('vi-VN')}đ, Danh mục: ${p.category?.name_vi || p.category?.name || 'Khác'})`
        ).join('\n');

        const categorySummary = categories.map((c: Pick<CategoryModel, 'name' | 'name_vi'>) => c.name_vi || c.name).join(', ');

        const promotionSummary = promotions.map((pr: SaleModel) => `- ${pr.name_vi || pr.name}: Giảm ${Number(pr.discount_percent)}%`).join('\n');

        const voucherSummary = vouchers.map((v: VoucherModel) => `- Mã ${v.code}: Giảm ${v.discount_percent ? `${Number(v.discount_percent)}%` : (v.max_discount_amount ? `${Number(v.max_discount_amount).toLocaleString('vi-VN')}đ` : '')}`).join('\n');

        dbContextCache = `
=== THÔNG TIN CỬA HÀNG (CLOTHING SHOP) ===
Danh mục sản phẩm: ${categorySummary}

Sản phẩm nổi bật / mới nhất:
${productSummary}

Chương trình Khuyến mãi đang diễn ra:
${promotionSummary || 'Không có chương trình lớn'}

Mã giảm giá (Voucher) có sẵn:
${voucherSummary || 'Không có mã voucher khả dụng'}

Chính sách cửa hàng:
- Giao hàng: Giao hàng toàn quốc. Tích hợp OpenStreetMap Nominatim để nhập vị trí tự động.
- Thanh toán: Hỗ trợ MoMo, VNPay-QR và COD (Thanh toán khi nhận hàng).
- Đổi/Trả hàng: Khách hàng có thể gửi yêu cầu Đổi/Trả hàng kèm ảnh bằng chứng trong vòng 7 ngày kể từ khi nhận hàng.
- Tra cứu đơn hàng: Tra cứu bằng số điện thoại và xác nhận mã OTP qua Email mà không cần đăng nhập.
- Thành viên: Tích điểm khi mua hàng để tăng hạng thành viên và nhận ưu đãi giảm giá.
`;
        lastCacheTime = now;
        return dbContextCache;
    } catch (err: any) {
        console.error("⚠️ Failed to build DB context for AI:", err.message);
        return "Cửa hàng thời trang quần áo Clothing Shop.";
    }
}

export async function generateAiResponse(message: string, history: ChatMessageHistory[] = [], language: string = 'vi'): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY is not configured in backend environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const shopContext = await getShopContext();

    const defaultLanguage = language === 'en' ? 'English' : 'Vietnamese';
    const languageInstruction = `MATCH the language of the user's input. If the user writes in Vietnamese, reply in Vietnamese. If the user writes in English, reply in English. If the user's language is unclear, default to responding in ${defaultLanguage}.`;

    const systemInstruction = `You are a friendly and professional AI Sales Assistant for the "Clothing Shop" fashion store.
YOUR CORE RESPONSIBILITIES:
1. Answer customer inquiries about products, outfit recommendations, pricing, sales promotions, vouchers, and store policies.
2. Base all your recommendations ONLY on the provided store context below. If a requested product is not in the catalog, politely inform the user and suggest relevant available categories/products.
3. Keep responses concise, polite, helpful, and natural.
4. PRODUCT LINK & ID RULE: Do NOT show raw database IDs (such as "ID: 12" or "(ID: 12)") directly in your text to the customer. Speak naturally using product names. When recommending a product, format its name as a clickable markdown link using its ID, e.g. [Tên sản phẩm](/products/ID).
5. LANGUAGE RULE: ${languageInstruction}
6. FORMATTING RULE: Keep formatting clean and minimal. Avoid excessive markdown asterisk symbols.

STORE DATA CONTEXT:
${shopContext}`;

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
    });

    const contents = history.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();

    return text;
}
