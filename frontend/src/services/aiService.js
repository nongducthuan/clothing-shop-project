import API from "./apiClient";

export const sendChatMessage = async ({ message, sessionId }) => {
  const res = await API.post("/api/chat/message-with-history", {
    message,
    sessionId,
  });
  return res.data;
};

export const clearChatHistory = async ({ sessionId }) => {
  const res = await API.post("/api/chat/clear-history", {
    sessionId,
  });
  return res.data;
};
