import { Request, Response } from 'express';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../../../prisma/client';
import { sendOtpEmail } from '../../utils/emailService';
import { formatOrderResponse } from '../../utils/formatOrder';

function hashOtp(code: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is required to protect OTP data.');
    return createHmac('sha256', secret).update(code).digest('hex');
}

function otpMatches(storedHash: string, submittedCode: string): boolean {
    if (!/^\d{6}$/.test(submittedCode) || !/^[a-f\d]{64}$/i.test(storedHash)) return false;
    const expected = Buffer.from(storedHash, 'hex');
    const actual = Buffer.from(hashOtp(submittedCode), 'hex');
    return timingSafeEqual(expected, actual);
}

export const sendOtpController = async (req: Request, res: Response): Promise<void> => {
    const { email, lang: bodyLang, language: bodyLanguage } = req.body;
    if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
    }
    const headerLang = (req.headers['accept-language'] || req.headers['language'] || 'vi') as string;
    const rawLang = ((bodyLang || bodyLanguage || headerLang) as string).toLowerCase();
    const isEnglish = rawLang.startsWith('en');
    const emailLang = isEnglish ? 'en' : 'vi';

    try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentOtp = await prisma.otp.findFirst({
            where: { email, created_at: { gte: oneMinuteAgo } }
        });

        if (recentOtp) {
            res.status(429).json({ message: "Please wait 1 minute before requesting a new OTP code." });
            return;
        }

        const code = randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.$transaction(async (tx) => {
            await tx.otp.deleteMany({ where: { email } });
            await tx.otp.create({
                data: { email, code: hashOtp(code), expires_at: expiresAt }
            });
        });

        const emailResult = await sendOtpEmail(email, code, emailLang);
        if (!emailResult.success) {
            res.status(500).json({ message: "Failed to send OTP email: " + emailResult.error });
            return;
        }
        res.json({ message: "OTP sent to your email successfully" });
    } catch (err) {
        console.error("Send OTP Error:", err);
        res.status(500).json({ message: "Server error while sending OTP" });
    }
};

export const verifyOtpAndGetOrders = async (req: Request, res: Response): Promise<void> => {
    const { email, code } = req.body;

    try {
        const otpData = await prisma.otp.findFirst({
            where: { email }
        });

        if (!otpData) {
            res.status(400).json({ message: "Invalid OTP code!" });
            return;
        }

        // Giới hạn số lần thử sai để chống brute-force
        const MAX_ATTEMPTS = 5;
        if (otpData.failed_attempts >= MAX_ATTEMPTS) {
            await prisma.otp.deleteMany({ where: { email } });
            res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
            return;
        }

        if (new Date() > new Date(otpData.expires_at)) {
            await prisma.otp.deleteMany({ where: { email } });
            res.status(400).json({ message: "OTP code has expired!" });
            return;
        }

        if (!otpMatches(otpData.code, String(code ?? ''))) {
            await prisma.otp.update({
                where: { id: otpData.id },
                data: { failed_attempts: { increment: 1 } }
            });
            const remaining = MAX_ATTEMPTS - otpData.failed_attempts - 1;
            res.status(400).json({ message: `Invalid OTP code! ${remaining} attempt(s) remaining.` });
            return;
        }

        const orders = await prisma.order.findMany({
            where: { email },
            orderBy: { created_at: 'desc' },
            include: {
                return_request: {
                    include: {
                        items: {
                            include: {
                                order_item: {
                                    include: {
                                        product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                                        color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                                        size: { select: { size: true } }
                                    }
                                }
                            }
                        }
                    }
                },
                voucher: {
                    select: { id: true, code: true, discount_percent: true, max_discount_amount: true }
                },
                items: {
                    include: {
                        promotion: { select: { id: true, buy_product_id: true, gift_product_id: true, buy_quantity: true, gift_quantity: true } },
                        product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                        color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                        size: { select: { size: true } }
                    }
                }
            }
        });

        const formattedOrders = orders.map(formatOrderResponse);

        await prisma.otp.deleteMany({ where: { email } });
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is required to create guest order access.');
        const guestOrderAccessToken = jwt.sign(
            { purpose: 'guest-order-access', email: String(email).toLowerCase() },
            secret,
            { expiresIn: '15m' }
        );
        res.json({ message: "Verification successful", orders: formattedOrders, guestOrderAccessToken });
    } catch (err) {
        console.error("Order verification error:", err);
        res.status(500).json({ message: "System error while fetching orders" });
    }
};
