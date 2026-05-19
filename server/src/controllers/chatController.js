const { spawn } = require('child_process');
const path = require('path');

const activeChatSessions = {};

const pythonEnginePath = path.join(__dirname, '../ai_assistant/core_engine.py');
const venvPythonPath = process.env.PYTHON_PATH || path.join(__dirname, '../../../env/Scripts/python.exe');
const spawnOptions = {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
};

const handleChat = (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message content is required." });
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
            return res.status(200).json({ reply: aiResponse.trim() });
        }

        console.error(`[AI Engine Error]: ${errorLog}`);
        return res.status(500).json({ error: "Internal AI Engine error occurred." });
    });
};

const handleChatWithHistory = (req, res) => {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
        return res.status(400).json({ error: "Both message and sessionId are required." });
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

            return res.status(200).json({ reply: finalReply });
        }

        console.error(`[AI Engine Error]: ${errorLog}`);
        return res.status(500).json({ error: "Internal AI Engine error occurred." });
    });
};

const clearChatHistory = (req, res) => {
    const { sessionId } = req.body;

    if (sessionId && activeChatSessions[sessionId]) {
        delete activeChatSessions[sessionId];
        return res.status(200).json({ message: "Chat history cleared successfully." });
    }

    return res.status(400).json({ error: "Session ID not found." });
};

module.exports = {
    handleChat,
    handleChatWithHistory,
    clearChatHistory
};
