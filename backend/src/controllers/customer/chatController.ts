import { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';

// Store chat sessions in memory
const activeChatSessions: Record<string, any[]> = {};

const pythonEnginePath = path.join(__dirname, '../../ai_assistant/core_engine.py');
const venvPythonPath = process.env.PYTHON_PATH || path.join(__dirname, '../../../../../../../env/Scripts/python.exe');
const spawnOptions = {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
};

export const handleChat = (req: Request, res: Response): void => {
    const { message } = req.body;

    if (!message) {
        res.status(400).json({ error: "Message content is required." });
        return;
    }

    const pythonProcess = spawn(venvPythonPath, [pythonEnginePath, message], spawnOptions);

    let aiResponse = '';
    let errorLog = '';

    pythonProcess.stdout.on('data', (data) => {
        aiResponse += data.toString('utf8');
    });

    pythonProcess.stderr.on('data', (data) => {
        errorLog += data.toString('utf8');
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            res.status(200).json({ reply: aiResponse.trim() });
            return;
        }

        console.error(`[AI Engine Error]: ${errorLog}`);
        res.status(500).json({ error: "Internal AI Engine error occurred." });
    });
};

export const handleChatWithHistory = (req: Request, res: Response): void => {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
        res.status(400).json({ error: "Both message and sessionId are required." });
        return;
    }

    if (!activeChatSessions[sessionId]) {
        activeChatSessions[sessionId] = [];
    }

    const historyString = JSON.stringify(activeChatSessions[sessionId]);
    const pythonProcess = spawn(venvPythonPath, [pythonEnginePath, message, historyString], spawnOptions);

    let aiResponse = '';
    let errorLog = '';

    pythonProcess.stdout.on('data', (data) => {
        aiResponse += data.toString('utf8');
    });

    pythonProcess.stderr.on('data', (data) => {
        errorLog += data.toString('utf8');
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            const finalReply = aiResponse.trim();

            activeChatSessions[sessionId].push({ role: 'user', content: message });
            activeChatSessions[sessionId].push({ role: 'ai', content: finalReply });

            if (activeChatSessions[sessionId].length > 8) {
                activeChatSessions[sessionId] = activeChatSessions[sessionId].slice(-8);
            }

            res.status(200).json({ reply: finalReply });
            return;
        }

        console.error(`[AI Engine Error]: ${errorLog}`);
        res.status(500).json({ error: "Internal AI Engine error occurred." });
    });
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
