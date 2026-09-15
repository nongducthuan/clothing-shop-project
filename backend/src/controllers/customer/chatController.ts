import { Request, Response } from 'express';
import { generateAiResponse, ChatMessageHistory } from '../../services/aiService';

// Store chat sessions in memory
const activeChatSessions: Record<string, ChatMessageHistory[]> = {};

export const handleChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message } = req.body;

        if (!message) {
            res.status(400).json({ error: "Message content is required." });
            return;
        }

        const reply = await generateAiResponse(message);
        res.status(200).json({ reply });
    } catch (err: any) {
        console.error(`[AI Engine Error]:`, err.message || err);
        res.status(500).json({ error: "Internal AI Engine error occurred." });
    }
};

export const handleChatWithHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, sessionId } = req.body;

        if (!message || !sessionId) {
            res.status(400).json({ error: "Both message and sessionId are required." });
            return;
        }

        if (!activeChatSessions[sessionId]) {
            activeChatSessions[sessionId] = [];
        }

        const history = activeChatSessions[sessionId];
        const reply = await generateAiResponse(message, history);

        // Update session history
        activeChatSessions[sessionId].push({ role: 'user', content: message });
        activeChatSessions[sessionId].push({ role: 'ai', content: reply });

        // Keep last 8 messages in session history
        if (activeChatSessions[sessionId].length > 8) {
            activeChatSessions[sessionId] = activeChatSessions[sessionId].slice(-8);
        }

        res.status(200).json({ reply });
    } catch (err: any) {
        console.error(`[AI Engine Error]:`, err.message || err);
        res.status(500).json({ error: "Internal AI Engine error occurred." });
    }
};

export const clearChatHistory = (req: Request, res: Response): void => {
    const { sessionId } = req.body;

    if (sessionId && activeChatSessions[sessionId]) {
        delete activeChatSessions[sessionId];
        res.status(200).json({ message: "Chat history cleared successfully." });
        return;
    }

    res.status(400).json({ error: "Session ID not found." });
};
